import { NextRequest, NextResponse } from 'next/server';
import { getPost, listComments } from '@/lib/portal/bulletin';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  const post = await getPost(id);
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const comments = await listComments(id);
  return NextResponse.json({ post, comments });
}
