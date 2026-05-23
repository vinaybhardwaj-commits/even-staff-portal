/**
 * v1.6 P2: schema-only migration (idempotent ALTERs).
 * Does NOT backfill or build the IVFFlat index — those are separate calls.
 * Backfill: POST /api/admin/reindex-embeddings-v2 (batched, ~30-60min on 20k chunks)
 * Index:    POST /api/admin/migrate-v12-index (call ONLY after backfill is done)
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const statements = [
    `ALTER TABLE mksap_chunks ADD COLUMN IF NOT EXISTS embedding_v2 vector(1024)`,
    `ALTER TABLE mksap_chunks ADD COLUMN IF NOT EXISTS source_quality_weight REAL DEFAULT 1.0`,
  ];
  const results: { stmt: string; ok: boolean; error?: string }[] = [];
  for (const s of statements) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sql as any)(s);
      results.push({ stmt: s, ok: true });
    } catch (e: unknown) {
      results.push({ stmt: s, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return NextResponse.json({ ok: true, results });
}
