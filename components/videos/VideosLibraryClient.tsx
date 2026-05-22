'use client';
/**
 * v1.2 T4: client-side filter chips (All / YouTube / Uploaded) + sort
 * dropdown (Newest / Oldest / A-Z) for the /videos library page.
 * Server fetches all videos; this just narrows + reorders in-memory.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Tv, Play, Youtube, Upload, ArrowUpDown } from 'lucide-react';
import { youtubeThumbnailUrl } from '@/lib/portal/youtube';
import { relativeTime } from '@/lib/portal/time';

export type Video = {
  id: number | string;
  title: string;
  description: string | null;
  category: string | null;
  source_type: 'upload' | 'youtube';
  blob_url: string | null;
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  uploaded_at: string;
};

type Filter = 'all' | 'youtube' | 'upload';
type Sort = 'newest' | 'oldest' | 'az';

export function VideosLibraryClient({ initialVideos }: { initialVideos: Video[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');

  const filtered = useMemo(() => {
    let list = initialVideos.slice();
    if (filter !== 'all') list = list.filter((v) => v.source_type === filter);
    if (sort === 'newest') list.sort((a, b) => +new Date(b.uploaded_at) - +new Date(a.uploaded_at));
    if (sort === 'oldest') list.sort((a, b) => +new Date(a.uploaded_at) - +new Date(b.uploaded_at));
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [initialVideos, filter, sort]);

  const counts = useMemo(() => ({
    all: initialVideos.length,
    youtube: initialVideos.filter((v) => v.source_type === 'youtube').length,
    upload: initialVideos.filter((v) => v.source_type === 'upload').length,
  }), [initialVideos]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {([
            { k: 'all', label: 'All', n: counts.all },
            { k: 'youtube', label: 'YouTube', n: counts.youtube },
            { k: 'upload', label: 'Uploaded', n: counts.upload },
          ] as const).map((c) => (
            <button
              key={c.k}
              onClick={() => setFilter(c.k)}
              className={`px-2.5 py-1 text-[12px] rounded-full border transition-colors ${
                filter === c.k
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-navy border-[var(--color-border)] hover:bg-brand-faint'
              }`}
            >
              {c.label} <span className="opacity-60">({c.n})</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]">
          <ArrowUpDown className="w-3 h-3" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-white border border-[var(--color-border)] rounded px-2 py-1 text-[12px] focus:outline-none focus:border-brand"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A–Z</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-10 text-center">
          <Tv className="w-10 h-10 text-[var(--color-text-muted)] opacity-40 mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-[14px] font-medium text-navy mb-1">No videos match this filter</div>
          <div className="text-[12px] text-[var(--color-text-secondary)]">Try a different filter or sort option.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const ytThumb = v.youtube_video_id ? youtubeThumbnailUrl(v.youtube_video_id, 'hq') : null;
            const isUpload = v.source_type === 'upload' && v.blob_url;
            return (
              <Link
                key={v.id}
                href={`/videos/${v.id}`}
                className="group block bg-white rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-brand/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-150"
              >
                <div className="aspect-video bg-[var(--color-bg)] relative">
                  {isUpload ? (
                    // v1.3: render the video itself; browser shows first frame as poster
                    <video src={v.blob_url!} poster={v.thumbnail_url ?? undefined} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  ) : ytThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ytThumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tv className="w-10 h-10 text-[var(--color-text-muted)] opacity-30" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center">
                      <Play className="w-5 h-5 text-navy ml-0.5" fill="currentColor" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/65 text-white">
                      {v.source_type === 'youtube' ? <Youtube className="w-2.5 h-2.5" /> : <Upload className="w-2.5 h-2.5" />}
                      {v.source_type}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[13px] font-medium text-navy line-clamp-2 mb-1">{v.title}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">{relativeTime(v.uploaded_at)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
