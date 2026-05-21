import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getResolutionsForType } from '@/lib/portal/sewa-reads';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  const resolutions = await getResolutionsForType(id);
  return NextResponse.json({ resolutions });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const typeId = Number(idStr);
  if (!Number.isFinite(typeId) || typeId <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });
  let p: { slug?: string; label?: string; icon?: string; requires_note?: boolean; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const slug = (p.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const label = (p.label ?? '').trim();
  if (!slug || !label) return NextResponse.json({ error: 'slug_and_label_required' }, { status: 400 });

  await sql`
    INSERT INTO complaint_resolutions (complaint_type_id, slug, label, icon, requires_note, sort_order)
    VALUES (${typeId}, ${slug}, ${label.slice(0, 120)}, ${(p.icon ?? '').trim() || null}, ${p.requires_note ?? false}, ${p.sort_order ?? 100})
    ON CONFLICT (complaint_type_id, slug) DO UPDATE SET
      label = EXCLUDED.label, icon = EXCLUDED.icon, requires_note = EXCLUDED.requires_note,
      sort_order = EXCLUDED.sort_order, active = TRUE, updated_at = NOW()
  `;
  return NextResponse.json({ ok: true });
}
