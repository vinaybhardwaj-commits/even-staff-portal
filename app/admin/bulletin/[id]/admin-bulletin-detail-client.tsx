'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Eye, EyeOff, Pin, PinOff, Lock } from 'lucide-react';
import { relativeTime, absoluteTime } from '@/lib/portal/time';

type Post = {
  id: number | string;
  title: string;
  body: string;
  category: string;
  attachment_url: string | null;
  author_display_name: string;
  pinned: boolean;
  hidden_by: string | null;
  hidden_at: string | null;
  hidden_reason: string | null;
  last_activity_at: string;
  created_at: string;
};
type Comment = {
  id: number | string;
  post_id: number | string;
  parent_comment_id: number | string | null;
  body: string;
  author_display_name: string;
  hidden_by: string | null;
  hidden_at: string | null;
  hidden_reason: string | null;
  created_at: string;
};

export function AdminBulletinDetailClient({ adminToken, postId }: { adminToken: string; postId: number }) {
  const auth = `Bearer ${adminToken}`;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/bulletin-posts/${postId}`, { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'load failed');
      setPost(j.post); setComments(j.comments);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [postId]);

  async function togglePin() {
    if (!post) return;
    await fetch(`/api/admin/bulletin/posts/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ pin: !post.pinned }) });
    await refresh();
  }
  async function togglePostHide() {
    if (!post) return;
    let reason: string | null = null;
    if (!post.hidden_at) {
      reason = window.prompt('Hide reason?') || ''; if (!reason.trim()) return;
    }
    await fetch(`/api/admin/bulletin/posts/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ hide: !post.hidden_at, hidden_reason: reason ?? undefined }) });
    await refresh();
  }
  async function toggleCommentHide(c: Comment) {
    let reason: string | null = null;
    if (!c.hidden_at) {
      reason = window.prompt(`Hide this comment by ${c.author_display_name}? Reason?`) || ''; if (!reason.trim()) return;
    }
    await fetch(`/api/admin/bulletin/comments/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ hide: !c.hidden_at, hidden_reason: reason ?? undefined }) });
    await refresh();
  }

  if (loading) return <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
  if (error && !post) return <div className="bg-pink-light text-pink-dark text-[12px] p-3 rounded">{error}</div>;
  if (!post) return null;

  const isPostHidden = !!post.hidden_at;

  return (
    <div className="space-y-4">
      <Link href="/admin/bulletin" className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-brand"><ArrowLeft className="w-3.5 h-3.5" /> Back to bulletin moderation</Link>

      {error && <div className="bg-pink-light text-pink-dark text-[12px] px-3 py-2 rounded">{error}</div>}

      <article className={`bg-white rounded-xl border border-[var(--color-border)] p-5 ${isPostHidden ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">#{post.id}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-faint text-brand-dark">{post.category}</span>
          {post.pinned && <Pin className="w-3 h-3 text-brand" strokeWidth={2} />}
          {isPostHidden && <span className="inline-flex items-center gap-1 text-[9px] text-pink-dark"><Lock className="w-2.5 h-2.5" />HIDDEN</span>}
          <span className="text-[10px] text-[var(--color-text-muted)]" title={absoluteTime(post.created_at)}>{relativeTime(post.created_at)}</span>
        </div>
        <h1 className="text-[16px] font-semibold text-navy">{post.title}</h1>
        <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mt-1 whitespace-pre-wrap">{post.body}</p>
        {post.hidden_reason && <div className="text-[10px] text-pink-dark mt-2 italic">Hidden reason: {post.hidden_reason}</div>}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--color-border)]">
          <span className="text-[10px] text-[var(--color-text-muted)] flex-1">by {post.author_display_name}</span>
          <button onClick={togglePin} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
            {post.pinned ? <><PinOff className="w-3 h-3" />Unpin</> : <><Pin className="w-3 h-3" />Pin</>}
          </button>
          <button onClick={togglePostHide} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1">
            {isPostHidden ? <><Eye className="w-3 h-3" />Unhide post</> : <><EyeOff className="w-3 h-3" />Hide post</>}
          </button>
        </div>
      </article>

      <section className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-semibold text-navy">Comments ({comments.length}{comments.filter((c) => c.hidden_at).length > 0 && <span className="text-pink-dark text-[10px]"> · {comments.filter((c) => c.hidden_at).length} hidden</span>})</h2>
        </div>
        {comments.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-[var(--color-text-muted)]">No comments.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {comments.map((c) => {
              const isHidden = !!c.hidden_at;
              const indent = c.parent_comment_id ? 'pl-8 border-l-2 border-brand-faint' : '';
              return (
                <li key={c.id} className={`px-4 py-2.5 ${indent} ${isHidden ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">#{c.id}</span>
                    <span className="text-[11px] font-medium text-navy">{c.author_display_name}</span>
                    {isHidden && <span className="text-[9px] uppercase tracking-wider text-pink-dark">hidden</span>}
                    <span className="text-[10px] text-[var(--color-text-muted)]" title={absoluteTime(c.created_at)}>{relativeTime(c.created_at)}</span>
                    {c.parent_comment_id && <span className="text-[9px] text-[var(--color-text-muted)]">↳ reply</span>}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] leading-snug whitespace-pre-wrap mb-1">{c.body}</div>
                  {c.hidden_reason && <div className="text-[9px] text-pink-dark italic">Hidden reason: {c.hidden_reason}</div>}
                  <button onClick={() => toggleCommentHide(c)} className="mt-1 text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1">
                    {isHidden ? <><Eye className="w-3 h-3" />Unhide</> : <><EyeOff className="w-3 h-3" />Hide</>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
