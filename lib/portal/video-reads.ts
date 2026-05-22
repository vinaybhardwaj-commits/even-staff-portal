import { sql } from '@/lib/db';

export type Video = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  source_type: 'upload' | 'youtube';
  blob_url: string | null;
  blob_path: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  size_bytes: number | null;
  uploaded_at: string;
  expires_at: string | null;
  uploaded_by: string | null;
  soft_deleted_at: string | null;
};

export async function listVideos(opts: { includeDeleted?: boolean } = {}): Promise<Video[]> {
  const rows = opts.includeDeleted
    ? await sql`
        SELECT id, title, description, category, source_type, blob_url, blob_path,
               youtube_url, youtube_video_id, thumbnail_url, size_bytes,
               uploaded_at::text, expires_at::text, uploaded_by, soft_deleted_at::text
        FROM videos
        ORDER BY uploaded_at DESC
      `
    : await sql`
        SELECT id, title, description, category, source_type, blob_url, blob_path,
               youtube_url, youtube_video_id, thumbnail_url, size_bytes,
               uploaded_at::text, expires_at::text, uploaded_by, soft_deleted_at::text
        FROM videos
        WHERE soft_deleted_at IS NULL
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY uploaded_at DESC
      `;
  return rows as Video[];
}

export async function getVideo(id: number): Promise<Video | null> {
  const rows = await sql`
    SELECT id, title, description, category, source_type, blob_url, blob_path,
           youtube_url, youtube_video_id, thumbnail_url, size_bytes,
           uploaded_at::text, expires_at::text, uploaded_by, soft_deleted_at::text
    FROM videos
    WHERE id = ${id}
  `;
  return (rows[0] as Video | undefined) ?? null;
}


// v1.3 P3 + hotfix: ordered active-videos list for home carousel.
// home_video_id wins position 1 regardless of sort_order — sort_order then
// orders the rest. This makes Set Home idempotent against sort_order drift.
export async function getActiveVideosOrdered() {
  // Read home_video_id (CDMSS-era TEXT col so we handle both JSON-object and string)
  const setting = (await sql`SELECT value FROM app_settings WHERE key = 'home_video_id'`) as { value: unknown }[];
  let homeId: number | null = null;
  if (setting.length && setting[0]?.value != null) {
    let raw: unknown = setting[0].value;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { /* keep as string */ } }
    if (typeof raw === 'object' && raw !== null && 'id' in raw) {
      const v = (raw as { id: unknown }).id;
      homeId = typeof v === 'number' ? v : Number(v);
    } else if (typeof raw === 'number') {
      homeId = raw;
    } else if (typeof raw === 'string') {
      const n = Number(raw);
      if (Number.isFinite(n)) homeId = n;
    }
    if (!Number.isFinite(homeId as number)) homeId = null;
  }
  const rows = await sql`
    SELECT id, title, description, category, source_type, blob_url, blob_path,
           youtube_url, youtube_video_id, thumbnail_url, uploaded_at,
           COALESCE(sort_order, 100) AS sort_order
    FROM videos
    WHERE soft_deleted_at IS NULL
    ORDER BY
      CASE WHEN id = ${homeId} THEN 0 ELSE 1 END,
      COALESCE(sort_order, 100) ASC,
      uploaded_at DESC
    LIMIT 50
  `;
  return rows as Array<{
    id: number | string; title: string; description: string | null;
    category: string | null; source_type: 'upload' | 'youtube';
    blob_url: string | null; blob_path: string | null;
    youtube_url: string | null; youtube_video_id: string | null;
    thumbnail_url: string | null; uploaded_at: string; sort_order: number;
  }>;
}
