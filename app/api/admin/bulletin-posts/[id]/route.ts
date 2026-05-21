import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  const posts = await sql`
    SELECT id, title, body, category, attachment_url, author_display_name,
           pinned, pinned_by, pinned_at::text, hidden_by, hidden_at::text, hidden_reason,
           last_activity_at::text, created_at::text
    FROM bulletin_posts WHERE id = ${id}
  `;
  const post = (posts as Record<string, unknown>[])[0];
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const comments = await sql`
    SELECT id, post_id, parent_comment_id, body, author_display_name,
           hidden_by, hidden_at::text, hidden_reason, created_at::text
    FROM bulletin_comments
    WHERE post_id = ${id}
    ORDER BY created_at ASC
  `;
  return NextResponse.json({ post, comments });
}
