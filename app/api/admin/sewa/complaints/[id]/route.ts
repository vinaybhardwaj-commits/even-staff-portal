import { NextRequest, NextResponse } from 'next/server';
import { getComplaint, listEventsForComplaint } from '@/lib/portal/sewa-reads';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  const c = await getComplaint(id);
  if (!c) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const events = await listEventsForComplaint(id);
  return NextResponse.json({ complaint: c, events });
}
