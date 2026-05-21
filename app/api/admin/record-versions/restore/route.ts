/**
 * Restore a record's prior version: applies the chosen snapshot back to
 * the source table THEN writes a NEW version row so history is preserved.
 * Per locked decision #28 "NOT a hard rollback — preserves history".
 *
 * Only supports the editable shapes we have admin CRUD for:
 *   resource, pilot_app, contact, announcement (content_items).
 * Sewa types/fields/resolutions can be restored too but cascading edits
 * to per-type fields/resolutions aren't part of MVP — they'd need a
 * separate restore-cascade endpoint.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { saveVersion } from '@/lib/portal/versions';

export const runtime = 'nodejs';

function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();

  let p: { entity_type?: string; entity_id?: number; version_id?: number };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const et = (p.entity_type || '').trim();
  const eid = Number(p.entity_id);
  const vid = Number(p.version_id);
  if (!et || !Number.isFinite(eid) || !Number.isFinite(vid)) return NextResponse.json({ error: 'bad_args' }, { status: 400 });

  const rows = await sql`SELECT snapshot FROM record_versions WHERE id = ${vid} AND entity_type = ${et} AND entity_id = ${eid}`;
  const snap = (rows as { snapshot: Record<string, unknown> }[])[0]?.snapshot;
  if (!snap) return NextResponse.json({ error: 'snapshot_not_found' }, { status: 404 });

  // Apply snapshot back, table-by-table. Only restore the editable columns.
  switch (et) {
    case 'resource': {
      await sql`
        UPDATE resources SET
          name = ${(snap.name as string) ?? ''},
          description = ${(snap.description as string | null) ?? null},
          url = ${(snap.url as string) ?? ''},
          category = ${(snap.category as string | null) ?? null},
          icon = ${(snap.icon as string | null) ?? null},
          pinned = ${(snap.pinned as boolean) ?? false},
          sort_order = ${(snap.sort_order as number) ?? 100},
          active = TRUE,
          updated_at = NOW()
        WHERE id = ${eid}
      `;
      break;
    }
    case 'pilot_app': {
      await sql`
        UPDATE pilot_apps SET
          name = ${(snap.name as string) ?? ''},
          description = ${(snap.description as string | null) ?? null},
          long_description = ${(snap.long_description as string | null) ?? null},
          status = ${(snap.status as string) ?? 'beta'},
          owner_name = ${(snap.owner_name as string | null) ?? null},
          owner_email = ${(snap.owner_email as string | null) ?? null},
          open_url = ${(snap.open_url as string) ?? ''},
          screenshot_url = ${(snap.screenshot_url as string | null) ?? null},
          sort_order = ${(snap.sort_order as number) ?? 100},
          active = TRUE,
          updated_at = NOW()
        WHERE id = ${eid}
      `;
      break;
    }
    case 'contact': {
      await sql`
        UPDATE contacts SET
          name = ${(snap.name as string) ?? ''},
          role = ${(snap.role as string | null) ?? null},
          department = ${(snap.department as string | null) ?? null},
          extension = ${(snap.extension as string | null) ?? null},
          phone = ${(snap.phone as string | null) ?? null},
          email = ${(snap.email as string | null) ?? null},
          pinned = ${(snap.pinned as boolean) ?? false},
          sort_order = ${(snap.sort_order as number) ?? 100},
          active = TRUE,
          updated_at = NOW()
        WHERE id = ${eid}
      `;
      break;
    }
    case 'announcement': {
      await sql`
        UPDATE content_items SET
          title = ${(snap.title as string) ?? ''},
          body = ${(snap.body as string) ?? ''},
          category = ${(snap.category as string | null) ?? null},
          link = ${(snap.link as string | null) ?? null},
          pinned = ${(snap.pinned as boolean) ?? false},
          publish_at = ${(snap.publish_at as string | null) ?? null},
          expire_at = ${(snap.expire_at as string | null) ?? null},
          active = TRUE,
          updated_at = NOW()
        WHERE id = ${eid}
      `;
      break;
    }
    default:
      return NextResponse.json({ error: 'restore_not_supported_for_type', entity_type: et }, { status: 400 });
  }

  // Write a NEW version row capturing the restored state — preserves history
  await saveVersion(et as Parameters<typeof saveVersion>[0], eid, { ...snap, _restored_from_version_id: vid });
  return NextResponse.json({ ok: true });
}
