/**
 * v1.6 P2: reindex chunks with mxbai-embed-large (1024-dim) into embedding_v2.
 *
 * Resumable: each call processes one batch (default 50 chunks) and returns
 * progress. Caller polls until { remaining: 0 }. Idempotent (skips chunks
 * that already have embedding_v2 set).
 *
 * Also recomputes source_quality_weight from book/chunk_type/token_count
 * heuristics — see lib/cdmss/source-quality.ts.
 *
 * Worst case ~30-60min total on a 20k-chunk corpus. Vercel maxDuration is
 * 800s for streaming on Pro; we run sync (no streaming needed) with
 * maxDuration=300s per call → ~250 chunks per call comfortably.
 *
 * Usage:
 *   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
 *     'https://evenstaffportal.vercel.app/api/admin/reindex-embeddings-v2?batch=100'
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
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const url = new URL(req.url);
  const batch = Math.min(500, Math.max(1, parseInt(url.searchParams.get('batch') || '50', 10)));

  // Count remaining (embedding_v2 still NULL)
  const remainingRows = await sql`
    SELECT COUNT(*)::int AS n FROM mksap_chunks WHERE embedding_v2 IS NULL
  ` as { n: number }[];
  const remainingBefore = remainingRows[0]?.n ?? 0;
  if (remainingBefore === 0) {
    return NextResponse.json({ ok: true, processed: 0, remaining: 0, message: 'all chunks already have embedding_v2' });
  }

  // Pull next batch
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
      // Re-embed via mxbai-embed-large
      const r = await llm.embeddings.create({ model: EMBED_MODEL_V2, input: row.text.slice(0, 8192) });
      const vec = r.data[0]?.embedding;
      if (!vec || vec.length !== 1024) {
        throw new Error(`unexpected embedding shape: len=${vec?.length}`);
      }
      const vlit = '[' + vec.map((x) => x.toFixed(7)).join(',') + ']';
      // Compute weight from corpus signals
      const weight = computeSourceQualityWeight({
        book: row.book,
        source: row.source,
        chunk_type: row.chunk_type,
        token_count: row.token_count,
      });
      // Write both in a single UPDATE
      await sql`
        UPDATE mksap_chunks
        SET embedding_v2 = ${vlit}::vector,
            source_quality_weight = ${weight}
        WHERE id = ${row.id}
      `;
      processed++;
    } catch (e: unknown) {
      errors.push({ id: row.id, error: e instanceof Error ? e.message : String(e) });
    }
  }

  const ms = Date.now() - t0;
  const remainingAfter = Math.max(0, remainingBefore - processed);
  return NextResponse.json({
    ok: true,
    processed,
    errors,
    remaining: remainingAfter,
    elapsed_ms: ms,
    avg_ms_per_chunk: processed ? Math.round(ms / processed) : null,
    embed_model: EMBED_MODEL_V2,
  });
}
