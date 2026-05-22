import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

const DEFAULT_TAGS = ['patient-impact', 'sla-breach', 'escalate-mgr', 'repeat', 'confidential'];

function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

async function read(): Promise<string[]> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'complaint_suggested_tags'`;
  const v = (rows as { value: unknown }[])[0]?.value;
  if (!v) return DEFAULT_TAGS;
  let raw: unknown = v;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return DEFAULT_TAGS; }
  }
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === 'string').slice(0, 30);
  return DEFAULT_TAGS;
}

export async function GET() {
  // Public — used by admin sewa detail client (which already has admin auth context anyway)
  return NextResponse.json({ tags: await read() });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  let p: { tags?: unknown };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  if (!Array.isArray(p.tags)) return NextResponse.json({ error: 'tags_required_array' }, { status: 400 });
  const cleaned = p.tags.filter((t): t is string => typeof t === 'string' && t.length > 0 && t.length < 60).slice(0, 30);
  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('complaint_suggested_tags', ${JSON.stringify(cleaned)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  return NextResponse.json({ ok: true, tags: cleaned });
}
