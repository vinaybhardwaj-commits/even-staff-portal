import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
function unauthorized() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }
const STATUSES = new Set(['alpha', 'beta', 'live', 'sunset']);

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const rows = await sql`
    SELECT id, name, description, long_description, status, owner_name, owner_email,
           open_url, screenshot_url, sort_order, active, created_at::text
    FROM pilot_apps ORDER BY sort_order ASC, name ASC
  `;
  return NextResponse.json({ pilot_apps: rows });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  let p: { name?: string; description?: string; long_description?: string; status?: string; owner_name?: string; owner_email?: string; open_url?: string; screenshot_url?: string; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const name = (p.name ?? '').trim();
  const open_url = (p.open_url ?? '').trim();
  const status = (p.status ?? 'beta').trim().toLowerCase();
  if (!name || !open_url) return NextResponse.json({ error: 'name_and_open_url_required' }, { status: 400 });
  if (!STATUSES.has(status)) return NextResponse.json({ error: 'bad_status' }, { status: 400 });

  const rows = await sql`
    INSERT INTO pilot_apps (name, description, long_description, status, owner_name, owner_email, open_url, screenshot_url, sort_order)
    VALUES (
      ${name.slice(0, 200)},
      ${(p.description ?? '').trim() || null},
      ${(p.long_description ?? '').trim() || null},
      ${status},
      ${(p.owner_name ?? '').trim() || null},
      ${(p.owner_email ?? '').trim() || null},
      ${open_url},
      ${(p.screenshot_url ?? '').trim() || null},
      ${p.sort_order ?? 100}
    )
    ON CONFLICT (open_url) DO UPDATE SET
      name = EXCLUDED.name, description = EXCLUDED.description, long_description = EXCLUDED.long_description,
      status = EXCLUDED.status, owner_name = EXCLUDED.owner_name, owner_email = EXCLUDED.owner_email,
      screenshot_url = EXCLUDED.screenshot_url, sort_order = EXCLUDED.sort_order, active = TRUE, updated_at = NOW()
    RETURNING id, name, description, long_description, status, owner_name, owner_email, open_url, screenshot_url, sort_order
  `;
  const row = (rows as { id: number; [k: string]: unknown }[])[0];
  await saveVersion('pilot_app', Number(row.id), row);
  return NextResponse.json({ id: Number(row.id) }, { status: 201 });
}
