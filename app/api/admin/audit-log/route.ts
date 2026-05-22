import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 200), 500);
  const rows = await sql`
    SELECT id, actor_name, action, resource_type, resource_id, meta, created_at::text
    FROM admin_actions
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return NextResponse.json({ actions: rows });
}
