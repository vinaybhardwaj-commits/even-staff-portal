/**
 * v1.2 T6: ⌘K global search.
 *
 * Single ILIKE union across the user-facing content tables, plus
 * compact result shape so the modal can render type-iconed rows.
 * No FTS — at portal scale (a few hundred rows total across all
 * tables) ILIKE is fast enough and avoids the tsvector maintenance cost.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

export type SearchHit = {
  kind: 'bulletin' | 'resource' | 'contact' | 'video' | 'announcement' | 'pilot';
  id: string | number;
  title: string;
  subtitle: string | null;
  href: string;
};

export async function GET(req: NextRequest) {
  try {
  const qRaw = (req.nextUrl.searchParams.get('q') || '').trim();
  if (qRaw.length < 2) return NextResponse.json({ hits: [] });
  const q = `%${qRaw.replace(/[%_]/g, (m) => '\\' + m)}%`;
  const limit = 8;

  // Run in parallel; small datasets each
  const [bulletin, resources, contacts, videos, announcements, pilots] = await Promise.all([
    sql`SELECT id::text AS id, title, author_display_name AS subtitle
        FROM bulletin_posts
        WHERE hidden_at IS NULL AND (title ILIKE ${q} OR body ILIKE ${q})
        ORDER BY last_activity_at DESC LIMIT ${limit}`,
    sql`SELECT id::text AS id, name AS title, COALESCE(category, '') AS subtitle, url AS href
        FROM resources WHERE active = TRUE AND (name ILIKE ${q} OR COALESCE(description,'') ILIKE ${q})
        ORDER BY sort_order, name LIMIT ${limit}`,
    sql`SELECT id::text AS id, name AS title, COALESCE(role, department, '') AS subtitle
        FROM contacts WHERE active = TRUE AND (name ILIKE ${q} OR COALESCE(role,'') ILIKE ${q} OR COALESCE(department,'') ILIKE ${q})
        ORDER BY name LIMIT ${limit}`,
    sql`SELECT id::text AS id, title, COALESCE(category, '') AS subtitle
        FROM videos WHERE soft_deleted_at IS NULL AND (title ILIKE ${q} OR COALESCE(description,'') ILIKE ${q})
        ORDER BY uploaded_at DESC LIMIT ${limit}`,
    sql`SELECT id::text AS id, title, COALESCE(category, '') AS subtitle
        FROM content_items WHERE type = 'announcement' AND active = TRUE
          AND (title ILIKE ${q} OR COALESCE(body,'') ILIKE ${q})
        ORDER BY pinned DESC, created_at DESC LIMIT ${limit}`,
    sql`SELECT id::text AS id, name AS title, COALESCE(description, '') AS subtitle, open_url AS href
        FROM pilot_apps WHERE active = TRUE
          AND (name ILIKE ${q} OR COALESCE(description,'') ILIKE ${q} OR COALESCE(long_description,'') ILIKE ${q})
        ORDER BY sort_order, name LIMIT ${limit}`,
  ]);

  const hits: SearchHit[] = [
    ...bulletin.map((r) => ({ kind: 'bulletin' as const, id: r.id, title: r.title, subtitle: r.subtitle, href: `/bulletin/${r.id}` })),
    ...resources.map((r) => ({ kind: 'resource' as const, id: r.id, title: r.title, subtitle: r.subtitle, href: r.href })),
    ...contacts.map((r) => ({ kind: 'contact' as const, id: r.id, title: r.title, subtitle: r.subtitle, href: `/contacts` })),
    ...videos.map((r) => ({ kind: 'video' as const, id: r.id, title: r.title, subtitle: r.subtitle, href: `/videos/${r.id}` })),
    ...announcements.map((r) => ({ kind: 'announcement' as const, id: r.id, title: r.title, subtitle: r.subtitle, href: `/` })),
    ...pilots.map((r) => ({ kind: 'pilot' as const, id: r.id, title: r.title, subtitle: r.subtitle, href: `/pilot` })),
  ];

  return NextResponse.json({ hits, q: qRaw });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'search_failed', detail: msg }, { status: 500 });
  }
}
