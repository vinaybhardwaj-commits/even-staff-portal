/**
 * v1.7 Sprint G — one-shot seed of example_questions from EXAMPLE_QUESTION_SEED.
 * Idempotent: skips inserts where the same (question, specialty) pair already exists.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { EXAMPLE_QUESTION_SEED } from '@/lib/cdmss/seed-example-questions';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let inserted = 0, skipped = 0;
  for (const s of EXAMPLE_QUESTION_SEED) {
    const exists = await sql`SELECT id FROM example_questions WHERE question = ${s.question} AND specialty = ${s.specialty} LIMIT 1` as { id: number }[];
    if (exists.length) { skipped++; continue; }
    await sql`INSERT INTO example_questions (question, specialty, active, sort_order) VALUES (${s.question}, ${s.specialty}, TRUE, 100)`;
    inserted++;
  }
  return NextResponse.json({ ok: true, inserted, skipped, total: EXAMPLE_QUESTION_SEED.length });
}
