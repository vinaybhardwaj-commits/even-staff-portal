import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  let p: { name?: string; description?: string; icon?: string; default_severity?: string; sla_low_hours?: number; sla_medium_hours?: number; sla_high_hours?: number; sla_critical_hours?: number; sort_order?: number; retire?: boolean };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  if (typeof p.name === 'string') await sql`UPDATE complaint_types SET name = ${p.name.trim().slice(0, 200)}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.description === 'string') await sql`UPDATE complaint_types SET description = ${p.description.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.icon === 'string') await sql`UPDATE complaint_types SET icon = ${p.icon.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.default_severity === 'string') {
    const s = p.default_severity.toLowerCase();
    if (!SEVERITIES.has(s)) return NextResponse.json({ error: 'bad_default_severity' }, { status: 400 });
    await sql`UPDATE complaint_types SET default_severity = ${s}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (typeof p.sla_low_hours === 'number') await sql`UPDATE complaint_types SET sla_low_hours = ${p.sla_low_hours}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.sla_medium_hours === 'number') await sql`UPDATE complaint_types SET sla_medium_hours = ${p.sla_medium_hours}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.sla_high_hours === 'number') await sql`UPDATE complaint_types SET sla_high_hours = ${p.sla_high_hours}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.sla_critical_hours === 'number') await sql`UPDATE complaint_types SET sla_critical_hours = ${p.sla_critical_hours}, updated_at = NOW() WHERE id = ${id}`;
  if (typeof p.sort_order === 'number') await sql`UPDATE complaint_types SET sort_order = ${p.sort_order}, updated_at = NOW() WHERE id = ${id}`;
  if (p.retire === true) await sql`UPDATE complaint_types SET retired_at = NOW(), active = FALSE, updated_at = NOW() WHERE id = ${id}`;
  if (p.retire === false) await sql`UPDATE complaint_types SET retired_at = NULL, active = TRUE, updated_at = NOW() WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
