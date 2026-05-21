/**
 * Version history endpoints — per locked decision #28.
 *
 * GET  /api/admin/record-versions?entity_type=X&entity_id=N
 *      → { versions: [{id, version_num, snapshot, changed_by, changed_at}, ...] }
 * POST /api/admin/record-versions/restore
 *      body: { entity_type, entity_id, version_id }
 *      → applies the chosen snapshot back to the source table AND writes
 *        a NEW version row so history is preserved (NOT a hard rollback).
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';
const ENTITY_TYPES = new Set(['resource', 'pilot_app', 'announcement', 'contact', 'video', 'complaint_type', 'complaint_type_field', 'complaint_resolution']);

function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const sp = req.nextUrl.searchParams;
  const entityType = (sp.get('entity_type') || '').trim();
  const entityId = Number(sp.get('entity_id'));
  if (!ENTITY_TYPES.has(entityType)) return NextResponse.json({ error: 'bad_entity_type' }, { status: 400 });
  if (!Number.isFinite(entityId) || entityId <= 0) return NextResponse.json({ error: 'bad_entity_id' }, { status: 400 });

  const rows = await sql`
    SELECT id, version_num, snapshot, changed_by, changed_at::text
    FROM record_versions
    WHERE entity_type = ${entityType} AND entity_id = ${entityId}
    ORDER BY version_num DESC
    LIMIT 200
  `;
  return NextResponse.json({ versions: rows });
}
