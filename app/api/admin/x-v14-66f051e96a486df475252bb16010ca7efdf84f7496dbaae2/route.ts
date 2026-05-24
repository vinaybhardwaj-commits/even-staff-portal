/**
 * TEMP capability-URL endpoint for v1.7b S0/S1 close-out.
 * Same pattern as v1.7 first close-out. Unguessable URL = cap token.
 * Deleted in next commit immediately after V confirms ran.
 *
 *   GET /api/admin/x-v14-XXX?action=migrate    (adds surface col + backfill)
 *   GET /api/admin/x-v14-XXX?action=seed-ddx   (inserts DDX_SEEDS)
 *   GET /api/admin/x-v14-XXX?action=seed-coach (inserts COACH_SEEDS)
 *
 * All idempotent. seed actions skip rows whose (question, specialty, surface)
 * already exist.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { DDX_SEEDS, COACH_SEEDS } from '@/lib/cdmss/seed-example-questions';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  if (action === 'migrate') return runMigration();
  if (action === 'seed-ddx') return runSeed(DDX_SEEDS, 'ddx');
  if (action === 'seed-coach') return runSeed(COACH_SEEDS, 'coach');
  return NextResponse.json({
    ok: true,
    usage: 'Append ?action=migrate then ?action=seed-ddx then ?action=seed-coach',
    note: 'This endpoint will be deleted in the next commit.',
  });
}

async function runMigration() {
  const statements: string[] = [
    `ALTER TABLE example_questions ADD COLUMN IF NOT EXISTS surface TEXT DEFAULT 'ask'`,
    `UPDATE example_questions SET surface = 'ask' WHERE surface IS NULL`,
    `CREATE INDEX IF NOT EXISTS example_questions_surface_active_specialty_idx ON example_questions (surface, active, specialty)`,
  ];
  const results: { stmt: string; ok: boolean; error?: string }[] = [];
  for (const s of statements) {
    try {
      await (sql as any)(s);
      results.push({ stmt: s.slice(0, 100), ok: true });
    } catch (e: any) {
      results.push({ stmt: s.slice(0, 100), ok: false, error: String(e?.message || e) });
    }
  }
  return NextResponse.json({ action: 'migrate', ok: results.every(r => r.ok), results });
}

async function runSeed(seeds: typeof DDX_SEEDS, surface: 'ddx' | 'coach') {
  let inserted = 0, skipped = 0;
  const errors: { question: string; error: string }[] = [];
  for (const s of seeds) {
    try {
      const exists = await sql`
        SELECT id FROM example_questions
        WHERE question = ${s.question} AND specialty = ${s.specialty} AND surface = ${surface}
        LIMIT 1
      ` as { id: number }[];
      if (exists.length) { skipped++; continue; }
      await sql`
        INSERT INTO example_questions (question, specialty, active, sort_order, surface)
        VALUES (${s.question}, ${s.specialty}, TRUE, 100, ${surface})
      `;
      inserted++;
    } catch (e: any) {
      errors.push({ question: s.question.slice(0, 60), error: String(e?.message || e) });
    }
  }
  return NextResponse.json({
    action: `seed-${surface}`,
    ok: errors.length === 0,
    inserted,
    skipped,
    total: seeds.length,
    errors: errors.length ? errors : undefined,
  });
}
