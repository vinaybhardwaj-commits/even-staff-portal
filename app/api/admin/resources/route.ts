import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
function unauthorized() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const rows = await sql`
    SELECT id, name, description, url, category, icon, pinned, sort_order, active, created_at::text
    FROM resources ORDER BY pinned DESC, sort_order ASC, name ASC
  `;
  return NextResponse.json({ resources: rows });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  let p: { name?: string; description?: string; url?: string; category?: string; icon?: string; pinned?: boolean; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const name = (p.name ?? '').trim();
  const url = (p.url ?? '').trim();
  if (!name || !url) return NextResponse.json({ error: 'name_and_url_required' }, { status: 400 });

  const rows = await sql`
    INSERT INTO resources (name, description, url, category, icon, pinned, sort_order)
    VALUES (${name.slice(0, 200)}, ${(p.description ?? '').trim() || null}, ${url}, ${(p.category ?? '').trim() || null}, ${(p.icon ?? '').trim() || null}, ${p.pinned ?? false}, ${p.sort_order ?? 100})
    ON CONFLICT (url) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, icon = EXCLUDED.icon, pinned = EXCLUDED.pinned, sort_order = EXCLUDED.sort_order, active = TRUE, updated_at = NOW()
    RETURNING id, name, description, url, category, icon, pinned, sort_order
  `;
  const row = (rows as { id: number; [k: string]: unknown }[])[0];
  await saveVersion('resource', Number(row.id), row);
  return NextResponse.json({ id: Number(row.id) }, { status: 201 });
}
