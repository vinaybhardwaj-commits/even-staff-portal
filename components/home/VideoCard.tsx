import { getActiveVideosOrdered } from '@/lib/portal/video-reads';
import { Tv } from 'lucide-react';
import { VideoCarousel } from './VideoCarousel';

export async function VideoCard() {
  const videos = await getActiveVideosOrdered();

  return (
    <section className="h-full flex flex-col bg-white rounded-xl border border-[var(--color-border)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 overflow-hidden">
      <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-brand-faint text-brand flex items-center justify-center">
          <Tv className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <h2 className="text-[13px] font-semibold text-navy flex-1 truncate">
          {videos.length > 0 ? 'Video carousel' : 'Video player'}
        </h2>
        {videos.length > 1 && (
          <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums">
            {videos.length} videos
          </span>
        )}
      </header>

      {videos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none">
            <div className="text-[120px] font-bold text-navy">E</div>
          </div>
          <Tv className="w-8 h-8 text-[var(--color-text-muted)] opacity-50 mb-2 relative" strokeWidth={1.5} />
          <div className="text-[12px] text-[var(--color-text-secondary)] font-medium relative">No videos right now</div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 relative">Admin video announcements appear here</div>
        </div>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <VideoCarousel videos={videos as any} />
      )}
    </section>
  );
}
