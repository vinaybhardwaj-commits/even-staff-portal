'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Pin, PinOff, Edit2, Save, X, History } from 'lucide-react';
import { VersionHistoryDrawer } from '@/components/admin/VersionHistoryDrawer';
import { relativeTime } from '@/lib/portal/time';

type Announcement = {
  id: number | string;
  title: string;
  body: string;
  category: string | null;
  link: string | null;
  pinned: boolean;
  active: boolean;
  publish_at: string | null;
  created_at: string;
};

const CATEGORIES = ['Urgent', 'Update', 'Info', 'Education'];

export function AdminAnnouncementsClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<Partial<Announcement>>({});
  const [historyFor, setHistoryFor] = useState<Announcement | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Update');
  const [pinned, setPinned] = useState(false);
  const [adding, setAdding] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/announcements', { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'list failed');
      setItems(j.announcements);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setAdding(true); setError(null);
    try {
      const r = await fetch('/api/admin/announcements', {
        method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), category, pinned }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'add failed');
      setTitle(''); setBody(''); setCategory('Update'); setPinned(false);
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setAdding(false); }
  }

  async function togglePin(id: number | string, current: boolean) {
    await fetch(`/api/admin/announcements/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ pinned: !current }) });
    await refresh();
  }
  async function toggleActive(id: number | string, current: boolean) {
    await fetch(`/api/admin/announcements/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ active: !current }) });
    await refresh();
  }
  async function saveEdit(id: number | string) {
    await fetch(`/api/admin/announcements/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify(draft) });
    setEditing(null); setDraft({}); await refresh();
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}

      <form onSubmit={onAdd} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-2 mb-3"><Plus className="w-4 h-4 text-brand" /><h2 className="text-[13px] font-semibold text-navy">Post an announcement</h2></div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required maxLength={200}
          className="w-full px-3 py-2 mb-2 text-[13px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" required rows={3}
          className="w-full px-3 py-2 mb-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg resize-none focus:outline-none focus:border-brand" />
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${category === c ? 'bg-brand text-white border-brand' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-brand'}`}>{c}</button>
          ))}
          <label className="text-[11px] text-[var(--color-text-secondary)] inline-flex items-center gap-1.5 ml-2">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" /> Pinned
          </label>
          <div className="flex-1" />
          <button type="submit" disabled={adding || !title.trim() || !body.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)]">
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Post
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]"><h2 className="text-[13px] font-semibold text-navy">All announcements ({items.length})</h2></div>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]">No announcements yet.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((a) => {
              const isEditing = editing === a.id;
              return (
                <li key={a.id} className={`px-4 py-3 ${a.active ? '' : 'opacity-50'}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input value={draft.title ?? a.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full px-2 py-1 text-[12px] font-medium border border-[var(--color-border)] rounded" />
                      <textarea value={draft.body ?? a.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={2} className="w-full px-2 py-1 text-[11px] border border-[var(--color-border)] rounded resize-none" />
                      <input value={draft.category ?? a.category ?? ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Category" className="px-2 py-1 text-[11px] border border-[var(--color-border)] rounded" />
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveEdit(a.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand text-white text-[11px]"><Save className="w-3 h-3" /> Save</button>
                        <button onClick={() => { setEditing(null); setDraft({}); }} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-border)] text-[11px]"><X className="w-3 h-3" /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {a.category && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-faint text-brand-dark">{a.category}</span>}
                        {a.pinned && <Pin className="w-3 h-3 text-brand" strokeWidth={2} />}
                        {!a.active && <span className="text-[9px] uppercase tracking-wider text-pink-dark">hidden</span>}
                        <span className="text-[10px] text-[var(--color-text-muted)]">{a.publish_at ? relativeTime(a.publish_at) : relativeTime(a.created_at)}</span>
                      </div>
                      <div className="text-[13px] font-medium text-navy">{a.title}</div>
                      <div className="text-[11px] text-[var(--color-text-secondary)] leading-snug line-clamp-2 mt-0.5">{a.body}</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={() => togglePin(a.id, a.pinned)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          {a.pinned ? <><PinOff className="w-3 h-3" />Unpin</> : <><Pin className="w-3 h-3" />Pin</>}
                        </button>
                        <button onClick={() => { setEditing(a.id); setDraft({}); }} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => setHistoryFor(a)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          <History className="w-3 h-3" /> History
                        </button>
                        <button onClick={() => toggleActive(a.id, a.active)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> {a.active ? 'Hide' : 'Unhide'}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {historyFor && (
        <VersionHistoryDrawer open onClose={() => setHistoryFor(null)}
          entityType="announcement" entityId={Number(historyFor.id)} entityLabel={historyFor.title}
          adminToken={adminToken} onRestored={refresh} />
      )}
    </div>
  );
}
