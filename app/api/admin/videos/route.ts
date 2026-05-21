import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { listVideos } from '@/lib/portal/video-reads';
import { parseYouTubeId, youtubeThumbnailUrl } from '@/lib/portal/youtube';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();
  const videos = await listVideos({ includeDeleted: true });
  return NextResponse.json({ videos });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauthorized();

  let payload: {
    title?: string;
    description?: string;
    category?: string;
    source_type?: 'upload' | 'youtube';
    blob_url?: string;
    blob_path?: string;
    youtube_url?: string;
    size_bytes?: number;
    mime_type?: string;
  };
  try { payload = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const title = (payload.title ?? '').trim();
  const description = (payload.description ?? '').trim() || null;
  const category = (payload.category ?? '').trim() || null;
  const source = payload.source_type;

  if (!title) return NextResponse.json({ error: 'title_required' }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: 'title_too_long' }, { status: 400 });
  if (source !== 'upload' && source !== 'youtube') return NextResponse.json({ error: 'bad_source_type' }, { status: 400 });

  if (source === 'youtube') {
    const ytId = parseYouTubeId(payload.youtube_url || '');
    if (!ytId) return NextResponse.json({ error: 'bad_youtube_url' }, { status: 400 });
    const thumb = youtubeThumbnailUrl(ytId, 'hq');
    const rows = await sql`
      INSERT INTO videos (title, description, category, source_type, youtube_url, youtube_video_id, thumbnail_url, uploaded_by)
      VALUES (${title}, ${description}, ${category}, 'youtube', ${payload.youtube_url ?? ''}, ${ytId}, ${thumb}, 'Admin')
      RETURNING id
    `;
    return NextResponse.json({ id: (rows as { id: number }[])[0]?.id }, { status: 201 });
  }

  // upload
  if (!payload.blob_url) return NextResponse.json({ error: 'blob_url_required' }, { status: 400 });
  const rows = await sql`
    INSERT INTO videos (title, description, category, source_type, blob_url, blob_path, mime_type, size_bytes, uploaded_by)
    VALUES (${title}, ${description}, ${category}, 'upload', ${payload.blob_url}, ${payload.blob_path ?? null}, ${payload.mime_type ?? null}, ${payload.size_bytes ?? null}, 'Admin')
    RETURNING id
  `;
  return NextResponse.json({ id: (rows as { id: number }[])[0]?.id }, { status: 201 });
}
