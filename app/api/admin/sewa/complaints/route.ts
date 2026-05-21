import { NextRequest, NextResponse } from 'next/server';
import { listAdminComplaints } from '@/lib/portal/sewa-reads';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const incDel = req.nextUrl.searchParams.get('includeDeleted') === '1';
  const complaints = await listAdminComplaints({ includeDeleted: incDel, limit: 500 });
  return NextResponse.json({ complaints });
}
