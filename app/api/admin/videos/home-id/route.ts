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
  let raw: unknown = rows[0].value;
  // app_settings.value is TEXT — JSON values come back as strings, parse them.
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { raw = JSON.parse(trimmed); } catch { /* keep as string */ }
    }
  }
  const id = typeof raw === 'object' && raw !== null && 'id' in raw
    ? Number((raw as { id: unknown }).id)
    : typeof raw === 'number' ? raw
    : typeof raw === 'string' ? Number(raw)
    : NaN;
  return NextResponse.json({ home_video_id: Number.isFinite(id) && id > 0 ? id : null });
}
