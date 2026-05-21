'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Pin, PinOff, Trash2, ExternalLink, X, Edit2, Save, History } from 'lucide-react';
import { VersionHistoryDrawer } from '@/components/admin/VersionHistoryDrawer';

type Resource = {
  id: number | string;
  name: string;
  description: string | null;
  url: string;
  category: string | null;
  icon: string | null;
  pinned: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export function AdminResourcesClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<Partial<Resource>>({});
  const [historyFor, setHistoryFor] = useState<Resource | null>(null);

  // Add form
  const [name, setName] = useState(''); const [url, setUrl] = useState('');
  const [description, setDescription] = useState(''); const [category, setCategory] = useState('');
  const [icon, setIcon] = useState(''); const [pinned, setPinned] = useState(false);
  const [adding, setAdding] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/resources', { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'list failed');
      setItems(j.resources);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setAdding(true); setError(null);
    try {
      const r = await fetch('/api/admin/resources', {
        method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify({ name: name.trim(), url: url.trim(), description: description.trim(), category: category.trim(), icon: icon.trim(), pinned, sort_order: pinned ? 1 : 100 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'add failed');
      setName(''); setUrl(''); setDescription(''); setCategory(''); setIcon(''); setPinned(false);
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setAdding(false); }
  }

  async function togglePin(id: number | string, current: boolean) {
    await fetch(`/api/admin/resources/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ pinned: !current }) });
    await refresh();
  }
  async function softDelete(id: number | string, n: string) {
    if (!confirm(`Hide "${n}" from the public Resources page?`)) return;
    await fetch(`/api/admin/resources/${id}`, { method: 'DELETE', headers: { authorization: auth } });
    await refresh();
  }
  async function saveEdit(id: number | string) {
    await fetch(`/api/admin/resources/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth },
      body: JSON.stringify(draft),
    });
    setEditing(null); setDraft({});
    await refresh();
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}

      <form onSubmit={onAdd} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-brand" />
          <h2 className="text-[13px] font-semibold text-navy">Add resource</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. KareXpert HIS)" required maxLength={200}
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (https://...)" required
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (1 line)"
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand md:col-span-2" />
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (HIS / Clinical reference / Education / Compliance / HR / other)"
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
          <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon (emoji or URL)"
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="text-[11px] text-[var(--color-text-secondary)] inline-flex items-center gap-1.5">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" /> Pinned
          </label>
          <button type="submit" disabled={adding || !name.trim() || !url.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)]">
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {adding ? 'Adding…' : 'Add resource'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-semibold text-navy">All resources ({items.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]">No resources yet.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((r) => {
              const isEditing = editing === r.id;
              return (
                <li key={r.id} className={`px-4 py-3 ${r.active ? '' : 'opacity-50'}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid md:grid-cols-2 gap-2">
                        <input value={draft.name ?? r.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.url ?? r.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.description ?? r.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded md:col-span-2" />
                        <input value={draft.category ?? r.category ?? ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Category" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.icon ?? r.icon ?? ''} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} placeholder="Icon" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveEdit(r.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand text-white text-[11px]"><Save className="w-3 h-3" /> Save</button>
                        <button onClick={() => { setEditing(null); setDraft({}); }} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-border)] text-[11px]"><X className="w-3 h-3" /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-brand-faint text-brand flex items-center justify-center text-[14px] shrink-0">{r.icon || '🔗'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-navy truncate">{r.name}</span>
                          {r.pinned && <Pin className="w-3 h-3 text-brand" strokeWidth={2} />}
                          {!r.active && <span className="text-[9px] uppercase tracking-wider text-pink-dark">hidden</span>}
                        </div>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--color-text-muted)] hover:text-brand truncate flex items-center gap-1">
                          {r.url.length > 60 ? r.url.slice(0, 60) + '…' : r.url} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        {r.category && <span className="text-[10px] text-[var(--color-text-muted)]"> · {r.category}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => togglePin(r.id, r.pinned)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          {r.pinned ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}
                        </button>
                        <button onClick={() => { setEditing(r.id); setDraft({}); }} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => setHistoryFor(r)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          <History className="w-3 h-3" /> History
                        </button>
                        <button onClick={() => softDelete(r.id, r.name)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Hide
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
          entityType="resource" entityId={Number(historyFor.id)} entityLabel={historyFor.name}
          adminToken={adminToken} onRestored={refresh} />
      )}
    </div>
  );
}
