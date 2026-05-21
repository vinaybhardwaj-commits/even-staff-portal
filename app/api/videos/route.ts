import { NextResponse } from 'next/server';
import { listVideos } from '@/lib/portal/video-reads';

export const runtime = 'nodejs';

export async function GET() {
  const videos = await listVideos();
  return NextResponse.json({ videos });
}
