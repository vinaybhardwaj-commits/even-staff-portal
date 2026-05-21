import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const rows = await sql`
    SELECT id, type, title, body, category, link, active, pinned,
           publish_at::text, expire_at::text, created_at::text, updated_at::text
    FROM content_items
    WHERE type = 'announcement'
    ORDER BY pinned DESC, COALESCE(publish_at, created_at) DESC
  `;
  return NextResponse.json({ announcements: rows });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  let p: { title?: string; body?: string; category?: string; link?: string; pinned?: boolean; publish_at?: string | null; expire_at?: string | null };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const title = (p.title ?? '').trim();
  const body = (p.body ?? '').trim();
  if (!title || !body) return NextResponse.json({ error: 'title_and_body_required' }, { status: 400 });
  const rows = await sql`
    INSERT INTO content_items (type, title, body, category, link, pinned, publish_at, expire_at, created_by)
    VALUES ('announcement', ${title.slice(0, 200)}, ${body}, ${(p.category ?? '').trim() || null}, ${(p.link ?? '').trim() || null},
            ${p.pinned ?? false}, ${p.publish_at || new Date().toISOString()}, ${p.expire_at || null}, 'Admin')
    RETURNING id, type, title, body, category, link, pinned, publish_at::text, expire_at::text
  `;
  const row = (rows as { id: number | string; [k: string]: unknown }[])[0];
  await saveVersion('announcement', Number(row.id), row);
  return NextResponse.json({ id: Number(row.id) }, { status: 201 });
}
