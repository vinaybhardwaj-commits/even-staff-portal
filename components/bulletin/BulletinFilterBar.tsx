'use client';
/**
 * v1.2 T5: client-side filter chips + period + author filter for /bulletin.
 * Filters: All / Pinned / Has attachments. Period: All / 7d / 30d.
 * Author: free-text contains-match on display_name.
 */
import { useMemo, useState } from 'react';
import { Pin, Paperclip } from 'lucide-react';
import { PostCard } from '@/components/bulletin/PostCard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Post = any;
type Flag = 'all' | 'pinned' | 'attachments';
type Period = 'all' | '7d' | '30d';

export function BulletinFilterBar({ posts }: { posts: Post[] }) {
  const [flag, setFlag] = useState<Flag>('all');
  const [period, setPeriod] = useState<Period>('all');
  const [author, setAuthor] = useState('');

  const filtered = useMemo(() => {
    let list = posts.slice();
    if (flag === 'pinned') list = list.filter((p) => p.pinned);
    if (flag === 'attachments') list = list.filter((p) => p.attachment_url);
    if (period !== 'all') {
      const cutoffMs = period === '7d' ? 7 * 86400000 : 30 * 86400000;
      const min = Date.now() - cutoffMs;
      list = list.filter((p) => +new Date(p.last_activity_at) >= min);
    }
    if (author.trim()) {
      const q = author.trim().toLowerCase();
      list = list.filter((p) => (p.author_display_name || '').toLowerCase().includes(q));
    }
    return list;
  }, [posts, flag, period, author]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {([
            { k: 'all', label: 'All', icon: null, n: posts.length },
            { k: 'pinned', label: 'Pinned', icon: Pin, n: posts.filter((p) => p.pinned).length },
            { k: 'attachments', label: 'With files', icon: Paperclip, n: posts.filter((p) => p.attachment_url).length },
          ] as const).map((c) => (
            <button
              key={c.k}
              onClick={() => setFlag(c.k)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[12px] rounded-full border transition-colors ${
                flag === c.k
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-navy border-[var(--color-border)] hover:bg-brand-faint'
              }`}
            >
              {c.icon ? <c.icon className="w-3 h-3" /> : null}
              {c.label} <span className="opacity-60">({c.n})</span>
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[var(--color-text-muted)]">|</span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="bg-white border border-[var(--color-border)] rounded px-2 py-1 text-[12px] focus:outline-none focus:border-brand"
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Filter by author…"
          className="flex-1 min-w-[140px] bg-white border border-[var(--color-border)] rounded px-2 py-1 text-[12px] focus:outline-none focus:border-brand"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
          <div className="text-[13px] text-[var(--color-text-secondary)]">No posts match these filters.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </>
  );
}
