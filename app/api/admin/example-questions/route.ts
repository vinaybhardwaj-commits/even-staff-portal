/**
 * v1.7 Sprint G — admin CRUD for example_questions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
function chk(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  return process.env.ADMIN_TOKEN && auth === `Bearer ${process.env.ADMIN_TOKEN}`;
}

export async function GET(req: NextRequest) {
  if (!chk(req)) return unauth();
  const rows = await sql`
    SELECT id, question, specialty, active, sort_order, created_at::text, updated_at::text
    FROM example_questions
    ORDER BY specialty ASC, sort_order ASC, id ASC
  `;
  return NextResponse.json({ questions: rows });
}

export async function POST(req: NextRequest) {
  if (!chk(req)) return unauth();
  let p: { question?: string; specialty?: string; active?: boolean; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const q = (p.question || '').trim();
  const s = (p.specialty || '').trim();
  if (!q || !s) return NextResponse.json({ error: 'question_and_specialty_required' }, { status: 400 });
  const rows = await sql`
    INSERT INTO example_questions (question, specialty, active, sort_order)
    VALUES (${q.slice(0, 500)}, ${s.slice(0, 60)}, ${p.active ?? true}, ${p.sort_order ?? 100})
    RETURNING id, question, specialty, active, sort_order
  `;
  return NextResponse.json({ question: (rows as Record<string, unknown>[])[0] });
}
