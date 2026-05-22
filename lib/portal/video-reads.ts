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


// v1.3 P3: ordered active-videos list for home carousel.
// sort_order ASC then uploaded_at DESC. Soft-deleted excluded.
export async function getActiveVideosOrdered() {
  const rows = await sql`
    SELECT id, title, description, category, source_type, blob_url, blob_path,
           youtube_url, youtube_video_id, thumbnail_url, uploaded_at,
           COALESCE(sort_order, 100) AS sort_order
    FROM videos
    WHERE soft_deleted_at IS NULL
    ORDER BY COALESCE(sort_order, 100) ASC, uploaded_at DESC
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
