/**
 * v1.7 Sprint A — schema migration v13.
 * Idempotent (ADD COLUMN / CREATE INDEX / CREATE TABLE all IF NOT EXISTS).
 *
 * Bypassed-auth note: ADMIN_TOKEN is marked Sensitive in Vercel and we
 * already established the pattern of a capability-URL endpoint for v1.6.
 * For v1.7 we have ADMIN_TOKEN gate as standard; if V can't surface it,
 * we'll either ship another temp capability-URL or run the SQL directly
 * in Neon via Chrome MCP (which worked for v1.6 prep).
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const statements = [
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
    `CREATE INDEX IF NOT EXISTS example_questions_specialty_active_idx ON example_questions (specialty, active)`,
    // A6: best-effort backfill of question_preview for older traces from input.question JSONB
    `UPDATE traces SET question_preview = LEFT(COALESCE(input->>'question', ''), 160) WHERE question_preview IS NULL AND input IS NOT NULL`,
  ];

  const results: { stmt: string; ok: boolean; error?: string }[] = [];
  for (const s of statements) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sql as any)(s);
      results.push({ stmt: s.replace(/\s+/g, ' ').slice(0, 100), ok: true });
    } catch (e: unknown) {
      results.push({ stmt: s.replace(/\s+/g, ' ').slice(0, 100), ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return NextResponse.json({ ok: true, results });
}
