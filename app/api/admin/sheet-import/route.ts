/**
 * One-shot import from the legacy Google Sheet into Neon tables.
 *
 * Sheet ID hardcoded to the EHRC staff portal sheet (same as the legacy
 * static portal). Tabs imported:
 *   - Announcements → content_items (type='announcement')
 *   - Education     → resources (category='Education')
 *   - Links         → resources (category from row.category or 'Other')
 *   - Contacts      → contacts
 *   - Settings      → app_settings (key/value)
 *
 * Idempotent: uses url as natural key for resources, name as best-effort
 * key for contacts, title+publish_at hash for announcements.
 *
 * Usage:
 *   POST /api/admin/sheet-import           — full live import
 *   POST /api/admin/sheet-import?dryRun=1  — fetch + parse but don't write
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SHEET_ID = '1aFmsaZ9UVjHdM_lmj51Vnk3bdeo3RwAuDl0lOC8MTUQ';
const TABS = ['Announcements', 'Education', 'Links', 'Contacts', 'Settings'] as const;

function sheetUrl(tab: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
}

type SheetRow = Record<string, string>;

function parseGviz(text: string): SheetRow[] {
  const m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
  if (!m) return [];
  const j = JSON.parse(m[1]);
  if (!j.table?.rows?.length) return [];
  let headers: string[] = j.table.cols.map((c: { label?: string }) => (c.label || '').trim().toLowerCase());
  let rows = j.table.rows;
  // If Sheets didn't infer headers from row 1, use first data row as headers
  if (!headers.some((h) => h.length > 0) && rows.length > 0) {
    const firstRow = rows[0];
    headers = firstRow.c.map((cell: { v?: unknown } | null) =>
      cell && cell.v != null ? String(cell.v).trim().toLowerCase() : '',
    );
    rows = rows.slice(1);
  }
  return rows
    .map((r: { c: Array<{ v?: unknown; f?: string } | null> }) => {
      const obj: SheetRow = {};
      r.c.forEach((cell, i) => {
        if (!headers[i]) return;
        const v = cell?.v ?? '';
        obj[headers[i]] = v === null || v === undefined ? '' : String(v);
      });
      return obj;
    })
    .filter((row: SheetRow) => Object.values(row).some((v) => v !== ''));
}

async function fetchTab(tab: string): Promise<SheetRow[]> {
  const r = await fetch(sheetUrl(tab), { cache: 'no-store' });
  if (!r.ok) throw new Error(`fetch ${tab}: ${r.status}`);
  const text = await r.text();
  return parseGviz(text);
}

function isTruthy(v: string | undefined | null): boolean {
  const s = String(v ?? '').toLowerCase().trim();
  return s === '' || s === 'true' || s === 'yes' || s === '1';
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';
  const report: Record<string, { fetched: number; written: number; skipped: number; errors: string[] }> = {};

  // 1) Announcements → content_items
  try {
    const rows = await fetchTab('Announcements');
    const summary = { fetched: rows.length, written: 0, skipped: 0, errors: [] as string[] };
    for (const row of rows) {
      const active = isTruthy(row['active']);
      if (!active) { summary.skipped++; continue; }
      const title = (row['title'] || '').trim();
      const body = (row['description'] || row['body'] || '').trim();
      if (!title) { summary.skipped++; continue; }
      const category = (row['type'] || '').trim().toLowerCase() || null;
      const dateRaw = (row['date'] || '').trim();
      let publishAt: string | null = null;
      if (dateRaw) {
        const m = dateRaw.match(/Date\((\d+),(\d+),(\d+)/);
        if (m) {
          const d = new Date(+m[1], +m[2], +m[3]);
          publishAt = d.toISOString();
        } else {
          const d = new Date(dateRaw);
          if (!Number.isNaN(d.getTime())) publishAt = d.toISOString();
        }
      }
      if (dryRun) { summary.written++; continue; }
      try {
        // Idempotency: title + body match → skip
        const existing = (await sql`
          SELECT id FROM content_items
          WHERE type = 'announcement' AND title = ${title} AND body = ${body}
        `) as { id: number }[];
        if (existing.length > 0) { summary.skipped++; continue; }
        await sql`
          INSERT INTO content_items (type, title, body, category, publish_at, created_by)
          VALUES ('announcement', ${title}, ${body}, ${category}, ${publishAt ?? new Date().toISOString()}, 'Sheet import')
        `;
        summary.written++;
      } catch (e) { summary.errors.push(`${title}: ${(e as Error).message}`); }
    }
    report['announcements'] = summary;
  } catch (e) { report['announcements'] = { fetched: 0, written: 0, skipped: 0, errors: [(e as Error).message] }; }

  // 2) Education → resources (category='Education')
  try {
    const rows = await fetchTab('Education');
    const summary = { fetched: rows.length, written: 0, skipped: 0, errors: [] as string[] };
    for (const row of rows) {
      const active = isTruthy(row['active']);
      if (!active) { summary.skipped++; continue; }
      const name = (row['title'] || '').trim();
      const url = (row['link'] || row['url'] || '').trim();
      if (!name || !url) { summary.skipped++; continue; }
      if (dryRun) { summary.written++; continue; }
      try {
        await sql`
          INSERT INTO resources (name, description, url, category, icon, sort_order)
          VALUES (
            ${name.slice(0, 200)},
            ${(row['description'] || '').trim() || null},
            ${url},
            'Education',
            ${(row['icon'] || '').trim() || '🎓'},
            ${100}
          )
          ON CONFLICT (url) DO UPDATE SET
            name = EXCLUDED.name, description = EXCLUDED.description,
            category = EXCLUDED.category, active = TRUE, updated_at = NOW()
        `;
        summary.written++;
      } catch (e) { summary.errors.push(`${name}: ${(e as Error).message}`); }
    }
    report['education'] = summary;
  } catch (e) { report['education'] = { fetched: 0, written: 0, skipped: 0, errors: [(e as Error).message] }; }

  // 3) Links → resources
  try {
    const rows = await fetchTab('Links');
    const summary = { fetched: rows.length, written: 0, skipped: 0, errors: [] as string[] };
    for (const row of rows) {
      const active = isTruthy(row['active']);
      if (!active) { summary.skipped++; continue; }
      const name = (row['name'] || row['title'] || '').trim();
      const url = (row['url'] || row['link'] || '').trim();
      if (!name || !url) { summary.skipped++; continue; }
      if (dryRun) { summary.written++; continue; }
      try {
        await sql`
          INSERT INTO resources (name, description, url, category, icon, sort_order)
          VALUES (
            ${name.slice(0, 200)},
            ${(row['description'] || '').trim() || null},
            ${url},
            ${(row['category'] || '').trim() || 'Other'},
            ${(row['icon'] || '').trim() || '🔗'},
            ${100}
          )
          ON CONFLICT (url) DO UPDATE SET
            name = EXCLUDED.name, description = EXCLUDED.description,
            category = EXCLUDED.category, icon = EXCLUDED.icon,
            active = TRUE, updated_at = NOW()
        `;
        summary.written++;
      } catch (e) { summary.errors.push(`${name}: ${(e as Error).message}`); }
    }
    report['links'] = summary;
  } catch (e) { report['links'] = { fetched: 0, written: 0, skipped: 0, errors: [(e as Error).message] }; }

  // 4) Contacts → contacts
  try {
    const rows = await fetchTab('Contacts');
    const summary = { fetched: rows.length, written: 0, skipped: 0, errors: [] as string[] };
    for (const row of rows) {
      const active = isTruthy(row['active']);
      if (!active) { summary.skipped++; continue; }
      const name = (row['name'] || row['department'] || '').trim();
      if (!name) { summary.skipped++; continue; }
      const extension = (row['number'] || row['extension'] || row['phone'] || '').trim() || null;
      if (dryRun) { summary.written++; continue; }
      try {
        // Idempotency: skip if a contact with same name + extension already exists
        const existing = (await sql`
          SELECT id FROM contacts WHERE name = ${name} AND COALESCE(extension, '') = COALESCE(${extension}, '')
        `) as { id: number }[];
        if (existing.length > 0) { summary.skipped++; continue; }
        await sql`
          INSERT INTO contacts (name, role, department, extension)
          VALUES (
            ${name.slice(0, 120)},
            ${(row['role'] || '').trim() || null},
            ${(row['department'] || '').trim() || null},
            ${extension}
          )
        `;
        summary.written++;
      } catch (e) { summary.errors.push(`${name}: ${(e as Error).message}`); }
    }
    report['contacts'] = summary;
  } catch (e) { report['contacts'] = { fetched: 0, written: 0, skipped: 0, errors: [(e as Error).message] }; }

  // 5) Settings → app_settings
  try {
    const rows = await fetchTab('Settings');
    const summary = { fetched: rows.length, written: 0, skipped: 0, errors: [] as string[] };
    for (const row of rows) {
      const key = (row['key'] || '').trim();
      const value = (row['value'] || '').trim();
      if (!key) { summary.skipped++; continue; }
      if (dryRun) { summary.written++; continue; }
      try {
        // app_settings.value is TEXT per CDMSS — store the raw string
        await sql`
          INSERT INTO app_settings (key, value, updated_at)
          VALUES (${`sheet_${key}`}, ${value}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;
        summary.written++;
      } catch (e) { summary.errors.push(`${key}: ${(e as Error).message}`); }
    }
    report['settings'] = summary;
  } catch (e) { report['settings'] = { fetched: 0, written: 0, skipped: 0, errors: [(e as Error).message] }; }

  return NextResponse.json({
    dryRun,
    sheetId: SHEET_ID,
    tabs: TABS,
    report,
  });
}
