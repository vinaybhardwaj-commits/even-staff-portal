import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
function chk(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  return process.env.ADMIN_TOKEN && auth === `Bearer ${process.env.ADMIN_TOKEN}`;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!chk(req)) return unauth();
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!numId) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  let p: { question?: string; specialty?: string; active?: boolean; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const q = p.question?.trim();
  const s = p.specialty?.trim();
  await sql`
    UPDATE example_questions
    SET question = COALESCE(${q ?? null}, question),
        specialty = COALESCE(${s ?? null}, specialty),
        active = COALESCE(${p.active ?? null}, active),
        sort_order = COALESCE(${p.sort_order ?? null}, sort_order),
        updated_at = NOW()
    WHERE id = ${numId}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!chk(req)) return unauth();
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (!numId) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  await sql`DELETE FROM example_questions WHERE id = ${numId}`;
  return NextResponse.json({ ok: true });
}
