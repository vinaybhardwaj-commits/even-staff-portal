import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { listComplaintTypes } from '@/lib/portal/sewa-reads';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const types = await listComplaintTypes({ includeRetired: true });
  return NextResponse.json({ types });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  let p: { slug?: string; name?: string; description?: string; icon?: string; color?: string; default_severity?: string; sla_low_hours?: number; sla_medium_hours?: number; sla_high_hours?: number; sla_critical_hours?: number; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const slug = (p.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const name = (p.name ?? '').trim();
  const sev = (p.default_severity ?? 'medium').toLowerCase();
  if (!slug || !name) return NextResponse.json({ error: 'slug_and_name_required' }, { status: 400 });
  if (!SEVERITIES.has(sev)) return NextResponse.json({ error: 'bad_default_severity' }, { status: 400 });

  const rows = await sql`
    INSERT INTO complaint_types (slug, name, description, icon, color, default_severity,
      sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours, sort_order)
    VALUES (
      ${slug}, ${name.slice(0, 200)}, ${(p.description ?? '').trim() || null},
      ${(p.icon ?? '').trim() || null}, ${(p.color ?? '').trim() || null}, ${sev},
      ${p.sla_low_hours ?? 96}, ${p.sla_medium_hours ?? 48},
      ${p.sla_high_hours ?? 24}, ${p.sla_critical_hours ?? 4},
      ${p.sort_order ?? 100}
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon,
      color = EXCLUDED.color, default_severity = EXCLUDED.default_severity,
      sla_low_hours = EXCLUDED.sla_low_hours, sla_medium_hours = EXCLUDED.sla_medium_hours,
      sla_high_hours = EXCLUDED.sla_high_hours, sla_critical_hours = EXCLUDED.sla_critical_hours,
      sort_order = EXCLUDED.sort_order, active = TRUE, updated_at = NOW()
    RETURNING id, slug, name
  `;
  const row = (rows as { id: number | string; [k: string]: unknown }[])[0];
  await saveVersion('complaint_type', Number(row.id), row);
  return NextResponse.json({ id: Number(row.id) }, { status: 201 });
}
