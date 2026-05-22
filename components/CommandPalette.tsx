'use client';
/**
 * v1.2 T6: ⌘K / Ctrl+K global command palette.
 *
 * Lazy: only renders when open. Search hits debounce 200ms. Keyboard
 * nav (↑↓ moves selection, Enter navigates, Esc closes). Mounted by
 * AppLayout — killswitched by Settings · hideCmdK.
 */
import { useEffect, useRef, useState } from 'react';
import { Search, Megaphone, Link as LinkIcon, Phone, Tv, Bell, FlaskConical, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Hit = {
  kind: 'bulletin' | 'resource' | 'contact' | 'video' | 'announcement' | 'pilot';
  id: string | number;
  title: string;
  subtitle: string | null;
  href: string;
};

const KIND_ICON = {
  bulletin: Megaphone, resource: LinkIcon, contact: Phone, video: Tv, announcement: Bell, pilot: FlaskConical,
};
const KIND_LABEL = {
  bulletin: 'Bulletin', resource: 'Resource', contact: 'Contact', video: 'Video', announcement: 'Announcement', pilot: 'Pilot app',
};

export function CommandPalette({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keydown listener
  useEffect(() => {
    if (disabled) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, open]);

  // Focus the input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQ(''); setHits([]); setSel(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) { setHits([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/portal/search?q=${encodeURIComponent(q.trim())}`);
        const j = await r.json();
        setHits(j.hits || []);
        setSel(0);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  if (disabled || !open) return null;

  function navigate(hit: Hit) {
    setOpen(false);
    if (hit.href.startsWith('http')) {
      window.open(hit.href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(hit.href);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && hits[sel]) { e.preventDefault(); navigate(hits[sel]); }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)]">
          <Search className="w-4 h-4 text-[var(--color-text-muted)]" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search the portal…"
            className="flex-1 bg-transparent text-[14px] focus:outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)] hover:text-navy" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[var(--color-text-muted)]">Type at least 2 characters…</div>
          ) : loading && hits.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[var(--color-text-muted)]">Searching…</div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[var(--color-text-muted)]">No matches</div>
          ) : (
            <ul>
              {hits.map((h, i) => {
                const Icon = KIND_ICON[h.kind];
                return (
                  <li key={`${h.kind}-${h.id}`}>
                    <button
                      type="button"
                      onClick={() => navigate(h)}
                      onMouseEnter={() => setSel(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left ${i === sel ? 'bg-brand-faint' : 'hover:bg-[var(--color-bg)]'}`}
                    >
                      <Icon className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" strokeWidth={1.75} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-navy truncate">{h.title}</div>
                        {h.subtitle ? <div className="text-[11px] text-[var(--color-text-muted)] truncate">{h.subtitle}</div> : null}
                      </div>
                      <span className="text-[9px] uppercase tracking-wide text-[var(--color-text-muted)] shrink-0">{KIND_LABEL[h.kind]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="px-3 py-1.5 text-[10px] text-[var(--color-text-muted)] border-t border-[var(--color-border)] flex items-center justify-between">
          <span>↑↓ to move, Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
