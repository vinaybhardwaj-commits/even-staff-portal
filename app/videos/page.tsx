import { AppLayout } from '@/components/AppLayout';
import { listVideos } from '@/lib/portal/video-reads';
import { VideosLibraryClient } from '@/components/videos/VideosLibraryClient';
import { Tv } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = { title: 'Videos · Even Staff Portal' };

export default async function VideosLibrary() {
  const videos = await listVideos();
  return (
    <AppLayout title="Videos">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {videos.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
            <Tv className="w-12 h-12 text-[var(--color-text-muted)] opacity-40 mx-auto mb-3" strokeWidth={1.5} />
            <div className="text-[14px] font-medium text-navy mb-1">No videos yet</div>
            <div className="text-[12px] text-[var(--color-text-secondary)]">Admin video announcements and trainings appear here.</div>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <VideosLibraryClient initialVideos={videos as any} />
        )}
      </div>
    </AppLayout>
  );
}
