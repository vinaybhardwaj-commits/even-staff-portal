import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  await sql`UPDATE complaint_resolutions SET active = FALSE, updated_at = NOW() WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
