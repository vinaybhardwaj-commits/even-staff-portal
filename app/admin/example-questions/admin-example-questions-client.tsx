'use client';

import { useEffect, useState, useCallback } from 'react';

type Row = { id: number; question: string; specialty: string; active: boolean; sort_order: number };

const SPECIALTIES = [
  'General Surgery', 'Orthopedics', 'ENT', 'Urology', 'OB-GYN', 'Gastro',
  'Cardiology', 'Pulm', 'Neuro', 'ID', 'Endo', 'Renal', 'Heme', 'EM', 'Psych', 'Peds', 'General',
];

export function AdminExampleQuestionsClient({ adminToken }: { adminToken: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState('');
  const [draftS, setDraftS] = useState('General Surgery');

  const auth = { Authorization: `Bearer ${adminToken}` };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch('/api/admin/example-questions', { headers: auth });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRows(j.questions || []);
    } catch (e) { setError(String((e as Error).message)); } finally { setLoading(false); }
  }, [adminToken]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!draftQ.trim()) return;
    const r = await fetch('/api/admin/example-questions', { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ question: draftQ, specialty: draftS }) });
    if (r.ok) { setDraftQ(''); load(); }
  }
  async function toggle(row: Row) {
    await fetch(`/api/admin/example-questions/${row.id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !row.active }) });
    load();
  }
  async function del(row: Row) {
    if (!confirm(`Delete "${row.question.slice(0, 60)}…"?`)) return;
    await fetch(`/api/admin/example-questions/${row.id}`, { method: 'DELETE', headers: auth });
    load();
  }

  // Group by specialty for display
  const grouped: Record<string, Row[]> = {};
  for (const r of rows) (grouped[r.specialty] ||= []).push(r);

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        These rotate on every /ask page load — 4 chips picked from 4 random specialty buckets.
        Total {rows.length}; active {rows.filter((r) => r.active).length}.
      </p>

      {/* Add form */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-medium text-slate-700 mb-2">Add a new example question</div>
        <div className="flex gap-2">
          <input value={draftQ} onChange={(e) => setDraftQ(e.target.value)} placeholder="e.g. Indications for laser hemorrhoidopexy vs stapler hemorrhoidectomy in grade III internal hemorrhoids"
                 className="flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" />
          <select value={draftS} onChange={(e) => setDraftS(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm">
            {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={add} className="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">Add</button>
        </div>
      </div>

      {error && <div className="mb-3 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{error}</div>}
      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {/* Grouped by specialty */}
      <div className="space-y-4">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([spec, items]) => (
          <div key={spec}>
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-600">{spec} ({items.length})</div>
            <ul className="space-y-1">
              {items.map((r) => (
                <li key={r.id} className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${r.active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 text-slate-400 line-through'}`}>
                  <span className="flex-1">{r.question}</span>
                  <button onClick={() => toggle(r)} className="rounded border border-slate-200 px-2 py-0.5 text-[11px] hover:border-brand hover:text-brand">
                    {r.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => del(r)} className="rounded border border-rose-200 px-2 py-0.5 text-[11px] text-rose-700 hover:bg-rose-50">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
