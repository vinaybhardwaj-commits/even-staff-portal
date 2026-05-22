import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logAdminAction } from '@/lib/portal/audit';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
function unauthorized() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
const STATUSES = new Set(['alpha', 'beta', 'live', 'sunset']);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  let p: { name?: string; description?: string; long_description?: string; status?: string; owner_name?: string; owner_email?: string; open_url?: string; screenshot_url?: string; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  if (typeof p.name === 'string') await sql`UPDATE pilot_apps SET name = ${p.name.trim().slice(0, 200)}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.description === 'string') await sql`UPDATE pilot_apps SET description = ${p.description.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.long_description === 'string') await sql`UPDATE pilot_apps SET long_description = ${p.long_description.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.status === 'string') {
    const s = p.status.trim().toLowerCase();
    if (!STATUSES.has(s)) return NextResponse.json({ error: 'bad_status' }, { status: 400 });
    await sql`UPDATE pilot_apps SET status = ${s}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (typeof p.owner_name === 'string') await sql`UPDATE pilot_apps SET owner_name = ${p.owner_name.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.owner_email === 'string') await sql`UPDATE pilot_apps SET owner_email = ${p.owner_email.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.open_url === 'string') await sql`UPDATE pilot_apps SET open_url = ${p.open_url.trim()}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.screenshot_url === 'string') await sql`UPDATE pilot_apps SET screenshot_url = ${p.screenshot_url.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.sort_order === 'number') await sql`UPDATE pilot_apps SET sort_order = ${p.sort_order}, updated_at = NOW() WHERE id = ${id}`;

  const rows = await sql`SELECT id, name, description, long_description, status, owner_name, owner_email, open_url, screenshot_url, sort_order, active FROM pilot_apps WHERE id = ${id}`;
  const row = (rows as { id: number; [k: string]: unknown }[])[0];
  if (row) await saveVersion('pilot_app', Number(row.id), row);
  await logAdminAction('edit', 'pilot_app', id, {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  await sql`UPDATE pilot_apps SET active = FALSE, updated_at = NOW() WHERE id = ${id}`;
  await logAdminAction('delete', 'pilot_app', id, {});
  return NextResponse.json({ ok: true });
}
