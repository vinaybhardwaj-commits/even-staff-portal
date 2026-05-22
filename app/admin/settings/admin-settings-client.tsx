'use client';
import { useEffect, useState } from 'react';
import { Loader2, Save, RotateCcw, GripVertical, Eye, EyeOff } from 'lucide-react';
import type { HomeLayoutSettings, CardId } from '@/lib/portal/settings';

const CARD_LABELS: Record<CardId, string> = {
  updates:   'Hospital Updates & Announcements',
  video:     'Video player',
  sewa:      'Sewa · Raise a complaint',
  lit:       'Medical Literature',
  contacts:  'Quick Contacts',
  resources: 'Resources',
};

const REFRESH_OPTIONS: { value: number; label: string }[] = [
  { value: 0,   label: 'Off' },
  { value: 30,  label: 'Every 30s' },
  { value: 60,  label: 'Every 1m' },
  { value: 300, label: 'Every 5m' },
];

const DENSITY_OPTIONS: { value: 'compact' | 'default' | 'comfy'; label: string; hint: string }[] = [
  { value: 'compact', label: 'Compact',     hint: 'Tighter padding, smaller gaps' },
  { value: 'default', label: 'Default',     hint: 'Current spec' },
  { value: 'comfy',   label: 'Comfortable', hint: 'More breathing room, larger cards' },
];

