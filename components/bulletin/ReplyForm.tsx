'use client';
import { useEffect, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDisplayName, setDisplayName, ANONYMOUS } from '@/lib/portal/identity';

export function ReplyForm({
  postId,
  parentCommentId,
  placeholder = 'Write a reply…',
  onPosted,
  compact = false,
}: {
  postId: number;
  parentCommentId?: number | null;
  placeholder?: string;
  onPosted?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setName(getDisplayName()); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const r = await fetch('/api/bulletin/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          parent_comment_id: parentCommentId ?? null,
          body: body.trim(),
          author_display_name: name.trim() || ANONYMOUS,
        }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error || 'Failed to reply'); return; }
      setBody('');
      onPosted?.();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function saveName(n: string) {
    setName(n); setDisplayName(n); setEditingName(false);
  }

  return (
    <form onSubmit={onSubmit} className={compact ? 'mt-2' : 'mt-3'}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        maxLength={4000}
        className="w-full px-3 py-2 text-[12px] text-navy bg-white border border-[var(--color-border)] rounded-lg resize-none focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="flex items-center gap-2 mt-1.5">
        {editingName ? (
          <input
            autoFocus
            type="text"
            defaultValue={name === ANONYMOUS ? '' : name}
            onBlur={(e) => saveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveName((e.target as HTMLInputElement).value); } }}
            placeholder="Display name"
            maxLength={60}
            className="text-[10px] px-2 py-1 border border-[var(--color-border)] rounded bg-white"
          />
        ) : (
          <button type="button" onClick={() => setEditingName(true)} className="text-[10px] text-[var(--color-text-muted)] hover:text-brand">
            as <span className="text-navy font-medium">{name || ANONYMOUS}</span>
          </button>
        )}
        <div className="flex-1" />
        {error && <span className="text-[10px] text-pink-dark mr-2">{error}</span>}
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand text-white text-[11px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)] disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Reply
        </button>
      </div>
    </form>
  );
}
