import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logAdminAction } from '@/lib/portal/audit';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  let p: { name?: string; role?: string; department?: string; extension?: string; phone?: string; email?: string; pinned?: boolean; sort_order?: number; active?: boolean };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  if (typeof p.name === 'string') await sql`UPDATE contacts SET name = ${p.name.trim().slice(0, 120)}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.role === 'string') await sql`UPDATE contacts SET role = ${p.role.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.department === 'string') await sql`UPDATE contacts SET department = ${p.department.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.extension === 'string') await sql`UPDATE contacts SET extension = ${p.extension.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.phone === 'string') await sql`UPDATE contacts SET phone = ${p.phone.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.email === 'string') await sql`UPDATE contacts SET email = ${p.email.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.pinned === 'boolean') await sql`UPDATE contacts SET pinned = ${p.pinned}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.sort_order === 'number') await sql`UPDATE contacts SET sort_order = ${p.sort_order}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.active === 'boolean') await sql`UPDATE contacts SET active = ${p.active}, updated_at = NOW() WHERE id = ${id}`;

  const rows = await sql`SELECT id, name, role, department, extension, phone, email, pinned, sort_order, active FROM contacts WHERE id = ${id}`;
  const row = (rows as { id: number | string; [k: string]: unknown }[])[0];
  if (row) await saveVersion('contact', Number(row.id), row);
  await logAdminAction('edit', 'contact', id, {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  await sql`UPDATE contacts SET active = FALSE, updated_at = NOW() WHERE id = ${id}`;
  await logAdminAction('delete', 'contact', id, {});
  return NextResponse.json({ ok: true });
}
