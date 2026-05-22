import { NextRequest, NextResponse } from 'next/server';
import { getHomeLayout, setHomeLayout, DEFAULT_HOME_LAYOUT } from '@/lib/portal/settings';
import { sql } from '@/lib/db';
import { logAdminAction } from '@/lib/portal/audit';

export const runtime = 'nodejs';

function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const home_layout = await getHomeLayout();
  return NextResponse.json({ home_layout, defaults: DEFAULT_HOME_LAYOUT });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  let p: { home_layout?: unknown };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const next = p.home_layout;
  if (!next || typeof next !== 'object') return NextResponse.json({ error: 'home_layout_required' }, { status: 400 });

  // Write a record_versions snapshot too so settings has a history trail
  await setHomeLayout(next as Parameters<typeof setHomeLayout>[0]);
  await logAdminAction('settings_save', 'home_layout', 0, {});
  await sql`
    INSERT INTO record_versions (entity_type, entity_id, version_num, snapshot, changed_by)
    SELECT 'home_layout', 0, COALESCE(MAX(version_num), 0) + 1, ${JSON.stringify(next)}::jsonb, 'Admin'
    FROM record_versions WHERE entity_type = 'home_layout' AND entity_id = 0
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  // Reset to defaults
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  await setHomeLayout(DEFAULT_HOME_LAYOUT);
  await logAdminAction('settings_reset', 'home_layout', 0, {});
  return NextResponse.json({ ok: true, home_layout: DEFAULT_HOME_LAYOUT });
}
