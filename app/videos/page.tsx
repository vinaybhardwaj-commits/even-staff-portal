import { AppLayout } from '@/components/AppLayout';
import { listVideos } from '@/lib/portal/video-reads';
import { youtubeThumbnailUrl } from '@/lib/portal/youtube';
import Link from 'next/link';
import { Tv, Play, Youtube, Upload } from 'lucide-react';
import { relativeTime } from '@/lib/portal/time';

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => {
              const thumb = v.thumbnail_url
                || (v.youtube_video_id ? youtubeThumbnailUrl(v.youtube_video_id, 'hq') : null);
              return (
                <Link
                  key={v.id}
                  href={`/videos/${v.id}`}
                  className="group block bg-white rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-brand/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-150"
                >
                  <div className="aspect-video bg-[var(--color-bg)] relative">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
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
                        {v.source_type === 'youtube' ? 'YouTube' : 'Upload'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-[13px] font-semibold text-navy leading-snug line-clamp-2 group-hover:text-brand">{v.title}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-2">
                      {v.category && <span>{v.category}</span>}
                      {v.category && <span>·</span>}
                      <span>{relativeTime(v.uploaded_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
