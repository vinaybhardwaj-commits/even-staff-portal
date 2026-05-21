import { getHomeVideo } from '@/lib/portal/reads';
import { Tv } from 'lucide-react';

export async function VideoCard() {
  const v = await getHomeVideo();

  return (
    <section className="h-full flex flex-col bg-white rounded-xl border border-[var(--color-border)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 overflow-hidden">
      <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-brand-faint text-brand flex items-center justify-center">
          <Tv className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <h2 className="text-[13px] font-semibold text-navy flex-1 truncate">
          {v ? v.title : 'Video player'}
        </h2>
      </header>

      {!v ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none">
            <div className="text-[120px] font-bold text-navy">E</div>
          </div>
          <Tv className="w-8 h-8 text-[var(--color-text-muted)] opacity-50 mb-2 relative" strokeWidth={1.5} />
          <div className="text-[12px] text-[var(--color-text-secondary)] font-medium relative">No video right now</div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 relative">Admin video announcements appear here</div>
        </div>
      ) : v.source_type === 'youtube' && v.youtube_video_id ? (
        <iframe
          className="flex-1 w-full bg-black"
          src={`https://www.youtube.com/embed/${v.youtube_video_id}?autoplay=1&mute=1&playsinline=1`}
          title={v.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : v.source_type === 'upload' && v.blob_url ? (
        <video
          className="flex-1 w-full bg-black object-contain"
          src={v.blob_url}
          poster={v.thumbnail_url ?? undefined}
          controls
          autoPlay
          muted
          playsInline
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-[11px] text-[var(--color-text-muted)]">
          Video misconfigured
        </div>
      )}

      {v?.description && (
        <div className="px-4 py-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] leading-snug shrink-0 line-clamp-1">
          {v.description}
        </div>
      )}
    </section>
  );
}
