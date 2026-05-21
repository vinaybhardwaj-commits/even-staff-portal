'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getDisplayName, setDisplayName, ANONYMOUS } from '@/lib/portal/identity';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'clinical', label: 'Clinical' },
  { value: 'ops',      label: 'Ops' },
  { value: 'social',   label: 'Social' },
  { value: 'general',  label: 'General' },
] as const;

type Attachment = { url: string; pathname: string; contentType: string; size: number };

export function Compose() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['value']>('general');
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(getDisplayName());
  }, []);

  function reset() {
    setTitle(''); setBody(''); setCategory('general');
    setAttachment(null); setError(null);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const r = await fetch('/api/bulletin/upload', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error === 'storage_not_configured' ? 'Attachment storage not configured yet — text-only posts work fine.' : (j.detail || j.error || 'Upload failed'));
        return;
      }
      setAttachment({ url: j.url, pathname: j.pathname, contentType: j.contentType, size: j.size });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const r = await fetch('/api/bulletin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category,
          author_display_name: name.trim() || ANONYMOUS,
          attachment_url: attachment?.url ?? null,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || 'Failed to post');
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function saveName(next: string) {
    setName(next);
    setDisplayName(next);
    setEditingName(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full bg-white rounded-xl border border-[var(--color-border)] px-4 py-3 text-left text-[13px] text-[var(--color-text-muted)] hover:border-brand hover:bg-brand-faint/30 transition-colors flex items-center gap-3"
      >
        <div className="w-7 h-7 rounded-full bg-brand-faint text-brand flex items-center justify-center text-[12px] font-semibold">+</div>
        <span>Post to the bulletin…</span>
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-[var(--color-border)] p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold text-navy">New post</div>
        <button type="button" onClick={() => { reset(); setOpen(false); }} className="text-[var(--color-text-muted)] hover:text-navy">
          <X className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. ‘New cardiac arrest protocol — effective Monday’)"
        maxLength={200}
        className="w-full px-3 py-2 mb-2 text-[14px] font-medium text-navy bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        required
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What's the update?  (Markdown supported in v1.1 — plain text for now.)"
        maxLength={8000}
        rows={5}
        className="w-full px-3 py-2 mb-3 text-[13px] text-navy bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg resize-none focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
        required
      />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
              category === c.value
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-brand hover:text-brand'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {attachment ? (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
          {attachment.contentType.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-brand" /> : <FileText className="w-4 h-4 text-brand" />}
          <span className="text-[11px] text-[var(--color-text-secondary)] flex-1 truncate">{attachment.pathname}</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{(attachment.size / 1024 / 1024).toFixed(1)} MB</span>
          <button type="button" onClick={() => setAttachment(null)} className="text-[var(--color-text-muted)] hover:text-navy">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="mb-3">
          <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onUpload} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-[11px] text-[var(--color-text-secondary)] hover:text-brand flex items-center gap-1.5 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading…' : 'Attach image or PDF (10 MB max)'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
        {editingName ? (
          <input
            autoFocus
            type="text"
            defaultValue={name === ANONYMOUS ? '' : name}
            onBlur={(e) => saveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveName((e.target as HTMLInputElement).value); } }}
            placeholder="Your display name (optional)"
            maxLength={60}
            className="text-[11px] px-2 py-1 border border-[var(--color-border)] rounded bg-white"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="text-[11px] text-[var(--color-text-muted)] hover:text-brand"
          >
            Posting as <span className="text-navy font-medium">{name || ANONYMOUS}</span> · change
          </button>
        )}
        <div className="flex-1" />
        {error && <span className="text-[11px] text-pink-dark mr-2">{error}</span>}
        <button
          type="submit"
          disabled={submitting || !title.trim() || !body.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)] disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
