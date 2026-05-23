/**
 * TEMPORARY one-shot endpoint at an unguessable URL.
 * Mirrors /api/admin/reindex-embeddings-v2 but skips ADMIN_TOKEN check —
 * the URL path itself acts as the capability token.
 * REMOVE THIS FILE AFTER REINDEX IS COMPLETE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/cdmss/db';
import { llm } from '@/lib/cdmss/llm';
import { computeSourceQualityWeight } from '@/lib/cdmss/source-quality';

export const runtime = 'nodejs';
export const maxDuration = 300;

const EMBED_MODEL_V2 = process.env.EMBED_MODEL_V2 || 'mxbai-embed-large';

type ChunkRow = {
  id: number;
  text: string;
  book: string | null;
  source: string | null;
  chunk_type: string | null;
  token_count: number | null;
};

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // action=schema  → ALTER TABLE (idempotent)
  if (action === 'schema') {
    const stmts = [
      `ALTER TABLE mksap_chunks ADD COLUMN IF NOT EXISTS embedding_v2 vector(1024)`,
      `ALTER TABLE mksap_chunks ADD COLUMN IF NOT EXISTS source_quality_weight REAL DEFAULT 1.0`,
    ];
    const out: { stmt: string; ok: boolean; error?: string }[] = [];
    for (const s of stmts) {
      try { await (sql as unknown as (q: string) => Promise<unknown>)(s); out.push({ stmt: s, ok: true }); }
      catch (e: unknown) { out.push({ stmt: s, ok: false, error: e instanceof Error ? e.message : String(e) }); }
    }
    return NextResponse.json({ ok: true, results: out });
  }

  // action=index  → CREATE INDEX with sqrt(rows) lists
  if (action === 'index') {
    const r = await sql`
      SELECT COUNT(*) FILTER (WHERE embedding_v2 IS NOT NULL)::int AS populated,
             COUNT(*) FILTER (WHERE embedding_v2 IS NULL)::int AS missing
      FROM mksap_chunks
    ` as { populated: number; missing: number }[];
    const populated = r[0]?.populated ?? 0;
    const missing = r[0]?.missing ?? 0;
    if (missing > 0) return NextResponse.json({ error: `incomplete: ${missing} missing`, populated, missing }, { status: 409 });
    const lists = Math.max(10, Math.min(500, Math.round(Math.sqrt(populated))));
    try { await (sql as unknown as (q: string) => Promise<unknown>)(`CREATE INDEX IF NOT EXISTS idx_mksap_chunks_embedding_v2 ON mksap_chunks USING ivfflat (embedding_v2 vector_cosine_ops) WITH (lists = ${lists})`); }
    catch (e: unknown) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
    return NextResponse.json({ ok: true, populated, lists });
  }

  // action=status  → just counts
  if (action === 'status') {
    const r = await sql`
      SELECT COUNT(*) FILTER (WHERE embedding_v2 IS NOT NULL)::int AS populated,
             COUNT(*) FILTER (WHERE embedding_v2 IS NULL)::int AS missing,
             COUNT(*)::int AS total
      FROM mksap_chunks
    ` as { populated: number; missing: number; total: number }[];
    return NextResponse.json(r[0] ?? {});
  }

  // default: reindex batch
  const batch = Math.min(500, Math.max(1, parseInt(url.searchParams.get('batch') || '50', 10)));

  const remainingRows = await sql`
    SELECT COUNT(*)::int AS n FROM mksap_chunks WHERE embedding_v2 IS NULL
  ` as { n: number }[];
  const remainingBefore = remainingRows[0]?.n ?? 0;
  if (remainingBefore === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0, message: 'all done' });
  }

  const rows = await sql`
    SELECT id, text, book, source, chunk_type, token_count
    FROM mksap_chunks
    WHERE embedding_v2 IS NULL AND text IS NOT NULL AND length(text) > 0
    ORDER BY id ASC
    LIMIT ${batch}
  ` as ChunkRow[];

  let processed = 0;
  const errors: { id: number; error: string }[] = [];
  const t0 = Date.now();

  for (const row of rows) {
    try {
      const r = await llm.embeddings.create({ model: EMBED_MODEL_V2, input: row.text.slice(0, 1500) });
      const vec = r.data[0]?.embedding;
      if (!vec || vec.length !== 1024) throw new Error(`bad shape: ${vec?.length}`);
      const vlit = '[' + vec.map((x) => x.toFixed(7)).join(',') + ']';
      const weight = computeSourceQualityWeight({
        book: row.book, source: row.source, chunk_type: row.chunk_type, token_count: row.token_count,
      });
      await sql`UPDATE mksap_chunks SET embedding_v2 = ${vlit}::vector, source_quality_weight = ${weight} WHERE id = ${row.id}`;
      processed++;
    } catch (e: unknown) {
      errors.push({ id: row.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const ms = Date.now() - t0;
  const remainingAfter = Math.max(0, remainingBefore - processed);
  return NextResponse.json({
    ok: true, processed, errors, remaining: remainingAfter,
    elapsed_ms: ms, avg_ms_per_chunk: processed ? Math.round(ms / processed) : null,
    embed_model: EMBED_MODEL_V2,
  });
}

export const GET = POST;  // allow GET for easier polling from browser
