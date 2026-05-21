import Link from 'next/link';
import { MessageCircle, Pin, EyeOff, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import type { BulletinPost } from '@/lib/portal/bulletin';
import { Avatar } from './Avatar';
import { TimeChip } from './TimeChip';
import { CategoryBadge } from './CategoryBadge';

export function PostCard({ post }: { post: BulletinPost }) {
  const hidden = !!post.hidden_at;
  const isImage = post.attachment_url && /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(post.attachment_url);
  const isPdf   = post.attachment_url && /\.pdf(\?|$)/i.test(post.attachment_url);

  return (
    <Link
      href={`/bulletin/${post.id}`}
      className="block bg-white rounded-xl border border-[var(--color-border)] p-4 hover:border-brand/40 hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 group"
    >
      {hidden ? (
        <div className="py-3 px-2 text-[12px] italic text-[var(--color-text-muted)] flex items-center gap-2">
          <EyeOff className="w-3.5 h-3.5" /> Post removed by moderator
          {post.hidden_reason && <span className="text-[10px]">— {post.hidden_reason}</span>}
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
            <TimeChip iso={post.last_activity_at || post.created_at} />
            {post.attachment_url && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                {isImage ? <ImageIcon className="w-3 h-3" /> : isPdf ? <FileText className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                attachment
              </span>
            )}
          </div>

          <h3 className="text-[15px] font-semibold text-navy leading-snug mb-1 group-hover:text-brand transition-colors">
            {post.title}
          </h3>
          <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug line-clamp-2 mb-3">
            {post.body}
          </p>

          <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
            <Avatar name={post.author_display_name} size="sm" />
            <div className="text-[11px] text-navy font-medium">{post.author_display_name}</div>
            <div className="flex-1" />
            <div className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
              <MessageCircle className="w-3.5 h-3.5" />
              {post.comment_count}
            </div>
          </div>
        </>
      )}
    </Link>
  );
}
