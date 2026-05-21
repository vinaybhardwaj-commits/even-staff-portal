import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getFieldsForType } from '@/lib/portal/sewa-reads';

export const runtime = 'nodejs';
const FIELD_TYPES = new Set(['text', 'textarea', 'select', 'number', 'date', 'image']);
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  const fields = await getFieldsForType(id);
  return NextResponse.json({ fields });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const typeId = Number(idStr);
  if (!Number.isFinite(typeId) || typeId <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  let p: { field_slug?: string; field_label?: string; field_type?: string; required?: boolean; sort_order?: number; field_options?: Record<string, unknown> };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const slug = (p.field_slug ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const label = (p.field_label ?? '').trim();
  const ftype = (p.field_type ?? 'text').toLowerCase();
  if (!slug || !label) return NextResponse.json({ error: 'slug_and_label_required' }, { status: 400 });
  if (!FIELD_TYPES.has(ftype)) return NextResponse.json({ error: 'bad_field_type' }, { status: 400 });

  await sql`
    INSERT INTO complaint_type_fields (complaint_type_id, field_slug, field_label, field_type, field_options, required, sort_order)
    VALUES (${typeId}, ${slug}, ${label.slice(0, 120)}, ${ftype}, ${p.field_options ? JSON.stringify(p.field_options) : null}::jsonb, ${p.required ?? false}, ${p.sort_order ?? 100})
    ON CONFLICT (complaint_type_id, field_slug) DO UPDATE SET
      field_label = EXCLUDED.field_label, field_type = EXCLUDED.field_type,
      field_options = EXCLUDED.field_options, required = EXCLUDED.required,
      sort_order = EXCLUDED.sort_order, active = TRUE
  `;
  return NextResponse.json({ ok: true });
}
