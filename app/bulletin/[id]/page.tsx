import { AppLayout } from '@/components/AppLayout';
import { getPost, listComments } from '@/lib/portal/bulletin';
import { Avatar } from '@/components/bulletin/Avatar';
import { TimeChip } from '@/components/bulletin/TimeChip';
import { CategoryBadge } from '@/components/bulletin/CategoryBadge';
import { CommentTree } from '@/components/bulletin/CommentTree';
import { ReplyForm } from '@/components/bulletin/ReplyForm';
import Link from 'next/link';
import { ArrowLeft, Pin, EyeOff, FileText, Image as ImageIcon, Paperclip } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BulletinThread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId) || postId <= 0) notFound();

  const post = await getPost(postId);
  if (!post) notFound();
  const comments = await listComments(postId);

  const isImage = post.attachment_url && /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(post.attachment_url);
  const isPdf   = post.attachment_url && /\.pdf(\?|$)/i.test(post.attachment_url);
  const hidden = !!post.hidden_at;

  return (
    <AppLayout title="Bulletin">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <Link href="/bulletin" className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-brand mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to feed
        </Link>

        <article className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          {hidden ? (
            <div className="py-4 px-2 text-[13px] italic text-[var(--color-text-muted)] flex items-center gap-2">
              <EyeOff className="w-4 h-4" /> Post removed by moderator
              {post.hidden_reason && <span className="text-[11px]">— {post.hidden_reason}</span>}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {post.pinned && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand text-white">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
                <CategoryBadge category={post.category} />
                <TimeChip iso={post.created_at} />
              </div>
              <h1 className="text-[20px] font-semibold text-navy leading-tight mb-3">{post.title}</h1>
              <div className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap mb-4">{post.body}</div>

              {post.attachment_url && (
                <div className="mb-4 border border-[var(--color-border)] rounded-lg overflow-hidden">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.attachment_url} alt="" className="max-h-[480px] w-full object-contain bg-[var(--color-bg)]" />
                  ) : isPdf ? (
                    <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-faint/40 transition-colors">
                      <FileText className="w-6 h-6 text-brand" />
                      <div className="flex-1">
                        <div className="text-[12px] font-medium text-navy">PDF attachment</div>
                        <div className="text-[10px] text-[var(--color-text-muted)] truncate">{post.attachment_url}</div>
                      </div>
                      <span className="text-[10px] text-brand">Open →</span>
                    </a>
                  ) : (
                    <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-faint/40 transition-colors">
                      <Paperclip className="w-5 h-5 text-brand" />
                      <span className="text-[12px] text-navy flex-1 truncate">Attachment</span>
                      <span className="text-[10px] text-brand">Open →</span>
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
                <Avatar name={post.author_display_name} size="sm" />
                <div className="text-[12px] text-navy font-medium">{post.author_display_name}</div>
                <div className="flex-1" />
                <div className="text-[11px] text-[var(--color-text-muted)]">
                  {post.comment_count} {post.comment_count === 1 ? 'reply' : 'replies'}
                </div>
              </div>
            </>
          )}
        </article>

        {!hidden && (
          <section className="mt-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Replies
            </h2>
            <CommentTree comments={comments} postId={post.id} />
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <div className="text-[11px] font-semibold text-navy mb-1">Add a reply</div>
              <ReplyForm postId={post.id} placeholder="Reply to this post…" />
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
