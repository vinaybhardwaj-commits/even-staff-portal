'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, ExternalLink, X, Edit2, Save, FlaskConical } from 'lucide-react';

type PilotApp = {
  id: number | string;
  name: string;
  description: string | null;
  long_description: string | null;
  status: 'alpha' | 'beta' | 'live' | 'sunset';
  owner_name: string | null;
  owner_email: string | null;
  open_url: string;
  screenshot_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
};

const STATUS_OPTIONS: { value: PilotApp['status']; label: string }[] = [
  { value: 'alpha',  label: 'Alpha' },
  { value: 'beta',   label: 'Beta' },
  { value: 'live',   label: 'Live' },
  { value: 'sunset', label: 'Sunset' },
];

export function AdminPilotClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [items, setItems] = useState<PilotApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<Partial<PilotApp>>({});

  const [name, setName] = useState('');
  const [openUrl, setOpenUrl] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [status, setStatus] = useState<PilotApp['status']>('beta');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [adding, setAdding] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/pilot-apps', { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'list failed');
      setItems(j.pilot_apps);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !openUrl.trim()) return;
    setAdding(true); setError(null);
    try {
      const r = await fetch('/api/admin/pilot-apps', {
        method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify({
          name: name.trim(), open_url: openUrl.trim(), description: description.trim(),
          long_description: longDescription.trim(), status,
          owner_name: ownerName.trim(), owner_email: ownerEmail.trim(),
          screenshot_url: screenshotUrl.trim(), sort_order: 100,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'add failed');
      setName(''); setOpenUrl(''); setDescription(''); setLongDescription('');
      setStatus('beta'); setOwnerName(''); setOwnerEmail(''); setScreenshotUrl('');
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setAdding(false); }
  }

  async function softDelete(id: number | string, n: string) {
    if (!confirm(`Hide "${n}" from the public Pilot apps page?`)) return;
    await fetch(`/api/admin/pilot-apps/${id}`, { method: 'DELETE', headers: { authorization: auth } });
    await refresh();
  }
  async function saveEdit(id: number | string) {
    await fetch(`/api/admin/pilot-apps/${id}`, {
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
          <h2 className="text-[13px] font-semibold text-navy">Add pilot app</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. OPD Encounter App)" required maxLength={200}
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
          <input type="url" value={openUrl} onChange={(e) => setOpenUrl(e.target.value)} placeholder="Open URL" required
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (1-2 lines)"
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand md:col-span-2" />
          <textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} placeholder="What this is for (markdown OK, shown in expandable)" rows={3}
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand md:col-span-2 resize-none" />
          <select value={status} onChange={(e) => setStatus(e.target.value as PilotApp['status'])}
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand">
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input type="text" value={screenshotUrl} onChange={(e) => setScreenshotUrl(e.target.value)} placeholder="Screenshot URL (optional)"
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
          <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name"
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
          <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="Owner email"
            className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
        </div>
        <button type="submit" disabled={adding || !name.trim() || !openUrl.trim()}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)]">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {adding ? 'Adding…' : 'Add pilot app'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-semibold text-navy">All pilot apps ({items.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]">No pilot apps yet.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((p) => {
              const isEditing = editing === p.id;
              return (
                <li key={p.id} className={`px-4 py-3 ${p.active ? '' : 'opacity-50'}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid md:grid-cols-2 gap-2">
                        <input value={draft.name ?? p.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.open_url ?? p.open_url} onChange={(e) => setDraft({ ...draft, open_url: e.target.value })} className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.description ?? p.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded md:col-span-2" />
                        <select value={draft.status ?? p.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as PilotApp['status'] })} className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded">
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <input value={draft.screenshot_url ?? p.screenshot_url ?? ''} onChange={(e) => setDraft({ ...draft, screenshot_url: e.target.value })} placeholder="Screenshot URL" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveEdit(p.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand text-white text-[11px]"><Save className="w-3 h-3" /> Save</button>
                        <button onClick={() => { setEditing(null); setDraft({}); }} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-border)] text-[11px]"><X className="w-3 h-3" /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-gradient-to-br from-brand-faint to-pink-light flex items-center justify-center shrink-0">
                        <FlaskConical className="w-4 h-4 text-brand" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-navy truncate">{p.name}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-faint text-brand-dark">{p.status}</span>
                          {!p.active && <span className="text-[9px] uppercase tracking-wider text-pink-dark">hidden</span>}
                        </div>
                        <a href={p.open_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--color-text-muted)] hover:text-brand truncate flex items-center gap-1">
                          {p.open_url.length > 60 ? p.open_url.slice(0, 60) + '…' : p.open_url} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditing(p.id); setDraft({}); }} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => softDelete(p.id, p.name)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1">
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
    </div>
  );
}