export function AdminSettingsClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [settings, setSettings] = useState<HomeLayoutSettings | null>(null);
  const [defaults, setDefaults] = useState<HomeLayoutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<CardId | null>(null);
  const [tagsCsv, setTagsCsv] = useState('patient-impact, sla-breach, escalate-mgr, repeat, confidential');
  const [tagsSaving, setTagsSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/settings', { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'load failed');
      setSettings(j.home_layout);
      setDefaults(j.defaults);
      setDirty(false);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetch('/api/admin/sewa/suggested-tags', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (Array.isArray(j.tags)) setTagsCsv(j.tags.join(', ')); }).catch(() => {}); }, []);
  async function saveTags() {
    setTagsSaving(true);
    try {
      const tags = tagsCsv.split(',').map((s) => s.trim()).filter(Boolean);
      await fetch('/api/admin/sewa/suggested-tags', { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth }, body: JSON.stringify({ tags }) });
    } finally { setTagsSaving(false); }
  }

  async function save() {
    if (!settings) return;
    setSaving(true); setError(null);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify({ home_layout: settings }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'save failed');
      setDirty(false);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function resetToDefaults() {
    if (!confirm('Reset all home settings to defaults? This will write a new version row (no history lost).')) return;
    setSaving(true); setError(null);
    try {
      const r = await fetch('/api/admin/settings', { method: 'DELETE', headers: { authorization: auth } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'reset failed');
      setSettings(j.home_layout);
      setDirty(false);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  function update(patch: Partial<HomeLayoutSettings>) {
    setSettings((s) => s ? { ...s, ...patch } : s);
    setDirty(true);
  }

  function moveCard(fromIdx: number, toIdx: number) {
    if (!settings) return;
    const next = [...settings.cards];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    update({ cards: next });
  }

  function toggleVisible(id: CardId) {
    if (!settings) return;
    update({ cards: settings.cards.map((c) => c.id === id ? { ...c, visible: !c.visible } : c) });
  }

  if (loading) return <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
  if (!settings) return <div className="bg-pink-light text-pink-dark p-3 rounded">{error || 'Failed to load settings'}</div>;

  return (
    <div className="space-y-5">
      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}

      {/* HOME GRID ORDER + VISIBILITY */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-[13px] font-semibold text-navy mb-1">Home grid layout</h2>
        <p className="text-[11px] text-[var(--color-text-muted)] mb-3">Drag to reorder. Toggle the eye to hide a card from staff view (grid reflows automatically; admin always sees this list).</p>
        <ul className="space-y-1.5">
          {settings.cards.map((c, idx) => (
            <li
              key={c.id}
              draggable
              onDragStart={() => setDragId(c.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragId || dragId === c.id) { setDragId(null); return; }
                const fromIdx = settings.cards.findIndex((x) => x.id === dragId);
                if (fromIdx === -1) { setDragId(null); return; }
                moveCard(fromIdx, idx);
                setDragId(null);
              }}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[var(--color-border)] bg-white hover:border-brand cursor-move transition-colors ${dragId === c.id ? 'opacity-40' : ''}`}
            >
              <GripVertical className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] w-5">{idx + 1}.</span>
              <span className={`flex-1 text-[12px] ${c.visible ? 'text-navy' : 'text-[var(--color-text-muted)] line-through'}`}>{CARD_LABELS[c.id]}</span>
              <button
                onClick={() => toggleVisible(c.id)}
                className={`text-[10px] px-2 py-1 rounded border inline-flex items-center gap-1 ${c.visible ? 'border-[var(--color-border)] text-navy hover:border-brand hover:text-brand' : 'border-pink-light text-pink-dark hover:border-pink'}`}
                title={c.visible ? 'Hide from staff home' : 'Show on staff home'}
              >
                {c.visible ? <><Eye className="w-3 h-3" /> Visible</> : <><EyeOff className="w-3 h-3" /> Hidden</>}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* DENSITY */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-[13px] font-semibold text-navy mb-3">Density</h2>
        <div className="grid grid-cols-3 gap-2">
          {DENSITY_OPTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => update({ density: d.value })}
              className={`text-left p-3 rounded-lg border transition-colors ${settings.density === d.value ? 'border-brand bg-brand-faint text-navy' : 'border-[var(--color-border)] bg-white hover:border-brand/40'}`}
            >
              <div className="text-[12px] font-semibold text-navy">{d.label}</div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{d.hint}</div>
            </button>
          ))}
        </div>
      </section>

      {/* REFRESH */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-[13px] font-semibold text-navy mb-1">Home cards auto-refresh</h2>
        <p className="text-[11px] text-[var(--color-text-muted)] mb-3">Re-fetch announcements / contacts / resources on a timer (client-side). Off keeps the page static until manual reload.</p>
        <div className="flex flex-wrap items-center gap-2">
          {REFRESH_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => update({ refresh_interval_sec: o.value })}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-full border transition-colors ${settings.refresh_interval_sec === o.value ? 'bg-brand text-white border-brand' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-brand'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* KILLSWITCHES */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-[13px] font-semibold text-navy mb-3">Killswitches</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[12px] text-navy">
            <input
              type="checkbox" checked={settings.kills.new_pulse}
              onChange={(e) => update({ kills: { ...settings.kills, new_pulse: e.target.checked } })}
              className="rounded"
            />
            <span>Disable NEW pulsing dot</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">— calmer feed; useful if staff find the animation distracting</span>
          </label>
          <label className="flex items-center gap-2 text-[12px] text-navy">
            <input
              type="checkbox" checked={settings.kills.sewa_stats}
              onChange={(e) => update({ kills: { ...settings.kills, sewa_stats: e.target.checked } })}
              className="rounded"
            />
            <span>Hide the &quot;This month · X raised · Y resolved&quot; stat under the Sewa card</span>
          </label>
          <label className="flex items-center gap-2 text-[12px] text-navy">
            <input
              type="checkbox" checked={settings.kills.cmd_k}
              onChange={(e) => update({ kills: { ...settings.kills, cmd_k: e.target.checked } })}
              className="rounded"
            />
            <span>Hide the ⌘K hint in the header</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">— command palette not wired yet, hint can confuse</span>
          </label>
        </div>
      </section>


      {/* SEWA SUGGESTED TAGS */}
      <section className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <h2 className="text-[13px] font-semibold text-navy mb-1">Sewa suggested tags</h2>
        <p className="text-[11px] text-[var(--color-text-muted)] mb-3">Chip palette shown on admin complaint detail (per locked decision #32). Comma-separated.</p>
        <div className="flex items-center gap-2">
          <input value={tagsCsv} onChange={(e) => setTagsCsv(e.target.value)}
            placeholder="patient-impact, sla-breach, escalate-mgr, repeat, confidential"
            className="flex-1 px-3 py-2 text-[12px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand" />
          <button onClick={saveTags} disabled={tagsSaving} className="text-[11px] px-3 py-1.5 rounded bg-brand text-white hover:bg-brand-dark disabled:bg-[var(--color-text-muted)]">
            {tagsSaving ? 'Saving…' : 'Save tags'}
          </button>
        </div>
      </section>

      {/* SAVE BAR */}
      <div className="sticky bottom-0 bg-[var(--color-bg)] pt-3 pb-1 -mx-1 flex items-center gap-2">
        <button onClick={resetToDefaults} className="text-[11px] px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-pink hover:text-pink-dark inline-flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
        </button>
        <div className="flex-1" />
        {dirty && <span className="text-[11px] text-pink-dark">Unsaved changes</span>}
        <button onClick={save} disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)] disabled:cursor-not-allowed">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
