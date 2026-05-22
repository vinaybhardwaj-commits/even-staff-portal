import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logAdminAction } from '@/lib/portal/audit';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
function unauthorized() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  let p: { name?: string; description?: string; url?: string; category?: string; icon?: string; pinned?: boolean; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  if (typeof p.name === 'string') await sql`UPDATE resources SET name = ${p.name.trim().slice(0, 200)}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.description === 'string') await sql`UPDATE resources SET description = ${p.description.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.url === 'string') await sql`UPDATE resources SET url = ${p.url.trim()}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.category === 'string') await sql`UPDATE resources SET category = ${p.category.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.icon === 'string') await sql`UPDATE resources SET icon = ${p.icon.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.pinned === 'boolean') await sql`UPDATE resources SET pinned = ${p.pinned}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.sort_order === 'number') await sql`UPDATE resources SET sort_order = ${p.sort_order}, updated_at = NOW() WHERE id = ${id}`;

  const rows = await sql`SELECT id, name, description, url, category, icon, pinned, sort_order, active FROM resources WHERE id = ${id}`;
  const row = (rows as { id: number; [k: string]: unknown }[])[0];
  if (row) await saveVersion('resource', Number(row.id), row);
  await logAdminAction('edit', 'resource', id, {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  await sql`UPDATE resources SET active = FALSE, updated_at = NOW() WHERE id = ${id}`;
  await logAdminAction('delete', 'resource', id, {});
  return NextResponse.json({ ok: true });
}
