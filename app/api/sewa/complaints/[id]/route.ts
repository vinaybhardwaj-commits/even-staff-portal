import { NextRequest, NextResponse } from 'next/server';
import { getComplaint } from '@/lib/portal/sewa-reads';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  const c = await getComplaint(id);
  if (!c || c.soft_deleted_at) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // If admin token presented, return full
  const auth = req.headers.get('authorization') || '';
  const isAdmin = !!process.env.ADMIN_TOKEN && auth === `Bearer ${process.env.ADMIN_TOKEN}`;

  if (!isAdmin && c.confidential) {
    return NextResponse.json({
      complaint: {
        ...c,
        description: '[redacted — confidential]',
        custom_fields: null,
        attachment_url: null,
      },
    });
  }
  return NextResponse.json({ complaint: c });
}
