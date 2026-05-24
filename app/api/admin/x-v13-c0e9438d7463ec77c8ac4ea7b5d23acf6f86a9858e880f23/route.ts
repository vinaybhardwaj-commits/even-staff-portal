/**
 * TEMP capability-URL endpoint for v1.7 close-out.
 * Same pattern as v1.6 (deleted after use). Unguessable URL = cap token.
 * No ADMIN_TOKEN required because V can't surface the Sensitive Vercel env.
 *
 * Usage (any browser, hit each URL once):
 *   /api/admin/x-v13-XXX?action=migrate
 *   /api/admin/x-v13-XXX?action=seed
 *
 * Both actions are idempotent. This file will be DELETED in the next commit.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { EXAMPLE_QUESTION_SEED } from '@/lib/cdmss/seed-example-questions';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  if (action === 'migrate') return runMigration();
  if (action === 'seed') return runSeed();
  return NextResponse.json({
    ok: true,
    usage: 'Append ?action=migrate then ?action=seed',
    note: 'This endpoint will be deleted in the next commit.',
  });
}

async function runMigration() {
  const statements: string[] = [
    `ALTER TABLE traces ADD COLUMN IF NOT EXISTS question_preview TEXT`,
    `ALTER TABLE traces ADD COLUMN IF NOT EXISTS severity TEXT`,
    `ALTER TABLE traces ADD COLUMN IF NOT EXISTS model_summary JSONB`,
    `ALTER TABLE traces ADD COLUMN IF NOT EXISTS final_answer_text TEXT`,
    `ALTER TABLE traces ADD COLUMN IF NOT EXISTS search_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', COALESCE(question_preview, '') || ' ' || COALESCE(final_answer_text, ''))) STORED`,
    `CREATE INDEX IF NOT EXISTS traces_started_at_idx ON traces (started_at DESC)`,
    `CREATE INDEX IF NOT EXISTS traces_search_gin ON traces USING GIN (search_tsv)`,
    `CREATE INDEX IF NOT EXISTS traces_user_started_idx ON traces (user_id, started_at DESC)`,
    `CREATE TABLE IF NOT EXISTS example_questions (
      id BIGSERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      specialty TEXT NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 100,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS example_questions_active_specialty_idx ON example_questions (active, specialty)`,
  ];
  const results: { stmt: string; ok: boolean; error?: string }[] = [];
  for (const s of statements) {
    try {
      await (sql as any)(s);
      results.push({ stmt: s.slice(0, 80), ok: true });
    } catch (e: any) {
      results.push({ stmt: s.slice(0, 80), ok: false, error: String(e?.message || e) });
    }
  }
  const allOk = results.every(r => r.ok);
  return NextResponse.json({ action: 'migrate', ok: allOk, results });
}

async function runSeed() {
  let inserted = 0, skipped = 0;
  const errors: { question: string; error: string }[] = [];
  for (const s of EXAMPLE_QUESTION_SEED) {
    try {
      const exists = await sql`SELECT id FROM example_questions WHERE question = ${s.question} AND specialty = ${s.specialty} LIMIT 1` as { id: number }[];
      if (exists.length) { skipped++; continue; }
      await sql`INSERT INTO example_questions (question, specialty, active, sort_order) VALUES (${s.question}, ${s.specialty}, TRUE, 100)`;
      inserted++;
    } catch (e: any) {
      errors.push({ question: s.question.slice(0, 60), error: String(e?.message || e) });
    }
  }
  return NextResponse.json({
    action: 'seed',
    ok: errors.length === 0,
    inserted,
    skipped,
    total: EXAMPLE_QUESTION_SEED.length,
    errors: errors.length ? errors : undefined,
  });
}
