'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Pin, PinOff, EyeOff, Eye, MessageCircle, Lock } from 'lucide-react';
import { relativeTime } from '@/lib/portal/time';

type Post = {
  id: number | string;
  title: string;
  body: string;
  category: string;
  attachment_url: string | null;
  author_display_name: string;
  pinned: boolean;
  pinned_at: string | null;
  hidden_by: string | null;
  hidden_at: string | null;
  hidden_reason: string | null;
  last_activity_at: string;
  created_at: string;
  comment_count: number;
  hidden_comment_count: number;
};

const CATEGORY_STYLE: Record<string, string> = {
  clinical: 'bg-pink-light text-pink-dark',
  ops: 'bg-brand-faint text-brand-dark',
  social: 'bg-emerald-50 text-emerald-700',
  general: 'bg-navy/10 text-navy',
};

export function AdminBulletinClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/bulletin-posts', { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'list failed');
      setPosts(j.posts as Post[]);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function togglePin(id: number | string, current: boolean) {
    try {
      await fetch(`/api/admin/bulletin/posts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ pin: !current }) });
      await refresh();
    } catch (e) { setError((e as Error).message); }
  }
  async function toggleHide(id: number | string, current: boolean) {
    let reason: string | null = null;
    if (!current) {
      reason = window.prompt('Reason for hiding this post? (Required, shown as placeholder in feed.)') || '';
      if (!reason.trim()) return;
    }
    try {
      await fetch(`/api/admin/bulletin/posts/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify({ hide: !current, hidden_reason: reason ?? undefined }),
      });
      await refresh();
    } catch (e) { setError((e as Error).message); }
  }

  const visible = posts.filter((p) => showHidden || !p.hidden_at);

  return (
    <div className="space-y-4">
      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}

      <div className="bg-white rounded-xl border border-[var(--color-border)] p-3 flex items-center gap-3">
        <h2 className="text-[13px] font-semibold text-navy flex-1">Bulletin moderation</h2>
        <label className="text-[11px] text-[var(--color-text-secondary)] inline-flex items-center gap-1.5">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} className="rounded" /> Show hidden
        </label>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]"><h2 className="text-[13px] font-semibold text-navy">Posts ({visible.length})</h2></div>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : visible.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]">No posts.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {visible.map((p) => {
              const isHidden = !!p.hidden_at;
              return (
                <li key={p.id} className={`px-4 py-3 ${isHidden ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">#{p.id}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${CATEGORY_STYLE[p.category] || CATEGORY_STYLE.general}`}>{p.category}</span>
                    {p.pinned && <Pin className="w-3 h-3 text-brand" strokeWidth={2} />}
                    {isHidden && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-pink-dark"><Lock className="w-2.5 h-2.5" />HIDDEN</span>
                    )}
                    <span className="text-[10px] text-[var(--color-text-muted)]">{relativeTime(p.created_at)}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">by {p.author_display_name}</span>
                  </div>
                  <div className="text-[13px] font-semibold text-navy">{p.title}</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] leading-snug line-clamp-2 mt-0.5">{p.body}</div>
                  {p.hidden_reason && (
                    <div className="text-[10px] text-pink-dark mt-1 italic">Hidden reason: {p.hidden_reason}</div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Link href={`/bulletin/${p.id}`} target="_blank" className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {p.comment_count} {p.hidden_comment_count > 0 && <span className="text-pink-dark">({p.hidden_comment_count} hidden)</span>} View thread →
                    </Link>
                    <button onClick={() => togglePin(p.id, p.pinned)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                      {p.pinned ? <><PinOff className="w-3 h-3" />Unpin</> : <><Pin className="w-3 h-3" />Pin</>}
                    </button>
                    <button onClick={() => toggleHide(p.id, isHidden)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1">
                      {isHidden ? <><Eye className="w-3 h-3" />Unhide</> : <><EyeOff className="w-3 h-3" />Hide</>}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
