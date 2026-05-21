import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  let p: { title?: string; body?: string; category?: string; link?: string; pinned?: boolean; publish_at?: string | null; expire_at?: string | null; active?: boolean };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  if (typeof p.title === 'string') await sql`UPDATE content_items SET title = ${p.title.trim().slice(0, 200)}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.body === 'string') await sql`UPDATE content_items SET body = ${p.body.trim()}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.category === 'string') await sql`UPDATE content_items SET category = ${p.category.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.link === 'string') await sql`UPDATE content_items SET link = ${p.link.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.pinned === 'boolean') await sql`UPDATE content_items SET pinned = ${p.pinned}, updated_at = NOW() WHERE id = ${id}`;
  if ('publish_at' in p) await sql`UPDATE content_items SET publish_at = ${p.publish_at || null}, updated_at = NOW() WHERE id = ${id}`;
  if ('expire_at' in p) await sql`UPDATE content_items SET expire_at = ${p.expire_at || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.active === 'boolean') await sql`UPDATE content_items SET active = ${p.active}, updated_at = NOW() WHERE id = ${id}`;

  const rows = await sql`SELECT id, type, title, body, category, link, pinned, publish_at::text, expire_at::text, active FROM content_items WHERE id = ${id}`;
  const row = (rows as { id: number | string; [k: string]: unknown }[])[0];
  if (row) await saveVersion('announcement', Number(row.id), row);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  await sql`UPDATE content_items SET active = FALSE, updated_at = NOW() WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
