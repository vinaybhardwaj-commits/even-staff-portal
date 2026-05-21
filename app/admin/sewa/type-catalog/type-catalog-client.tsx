'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Trash2, ArrowRight, Archive, ArchiveRestore } from 'lucide-react';

type CType = {
  id: number | string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  default_severity: 'low' | 'medium' | 'high' | 'critical';
  sla_low_hours: number;
  sla_medium_hours: number;
  sla_high_hours: number;
  sla_critical_hours: number;
  active: boolean;
  retired_at: string | null;
  sort_order: number;
};
type Field = { id: number | string; field_slug: string; field_label: string; field_type: string; required: boolean };
type Resolution = { id: number | string; slug: string; label: string; icon: string | null; requires_note: boolean };

export function TypeCatalogClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [types, setTypes] = useState<CType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [fieldsByType, setFieldsByType] = useState<Record<number, Field[]>>({});
  const [resByType, setResByType] = useState<Record<number, Resolution[]>>({});

  // Add type form
  const [name, setName] = useState(''); const [slug, setSlug] = useState(''); const [icon, setIcon] = useState('');
  const [defSev, setDefSev] = useState<CType['default_severity']>('medium');
  const [adding, setAdding] = useState(false);

  // Field add
  const [newField, setNewField] = useState<{ field_slug: string; field_label: string; field_type: string; required: boolean }>({ field_slug: '', field_label: '', field_type: 'text', required: false });
  // Resolution add
  const [newRes, setNewRes] = useState<{ slug: string; label: string; icon: string; requires_note: boolean }>({ slug: '', label: '', icon: '', requires_note: false });

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/sewa/complaint-types', { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'list failed');
      setTypes(j.types || []);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function loadDetails(typeId: number) {
    if (fieldsByType[typeId] && resByType[typeId]) return;
    try {
      const [fr, rr] = await Promise.all([
        fetch(`/api/admin/sewa/complaint-types/${typeId}/fields`, { headers: { authorization: auth }, cache: 'no-store' }),
        fetch(`/api/admin/sewa/complaint-types/${typeId}/resolutions`, { headers: { authorization: auth }, cache: 'no-store' }),
      ]);
      const fj = await fr.json(); const rj = await rr.json();
      setFieldsByType((p) => ({ ...p, [typeId]: fj.fields || [] }));
      setResByType((p) => ({ ...p, [typeId]: rj.resolutions || [] }));
    } catch (e) { setError((e as Error).message); }
  }

  async function addType(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setAdding(true); setError(null);
    try {
      const r = await fetch('/api/admin/sewa/complaint-types', {
        method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), icon: icon.trim(), default_severity: defSev }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'add failed');
      setName(''); setSlug(''); setIcon(''); setDefSev('medium');
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setAdding(false); }
  }

  async function toggleRetire(t: CType) {
    try {
      await fetch(`/api/admin/sewa/complaint-types/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ retire: !t.retired_at }) });
      await refresh();
    } catch (e) { setError((e as Error).message); }
  }

  async function addField(typeId: number) {
    if (!newField.field_slug.trim() || !newField.field_label.trim()) return;
    try {
      await fetch(`/api/admin/sewa/complaint-types/${typeId}/fields`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify(newField),
      });
      setNewField({ field_slug: '', field_label: '', field_type: 'text', required: false });
      setFieldsByType((p) => ({ ...p, [typeId]: [] })); // bust cache
      await loadDetails(typeId);
    } catch (e) { setError((e as Error).message); }
  }
  async function deleteField(fid: number) {
    try { await fetch(`/api/admin/sewa/complaint-type-fields/${fid}`, { method: 'DELETE', headers: { authorization: auth } }); setFieldsByType({}); if (expanded) await loadDetails(expanded); }
    catch (e) { setError((e as Error).message); }
  }
  async function addRes(typeId: number) {
    if (!newRes.slug.trim() || !newRes.label.trim()) return;
    try {
      await fetch(`/api/admin/sewa/complaint-types/${typeId}/resolutions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify(newRes),
      });
      setNewRes({ slug: '', label: '', icon: '', requires_note: false });
      setResByType((p) => ({ ...p, [typeId]: [] }));
      await loadDetails(typeId);
    } catch (e) { setError((e as Error).message); }
  }
  async function deleteRes(rid: number) {
    try { await fetch(`/api/admin/sewa/complaint-resolutions/${rid}`, { method: 'DELETE', headers: { authorization: auth } }); setResByType({}); if (expanded) await loadDetails(expanded); }
    catch (e) { setError((e as Error).message); }
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Link href="/admin/sewa" className="text-[11px] text-[var(--color-text-muted)] hover:text-brand">← Back to Sewa dashboard</Link>
      </div>

      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}

      <form onSubmit={addType} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-brand" />
          <h2 className="text-[13px] font-semibold text-navy">Add complaint type</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (kebab-case)" required className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon (emoji)" className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg" />
          <select value={defSev} onChange={(e) => setDefSev(e.target.value as CType['default_severity'])} className="px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
            <option value="low">Default: Low</option><option value="medium">Default: Medium</option><option value="high">Default: High</option><option value="critical">Default: Critical</option>
          </select>
        </div>
        <button type="submit" disabled={adding || !name.trim() || !slug.trim()} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)]">
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {adding ? 'Adding…' : 'Add type'}
        </button>
      </form>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-2">
          {types.map((t) => {
            const isOpen = expanded === Number(t.id);
            const fields = fieldsByType[Number(t.id)] || [];
            const resolutions = resByType[Number(t.id)] || [];
            return (
              <div key={t.id} className={`bg-white rounded-xl border border-[var(--color-border)] ${t.retired_at ? 'opacity-60' : ''}`}>
                <button onClick={() => { setExpanded(isOpen ? null : Number(t.id)); if (!isOpen) loadDetails(Number(t.id)); }} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  <span className="text-[18px]">{t.icon || '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-navy">{t.name}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">{t.slug} · default {t.default_severity} · SLA {t.sla_critical_hours}/{t.sla_high_hours}/{t.sla_medium_hours}/{t.sla_low_hours}h (crit/high/med/low)</div>
                  </div>
                  {t.retired_at && <span className="text-[9px] uppercase tracking-wider text-pink-dark">Retired</span>}
                  <ArrowRight className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--color-border)] p-4 space-y-4 bg-[var(--color-bg)]/40">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleRetire(t)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] hover:border-brand text-navy inline-flex items-center gap-1">
                        {t.retired_at ? <><ArchiveRestore className="w-3 h-3" /> Unretire</> : <><Archive className="w-3 h-3" /> Retire (preserves history)</>}
                      </button>
                    </div>

                    {/* Fields */}
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Custom fields ({fields.length})</div>
                      {fields.length === 0 ? (
                        <div className="text-[11px] text-[var(--color-text-muted)] mb-2">No custom fields for this type.</div>
                      ) : (
                        <ul className="space-y-1 mb-2">
                          {fields.map((f) => (
                            <li key={f.id} className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-[var(--color-border)]">
                              <span className="text-[11px] font-medium text-navy">{f.field_label}</span>
                              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{f.field_slug}</span>
                              <span className="text-[9px] uppercase tracking-wider bg-[var(--color-bg)] text-[var(--color-text-muted)] px-1 rounded">{f.field_type}</span>
                              {f.required && <span className="text-[9px] uppercase tracking-wider text-pink-dark">required</span>}
                              <div className="flex-1" />
                              <button onClick={() => deleteField(Number(f.id))} className="text-pink-dark hover:text-pink"><Trash2 className="w-3 h-3" /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex items-center gap-1">
                        <input value={newField.field_slug} onChange={(e) => setNewField({ ...newField, field_slug: e.target.value })} placeholder="slug" className="px-2 py-1 text-[11px] border border-[var(--color-border)] rounded w-24" />
                        <input value={newField.field_label} onChange={(e) => setNewField({ ...newField, field_label: e.target.value })} placeholder="Label" className="px-2 py-1 text-[11px] border border-[var(--color-border)] rounded flex-1" />
                        <select value={newField.field_type} onChange={(e) => setNewField({ ...newField, field_type: e.target.value })} className="px-2 py-1 text-[11px] border border-[var(--color-border)] rounded">
                          <option value="text">text</option><option value="textarea">textarea</option><option value="select">select</option><option value="number">number</option><option value="date">date</option>
                        </select>
                        <label className="text-[10px] inline-flex items-center gap-1"><input type="checkbox" checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} className="rounded" />required</label>
                        <button onClick={() => addField(Number(t.id))} className="text-[10px] px-2 py-1 rounded bg-brand text-white">Add</button>
                      </div>
                    </div>

                    {/* Resolutions */}
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Resolutions ({resolutions.length})</div>
                      {resolutions.length === 0 ? (
                        <div className="text-[11px] text-[var(--color-text-muted)] mb-2">No resolutions for this type.</div>
                      ) : (
                        <ul className="space-y-1 mb-2">
                          {resolutions.map((r) => (
                            <li key={r.id} className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-[var(--color-border)]">
                              <span className="text-[14px]">{r.icon || '✅'}</span>
                              <span className="text-[11px] font-medium text-navy">{r.label}</span>
                              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{r.slug}</span>
                              {r.requires_note && <span className="text-[9px] uppercase tracking-wider text-pink-dark">note required</span>}
                              <div className="flex-1" />
                              <button onClick={() => deleteRes(Number(r.id))} className="text-pink-dark hover:text-pink"><Trash2 className="w-3 h-3" /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex items-center gap-1">
                        <input value={newRes.slug} onChange={(e) => setNewRes({ ...newRes, slug: e.target.value })} placeholder="slug" className="px-2 py-1 text-[11px] border border-[var(--color-border)] rounded w-24" />
                        <input value={newRes.label} onChange={(e) => setNewRes({ ...newRes, label: e.target.value })} placeholder="Label" className="px-2 py-1 text-[11px] border border-[var(--color-border)] rounded flex-1" />
                        <input value={newRes.icon} onChange={(e) => setNewRes({ ...newRes, icon: e.target.value })} placeholder="Icon" className="px-2 py-1 text-[11px] border border-[var(--color-border)] rounded w-16" />
                        <label className="text-[10px] inline-flex items-center gap-1"><input type="checkbox" checked={newRes.requires_note} onChange={(e) => setNewRes({ ...newRes, requires_note: e.target.checked })} className="rounded" />note req</label>
                        <button onClick={() => addRes(Number(t.id))} className="text-[10px] px-2 py-1 rounded bg-brand text-white">Add</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
