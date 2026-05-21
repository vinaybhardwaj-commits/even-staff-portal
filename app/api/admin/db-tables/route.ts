/**
 * GET /api/admin/db-tables
 *   Headers: Authorization: Bearer <ADMIN_TOKEN>
 *
 * Introspect: list all public tables + their row counts in the shared
 * Neon DB. Useful for verifying v9 migration applied without colliding
 * with CDMSS tables.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PORTAL_V9_TABLES = new Set([
  'content_items', 'contacts', 'resources', 'pilot_apps', 'videos',
  'bulletin_posts', 'bulletin_comments',
  'staff_complaints', 'staff_complaint_events',
  'admin_actions', 'record_versions',
  'complaint_types', 'complaint_type_fields', 'complaint_resolutions',
  'app_settings',
]);

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.ADMIN_TOKEN || ''}`;
  if (!process.env.ADMIN_TOKEN || auth !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const tablesResult = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public'
    ORDER BY tablename
  `;
  const tables = (tablesResult as { tablename: string }[]).map((r) => r.tablename);

  const counts: Record<string, number | string> = {};
  for (const t of tables) {
    try {
      // Identifier interpolation guarded by allowlist below.
      // Pre-validate against \w to avoid any chance of injection via pg_tables.
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
        counts[t] = 'invalid-name';
        continue;
      }
      const result = await sql(`SELECT COUNT(*)::int AS n FROM "${t}"`);
      counts[t] = (result as { n: number }[])[0]?.n ?? 0;
    } catch (e: unknown) {
      counts[t] = `err: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  const portalV9Present = Array.from(PORTAL_V9_TABLES).filter((t) => tables.includes(t));
  const portalV9Missing = Array.from(PORTAL_V9_TABLES).filter((t) => !tables.includes(t));
  const cdmssOnly = tables.filter((t) => !PORTAL_V9_TABLES.has(t));

  return NextResponse.json({
    total_tables: tables.length,
    portal_v9_present: portalV9Present,
    portal_v9_missing: portalV9Missing,
    cdmss_only: cdmssOnly,
    row_counts: counts,
  });
}
