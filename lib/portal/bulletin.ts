/**
 * Server-side bulletin reads. Used by /bulletin and /bulletin/[id] pages.
 */
import { sql } from '@/lib/db';

export type BulletinCategory = 'clinical' | 'ops' | 'social' | 'general';

export type BulletinPost = {
  id: number;
  title: string;
  body: string;
  category: BulletinCategory;
  attachment_url: string | null;
  author_display_name: string;
  pinned: boolean;
  pinned_at: string | null;
  hidden_by: string | null;
  hidden_at: string | null;
  hidden_reason: string | null;
  last_activity_at: string;
  created_at: string;
  comment_count: number;
};

export type BulletinComment = {
  id: number;
  post_id: number;
  parent_comment_id: number | null;
  body: string;
  author_display_name: string;
  hidden_by: string | null;
  hidden_at: string | null;
  hidden_reason: string | null;
  created_at: string;
};

export async function listPosts(limit = 50): Promise<BulletinPost[]> {
  const rows = await sql`
    SELECT p.id, p.title, p.body, p.category, p.attachment_url,
           p.author_display_name, p.pinned, p.pinned_at::text,
           p.hidden_by, p.hidden_at::text, p.hidden_reason,
           p.last_activity_at::text, p.created_at::text,
           COALESCE((
             SELECT COUNT(*)::int FROM bulletin_comments c
             WHERE c.post_id = p.id AND c.hidden_at IS NULL
           ), 0) AS comment_count
    FROM bulletin_posts p
    ORDER BY p.pinned DESC, p.last_activity_at DESC
    LIMIT ${limit}
  `;
  return rows as BulletinPost[];
}

export async function getPost(id: number): Promise<BulletinPost | null> {
  const rows = await sql`
    SELECT p.id, p.title, p.body, p.category, p.attachment_url,
           p.author_display_name, p.pinned, p.pinned_at::text,
           p.hidden_by, p.hidden_at::text, p.hidden_reason,
           p.last_activity_at::text, p.created_at::text,
           COALESCE((
             SELECT COUNT(*)::int FROM bulletin_comments c
             WHERE c.post_id = p.id AND c.hidden_at IS NULL
           ), 0) AS comment_count
    FROM bulletin_posts p
    WHERE p.id = ${id}
  `;
  return (rows[0] as BulletinPost | undefined) ?? null;
}

export async function listComments(postId: number): Promise<BulletinComment[]> {
  const rows = await sql`
    SELECT id, post_id, parent_comment_id, body, author_display_name,
           hidden_by, hidden_at::text, hidden_reason, created_at::text
    FROM bulletin_comments
    WHERE post_id = ${postId}
    ORDER BY created_at ASC
  `;
  return rows as BulletinComment[];
}

/** Bump the post's last_activity_at — call after a new comment lands. */
export async function bumpPostActivity(postId: number): Promise<void> {
  await sql`
    UPDATE bulletin_posts
    SET last_activity_at = NOW(), updated_at = NOW()
    WHERE id = ${postId}
  `;
}
