'use client';
/**
 * v1.3 P3: home video carousel.
 * Cycles through all active videos in sort_order. On video-end → advance
 * to next. After the last → loop to first. Autoplay muted. Prev/next
 * chips on hover.
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Youtube, Upload } from 'lucide-react';

type Video = {
  id: number | string;
  title: string;
  description: string | null;
  source_type: 'upload' | 'youtube';
  blob_url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
};

export function VideoCarousel({ videos }: { videos: Video[] }) {
  const [idx, setIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const v = videos[idx];

  const advance = () => setIdx((i) => (i + 1) % videos.length);
  const back = () => setIdx((i) => (i - 1 + videos.length) % videos.length);

  // For YouTube videos we can't intercept onEnded reliably — autoplay the YT player
  // and rotate via a hard timer (~3min default per video).
  useEffect(() => {
    if (v?.source_type !== 'youtube' || videos.length < 2) return;
    const t = setTimeout(advance, 180_000); // 3 min per YouTube video
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, v?.source_type, videos.length]);

  if (!v) return null;

  return (
    <div className="flex-1 flex flex-col relative group">
      {v.source_type === 'youtube' && v.youtube_video_id ? (
        <iframe
          key={`yt-${v.id}`}
          className="flex-1 w-full bg-black"
          src={`https://www.youtube.com/embed/${v.youtube_video_id}?autoplay=1&mute=1&playsinline=1`}
          title={v.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : v.source_type === 'upload' && v.blob_url ? (
        <video
          ref={videoRef}
          key={`up-${v.id}`}
          className="flex-1 w-full bg-black object-contain"
          src={v.blob_url}
          poster={v.thumbnail_url ?? undefined}
          controls
          autoPlay
          muted
          playsInline
          preload="metadata"
          onEnded={advance}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-[11px] text-[var(--color-text-muted)]">
          Video misconfigured
        </div>
      )}

      {videos.length > 1 && (
        <>
          <button
            onClick={back}
            aria-label="Previous video"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/75"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={advance}
            aria-label="Next video"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/75"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {videos.map((vid, i) => (
              <button
                key={vid.id}
                onClick={() => setIdx(i)}
                aria-label={`Video ${i + 1} of ${videos.length}`}
                className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/75'}`}
              />
            ))}
          </div>
        </>
      )}

      <div className="px-4 py-2 border-t border-[var(--color-border)] shrink-0 flex items-center gap-2">
        {v.source_type === 'youtube' ? <Youtube className="w-3 h-3 text-[var(--color-text-muted)]" /> : <Upload className="w-3 h-3 text-[var(--color-text-muted)]" />}
        <div className="text-[12px] font-medium text-navy truncate flex-1">{v.title}</div>
        {videos.length > 1 && (
          <div className="text-[10px] text-[var(--color-text-muted)] tabular-nums shrink-0">{idx + 1}/{videos.length}</div>
        )}
      </div>
    </div>
  );
}
