import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const rows = (await sql`SELECT value FROM app_settings WHERE key = 'home_video_id'`) as { value: unknown }[];
  if (!rows[0]?.value) return NextResponse.json({ home_video_id: null });
  const raw = rows[0].value as { id?: number } | string | number;
  const id = typeof raw === 'object' && raw && 'id' in raw ? raw.id
           : typeof raw === 'number' ? raw
           : typeof raw === 'string' ? Number(raw)
           : null;
  return NextResponse.json({ home_video_id: Number.isFinite(id) ? id : null });
}
