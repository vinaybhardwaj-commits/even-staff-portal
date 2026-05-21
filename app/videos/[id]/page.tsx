import { AppLayout } from '@/components/AppLayout';
import { getVideo } from '@/lib/portal/video-reads';
import { youtubeEmbedUrl } from '@/lib/portal/youtube';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { absoluteTime } from '@/lib/portal/time';

export const dynamic = 'force-dynamic';

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vid = Number(id);
  if (!Number.isFinite(vid) || vid <= 0) notFound();

  const v = await getVideo(vid);
  if (!v || v.soft_deleted_at) notFound();

  return (
    <AppLayout title="Videos">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <Link href="/videos" className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-brand mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to library
        </Link>

        <article className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
          <div className="aspect-video bg-black">
            {v.source_type === 'youtube' && v.youtube_video_id ? (
              <iframe
                className="w-full h-full"
                src={youtubeEmbedUrl(v.youtube_video_id, { autoplay: true, mute: true })}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : v.source_type === 'upload' && v.blob_url ? (
              <video
                className="w-full h-full bg-black object-contain"
                src={v.blob_url}
                poster={v.thumbnail_url ?? undefined}
                controls
                autoPlay
                muted
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60 text-[12px]">Video misconfigured</div>
            )}
          </div>
          <div className="p-5">
            <h1 className="text-[18px] font-semibold text-navy leading-tight mb-2">{v.title}</h1>
            {v.description && <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">{v.description}</p>}
            <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
              {v.category && <><span>{v.category}</span><span>·</span></>}
              <span>{v.source_type === 'youtube' ? 'YouTube' : 'Uploaded'}</span>
              <span>·</span>
              <span>{absoluteTime(v.uploaded_at)}</span>
            </div>
          </div>
        </article>
      </div>
    </AppLayout>
  );
}
