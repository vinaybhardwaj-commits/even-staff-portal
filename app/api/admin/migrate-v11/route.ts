import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const results: { stmt: string; ok: boolean; error?: string }[] = [];
  const statements = [
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 100`,
    `CREATE INDEX IF NOT EXISTS videos_carousel_idx ON videos (soft_deleted_at, sort_order, uploaded_at DESC)`,
  ];
  for (const s of statements) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sql as any)(s);
      results.push({ stmt: s, ok: true });
    } catch (e: unknown) {
      results.push({ stmt: s, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return NextResponse.json({ ok: true, results });
}
