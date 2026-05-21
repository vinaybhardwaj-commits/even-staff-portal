import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { bumpPostActivity } from '@/lib/portal/bulletin';
import { ANONYMOUS } from '@/lib/portal/identity';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let payload: {
    post_id?: number;
    parent_comment_id?: number | null;
    body?: string;
    author_display_name?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const postId = Number(payload.post_id);
  const parentId = payload.parent_comment_id ? Number(payload.parent_comment_id) : null;
  const body = (payload.body ?? '').trim();
  const author = (payload.author_display_name ?? '').trim() || ANONYMOUS;

  if (!Number.isFinite(postId) || postId <= 0) return NextResponse.json({ error: 'bad_post_id' }, { status: 400 });
  if (parentId !== null && (!Number.isFinite(parentId) || parentId <= 0)) {
    return NextResponse.json({ error: 'bad_parent_id' }, { status: 400 });
  }
  if (!body) return NextResponse.json({ error: 'body_required' }, { status: 400 });
  if (body.length > 4000) return NextResponse.json({ error: 'body_too_long' }, { status: 400 });

  // Validate post exists + parent (if any) belongs to same post.
  const postExists = (await sql`SELECT 1 FROM bulletin_posts WHERE id = ${postId} AND hidden_at IS NULL`) as unknown[];
  if (postExists.length === 0) return NextResponse.json({ error: 'post_not_found' }, { status: 404 });

  if (parentId !== null) {
    const parent = (await sql`SELECT post_id FROM bulletin_comments WHERE id = ${parentId}`) as { post_id: number }[];
    if (parent.length === 0 || Number(parent[0].post_id) !== postId) {
      return NextResponse.json({ error: 'parent_mismatch' }, { status: 400 });
    }
  }

  const rows = await sql`
    INSERT INTO bulletin_comments
      (post_id, parent_comment_id, body, author_display_name)
    VALUES (${postId}, ${parentId}, ${body}, ${author.slice(0, 60)})
    RETURNING id
  `;
  const id = (rows as { id: number }[])[0]?.id;

  // Bump post activity so the feed re-sorts.
  await bumpPostActivity(postId);

  return NextResponse.json({ id }, { status: 201 });
}
