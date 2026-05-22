import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logAdminAction } from '@/lib/portal/audit';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  let payload: { title?: string; description?: string; category?: string; expires_at?: string | null; thumbnail_url?: string | null };
  try { payload = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  // Build dynamic update from allowed fields
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (typeof payload.title === 'string') { sets.push('title'); vals.push(payload.title.trim().slice(0, 200)); }
  if (typeof payload.description === 'string') { sets.push('description'); vals.push(payload.description.trim() || null); }
  if (typeof payload.category === 'string') { sets.push('category'); vals.push(payload.category.trim() || null); }
  if ('expires_at' in payload) { sets.push('expires_at'); vals.push(payload.expires_at || null); }

  if (sets.length === 0) return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });

  // Use tagged-template per-field updates (Neon HTTP can't easily do dynamic UPDATE with mixed columns)
  // Simplest path: explicit if-blocks since we only have 4 fields
  if (typeof payload.title === 'string') await sql`UPDATE videos SET title = ${payload.title.trim().slice(0, 200)} WHERE id = ${id}`;
  if (typeof payload.description === 'string') await sql`UPDATE videos SET description = ${payload.description.trim() || null} WHERE id = ${id}`;
  if (typeof payload.category === 'string') await sql`UPDATE videos SET category = ${payload.category.trim() || null} WHERE id = ${id}`;
  if ('expires_at' in payload) await sql`UPDATE videos SET expires_at = ${payload.expires_at || null} WHERE id = ${id}`;
  if ('thumbnail_url' in payload) await sql`UPDATE videos SET thumbnail_url = ${payload.thumbnail_url || null} WHERE id = ${id}`;

  await logAdminAction('edit', 'video', id, {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  await sql`UPDATE videos SET soft_deleted_at = NOW() WHERE id = ${id}`;
  // If this video was the home video, clear it
  await sql`
    DELETE FROM app_settings
    WHERE key = 'home_video_id' AND (value::text)::int = ${id}
  `;
  return NextResponse.json({ ok: true });
}
