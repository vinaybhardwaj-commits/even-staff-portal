import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * v1.3 P3: Set Home promotes the video to position 1 in the carousel.
 * - sets app_settings.home_video_id (backwards-compat with v1.x readers)
 * - bumps everyone else's sort_order by +1 (within the active set)
 * - sets this video's sort_order to 1
 * Result: home carousel cycles starting with this video.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  const v = (await sql`SELECT id FROM videos WHERE id = ${id} AND soft_deleted_at IS NULL`) as { id: number }[];
  if (v.length === 0) return NextResponse.json({ error: 'video_not_found_or_deleted' }, { status: 404 });

  await sql`UPDATE videos SET sort_order = COALESCE(sort_order, 100) + 1 WHERE id <> ${id} AND soft_deleted_at IS NULL`;
  await sql`UPDATE videos SET sort_order = 1 WHERE id = ${id}`;

  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('home_video_id', ${JSON.stringify({ id })}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  return NextResponse.json({ ok: true });
}
