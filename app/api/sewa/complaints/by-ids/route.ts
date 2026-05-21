import { NextRequest, NextResponse } from 'next/server';
import { listComplaintsByIds } from '@/lib/portal/sewa-reads';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('ids') || '';
  const ids = raw.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) return NextResponse.json({ complaints: [] });
  const complaints = await listComplaintsByIds(ids.slice(0, 100));

  // Redact confidential bodies for non-admin readers
  const auth = req.headers.get('authorization') || '';
  const isAdmin = !!process.env.ADMIN_TOKEN && auth === `Bearer ${process.env.ADMIN_TOKEN}`;
  const out = complaints.map((c) => {
    if (!isAdmin && c.confidential) {
      return { ...c, description: '[redacted — confidential]', custom_fields: null, attachment_url: null };
    }
    return c;
  });
  return NextResponse.json({ complaints: out });
}
