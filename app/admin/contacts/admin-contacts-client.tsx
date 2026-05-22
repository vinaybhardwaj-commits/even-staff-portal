'use client';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Pin, PinOff, Edit2, Save, X, History } from 'lucide-react';
import { VersionHistoryDrawer } from '@/components/admin/VersionHistoryDrawer';

type Contact = {
  id: number | string;
  name: string;
  role: string | null;
  department: string | null;
  extension: string | null;
  phone: string | null;
  email: string | null;
  pinned: boolean;
  sort_order: number;
  active: boolean;
};

export function AdminContactsClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<Partial<Contact>>({});
  const [dragId, setDragId] = useState<number | string | null>(null);
  const [historyFor, setHistoryFor] = useState<Contact | null>(null);

  const [name, setName] = useState(''); const [role, setRole] = useState('');
  const [department, setDepartment] = useState(''); const [extension, setExtension] = useState('');
  const [phone, setPhone] = useState(''); const [email, setEmail] = useState('');
  const [pinned, setPinned] = useState(false);
  const [adding, setAdding] = useState(false);

  
  async function reorderRow(fromId: number | string, toId: number | string) {
    if (fromId === toId) return;
    const arr = [...items];
    const fromIdx = arr.findIndex((x) => x.id === fromId);
    const toIdx = arr.findIndex((x) => x.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    // Assign new sort_order: increment by 10 from 10
    await Promise.all(arr.map((row, i) => fetch(`/api/admin/contacts/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: auth },
      body: JSON.stringify({ sort_order: (i + 1) * 10 }),
    })));
    await refresh();
  }
  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/contacts', { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'list failed');
      setItems(j.contacts);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true); setError(null);
    try {
      const r = await fetch('/api/admin/contacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify({ name: name.trim(), role: role.trim(), department: department.trim(), extension: extension.trim(), phone: phone.trim(), email: email.trim(), pinned }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'add failed');
      setName(''); setRole(''); setDepartment(''); setExtension(''); setPhone(''); setEmail(''); setPinned(false);
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setAdding(false); }
  }

  async function togglePin(id: number | string, current: boolean) {
    await fetch(`/api/admin/contacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ pinned: !current }) });
    await refresh();
  }
  async function toggleActive(id: number | string, current: boolean) {
    await fetch(`/api/admin/contacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ active: !current }) });
    await refresh();
  }
  async function saveEdit(id: number | string) {
    await fetch(`/api/admin/contacts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify(draft) });
    setEditing(null); setDraft({}); await refresh();
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}

      <form onSubmit={onAdd} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-2 mb-3"><Plus className="w-4 h-4 text-brand" /><h2 className="text-[13px] font-semibold text-navy">Add contact</h2></div>
        <div className="grid md:grid-cols-3 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
          <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
          <input value={extension} onChange={(e) => setExtension(e.target.value)} placeholder="Extension" className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="text-[11px] text-[var(--color-text-secondary)] inline-flex items-center gap-1.5">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" /> Pinned
          </label>
          <button type="submit" disabled={adding || !name.trim()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)]">
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add contact
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2"><h2 className="text-[13px] font-semibold text-navy flex-1">All contacts ({items.length})</h2><span className="text-[10px] text-[var(--color-text-muted)]">⇅ drag rows to reorder</span></div>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]">No contacts yet.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((c) => {
              const isEditing = editing === c.id;
              return (
                <li key={c.id} draggable onDragStart={() => setDragId(c.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragId) reorderRow(dragId, c.id); setDragId(null); }} className={`px-4 py-3 ${c.active ? '' : 'opacity-50'} ${dragId === c.id ? 'opacity-30' : ''} cursor-move`}>
                  {isEditing ? (
                    <div className="space-y-1">
                      <div className="grid md:grid-cols-3 gap-1">
                        <input value={draft.name ?? c.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.role ?? c.role ?? ''} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Role" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.department ?? c.department ?? ''} onChange={(e) => setDraft({ ...draft, department: e.target.value })} placeholder="Department" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.extension ?? c.extension ?? ''} onChange={(e) => setDraft({ ...draft, extension: e.target.value })} placeholder="Extension" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.phone ?? c.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                        <input value={draft.email ?? c.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" className="px-2 py-1 text-[12px] border border-[var(--color-border)] rounded" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => saveEdit(c.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand text-white text-[11px]"><Save className="w-3 h-3" /> Save</button>
                        <button onClick={() => { setEditing(null); setDraft({}); }} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-border)] text-[11px]"><X className="w-3 h-3" /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-navy">{c.name}</span>
                          {c.pinned && <Pin className="w-3 h-3 text-brand" strokeWidth={2} />}
                          {!c.active && <span className="text-[9px] uppercase tracking-wider text-pink-dark">hidden</span>}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">
                          {[c.role, c.department].filter(Boolean).join(' · ')}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          {[c.extension && `ext. ${c.extension}`, c.phone, c.email].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => togglePin(c.id, c.pinned)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          {c.pinned ? <><PinOff className="w-3 h-3" />Unpin</> : <><Pin className="w-3 h-3" />Pin</>}
                        </button>
                        <button onClick={() => { setEditing(c.id); setDraft({}); }} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => setHistoryFor(c)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-navy hover:border-brand hover:text-brand inline-flex items-center gap-1">
                          <History className="w-3 h-3" /> History
                        </button>
                        <button onClick={() => toggleActive(c.id, c.active)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> {c.active ? 'Hide' : 'Unhide'}
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
          entityType="contact" entityId={Number(historyFor.id)} entityLabel={historyFor.name}
          adminToken={adminToken} onRestored={refresh} />
      )}
    </div>
  );
}
