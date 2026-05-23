/**
 * v1.6 P2: build the IVFFlat index on embedding_v2.
 * Call ONLY after the reindex backfill is fully done — IVFFlat clustering
 * needs real vectors to derive cluster centroids.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  // Count rows first — refuse to build if too many NULLs
  const r = await sql`
    SELECT
      COUNT(*) FILTER (WHERE embedding_v2 IS NOT NULL)::int AS populated,
      COUNT(*) FILTER (WHERE embedding_v2 IS NULL)::int AS missing
    FROM mksap_chunks
  ` as { populated: number; missing: number }[];
  const populated = r[0]?.populated ?? 0;
  const missing = r[0]?.missing ?? 0;
  if (missing > 0) {
    return NextResponse.json(
      { error: `backfill incomplete: ${missing} chunks still need embedding_v2`, populated, missing },
      { status: 409 }
    );
  }
  // Lists rule of thumb: sqrt(rows)
  const lists = Math.max(10, Math.min(500, Math.round(Math.sqrt(populated))));
  const t0 = Date.now();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sql as any)(
      `CREATE INDEX IF NOT EXISTS idx_mksap_chunks_embedding_v2 ON mksap_chunks USING ivfflat (embedding_v2 vector_cosine_ops) WITH (lists = ${lists})`
    );
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), elapsed_ms: Date.now() - t0 }, { status: 500 });
  }
  return NextResponse.json({ ok: true, populated, lists, elapsed_ms: Date.now() - t0 });
}
