import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const rows = await sql`
    SELECT id, name, role, department, extension, phone, email, pinned, sort_order, active, created_at::text
    FROM contacts
    ORDER BY pinned DESC, sort_order ASC, name ASC
  `;
  return NextResponse.json({ contacts: rows });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  let p: { name?: string; role?: string; department?: string; extension?: string; phone?: string; email?: string; pinned?: boolean; sort_order?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const name = (p.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });
  const rows = await sql`
    INSERT INTO contacts (name, role, department, extension, phone, email, pinned, sort_order)
    VALUES (${name.slice(0, 120)}, ${(p.role ?? '').trim() || null}, ${(p.department ?? '').trim() || null},
            ${(p.extension ?? '').trim() || null}, ${(p.phone ?? '').trim() || null}, ${(p.email ?? '').trim() || null},
            ${p.pinned ?? false}, ${p.sort_order ?? 100})
    RETURNING id, name, role, department, extension, phone, email, pinned, sort_order
  `;
  const row = (rows as { id: number | string; [k: string]: unknown }[])[0];
  await saveVersion('contact', Number(row.id), row);
  return NextResponse.json({ id: Number(row.id) }, { status: 201 });
}
