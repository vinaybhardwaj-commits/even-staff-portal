import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const rows = await sql`
    SELECT p.id, p.title, p.body, p.category, p.attachment_url, p.author_display_name,
           p.pinned, p.pinned_by, p.pinned_at::text,
           p.hidden_by, p.hidden_at::text, p.hidden_reason,
           p.last_activity_at::text, p.created_at::text,
           COALESCE((SELECT COUNT(*)::int FROM bulletin_comments c WHERE c.post_id = p.id), 0) AS comment_count,
           COALESCE((SELECT COUNT(*)::int FROM bulletin_comments c WHERE c.post_id = p.id AND c.hidden_at IS NOT NULL), 0) AS hidden_comment_count
    FROM bulletin_posts p
    ORDER BY p.pinned DESC, p.last_activity_at DESC
  `;
  return NextResponse.json({ posts: rows });
}
