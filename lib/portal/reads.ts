/**
 * Server-side reads for the Home dashboard. Each function is a thin
 * SQL wrapper that returns plain rows. Called from server components
 * during request rendering — no per-card client fetch.
 */
import { sql } from '@/lib/db';

export type Announcement = {
  id: number;
  title: string;
  body: string;
  category: string | null;
  publish_at: string;
};

export type Resource = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  category: string | null;
  icon: string | null;
  pinned: boolean;
  created_at: string;
};

export type Contact = {
  id: number;
  name: string;
  role: string | null;
  department: string | null;
  extension: string | null;
  phone: string | null;
  email: string | null;
  pinned: boolean;
};

export type Video = {
  id: number;
  title: string;
  description: string | null;
  source_type: 'upload' | 'youtube';
  blob_url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
};

export async function getAnnouncements(limit = 12): Promise<Announcement[]> {
  const rows = await sql`
    SELECT id, title, body, category, publish_at::text
    FROM content_items
    WHERE type = 'announcement' AND active = TRUE
      AND (expire_at IS NULL OR expire_at > NOW())
    ORDER BY pinned DESC, publish_at DESC
    LIMIT ${limit}
  `;
  return rows as Announcement[];
}

export async function getResources(limit = 30): Promise<Resource[]> {
  const rows = await sql`
    SELECT id, name, description, url, category, icon, pinned, created_at::text
    FROM resources
    WHERE active = TRUE
    ORDER BY pinned DESC, sort_order ASC, name ASC
    LIMIT ${limit}
  `;
  return rows as Resource[];
}

export async function getContacts(limit = 40): Promise<Contact[]> {
  const rows = await sql`
    SELECT id, name, role, department, extension, phone, email, pinned
    FROM contacts
    WHERE active = TRUE
    ORDER BY pinned DESC, name ASC
    LIMIT ${limit}
  `;
  return rows as Contact[];
}

export async function getHomeVideo(): Promise<Video | null> {
  // app_settings.home_video_id (locked decision #23). When unset OR pointing
  // to a soft-deleted/expired video, getHomeVideo returns null → empty state.
  const setting = (await sql`
    SELECT value FROM app_settings WHERE key = 'home_video_id'
  `) as { value: { id?: number } | string | null }[];
  if (!setting.length || !setting[0]?.value) return null;
  let raw: unknown = setting[0].value;
  // CDMSS pre-created app_settings.value as TEXT (not JSONB), so JSONB writes
  // round-trip through text storage. Reader handles all three shapes:
  // (a) parsed object {id:42}, (b) JSON string '{"id":42}', (c) plain number/string "42".
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { raw = JSON.parse(trimmed); } catch { /* keep as string */ }
    }
  }
  const id = typeof raw === 'object' && raw !== null && 'id' in raw
    ? Number((raw as { id: unknown }).id)
    : typeof raw === 'string' ? Number(raw)
    : typeof raw === 'number' ? raw
    : NaN;
  if (!Number.isFinite(id) || id <= 0) return null;

  const rows = await sql`
    SELECT id, title, description, source_type, blob_url, youtube_video_id, thumbnail_url
    FROM videos
    WHERE id = ${id} AND soft_deleted_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `;
  return (rows[0] as Video | undefined) ?? null;
}

export type SewaMonthlyStats = { raised: number; resolved: number };

export async function getSewaMonthlyStats(): Promise<SewaMonthlyStats> {
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS raised,
      COUNT(*) FILTER (WHERE resolved_at >= date_trunc('month', NOW()))::int AS resolved
    FROM staff_complaints
    WHERE soft_deleted_at IS NULL
  `;
  const r = rows[0] as { raised: number; resolved: number };
  return { raised: r.raised ?? 0, resolved: r.resolved ?? 0 };
}
