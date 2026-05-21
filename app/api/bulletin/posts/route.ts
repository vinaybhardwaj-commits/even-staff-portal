import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { listPosts } from '@/lib/portal/bulletin';
import { ANONYMOUS } from '@/lib/portal/identity';

export const runtime = 'nodejs';

const ALLOWED_CATEGORIES = new Set(['clinical', 'ops', 'social', 'general']);

export async function GET() {
  const posts = await listPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  let payload: {
    title?: string;
    body?: string;
    category?: string;
    author_display_name?: string;
    attachment_url?: string | null;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const title = (payload.title ?? '').trim();
  const body = (payload.body ?? '').trim();
  const category = (payload.category ?? 'general').toLowerCase().trim();
  const attachment_url = payload.attachment_url || null;
  const author = (payload.author_display_name ?? '').trim() || ANONYMOUS;

  if (!title) return NextResponse.json({ error: 'title_required' }, { status: 400 });
  if (!body) return NextResponse.json({ error: 'body_required' }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: 'title_too_long' }, { status: 400 });
  if (body.length > 8000) return NextResponse.json({ error: 'body_too_long' }, { status: 400 });
  if (!ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'invalid_category' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO bulletin_posts
      (title, body, category, attachment_url, author_display_name, last_activity_at)
    VALUES (${title}, ${body}, ${category}, ${attachment_url}, ${author.slice(0, 60)}, NOW())
    RETURNING id
  `;
  const id = (rows as { id: number }[])[0]?.id;
  return NextResponse.json({ id }, { status: 201 });
}
