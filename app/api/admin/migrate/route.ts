/**
 * One-shot migration runner for v9 portal schema.
 *
 * POST /api/admin/migrate
 *   Headers: Authorization: Bearer <ADMIN_TOKEN>
 *
 * Idempotent — every statement is CREATE TABLE IF NOT EXISTS, ADD COLUMN
 * IF NOT EXISTS, or INSERT ... ON CONFLICT DO NOTHING. Safe to re-run.
 *
 * Returns per-statement applied/skipped/error status so a failed run shows
 * exactly which statement broke, not just a black-box 500.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { V9_STATEMENTS, V9_SEEDS } from '@/lib/migrations/v9';

export const runtime = 'nodejs';
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.ADMIN_TOKEN || ''}`;
  if (!process.env.ADMIN_TOKEN || auth !== expected) {
    return unauthorized();
  }

  const results: { name: string; ok: boolean; error?: string }[] = [];
  const all = [
    ...V9_STATEMENTS.map((s) => ({ ...s, kind: 'schema' as const })),
    ...V9_SEEDS.map((s) => ({ ...s, kind: 'seed' as const })),
  ];

  for (const stmt of all) {
    try {
      // neon HTTP driver: sql.query for raw strings (not tagged-template).
      // No params so SQL-injection surface is the static V9 array itself.
      await sql.query(stmt.sql);
      results.push({ name: `[${stmt.kind}] ${stmt.name}`, ok: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ name: `[${stmt.kind}] ${stmt.name}`, ok: false, error: msg });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;

  return NextResponse.json(
    {
      applied_at: new Date().toISOString(),
      total: results.length,
      ok: okCount,
      failed: failCount,
      results,
    },
    { status: failCount === 0 ? 200 : 207 },
  );
}
