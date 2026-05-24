'use client';

/**
 * v1.7 Sprint B — admin traces list (list view, lock #12: last 7 days, 50/page,
 * newest first, with tsvector free-text search lock #9 + filters lock #12).
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type TraceRow = {
  trace_id: string;
  user_id: number;
  feature: string;
  status: string;
  severity: string | null;
  question_preview: string | null;
  started_at: string;
  finished_at: string | null;
  total_ms: number | null;
  model_summary: Record<string, string> | null;
  event_count: number;
};

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const totalSec = Math.round(ms / 1000);
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const SEVERITY_STYLES: Record<string, string> = {
  none: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  minor: 'bg-amber-50 text-amber-700 border-amber-200',
  moderate: 'bg-orange-50 text-orange-700 border-orange-200',
  major: 'bg-rose-50 text-rose-700 border-rose-200',
};
const STATUS_STYLES: Record<string, string> = {
  success: 'text-emerald-700',
  error: 'text-rose-700',
  partial: 'text-amber-700',
  running: 'text-blue-600',
};

export function AdminTracesClient({ adminToken, basePath }: { adminToken: string; basePath: string }) {
  const [traces, setTraces] = useState<TraceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      if (severity) params.set('severity', severity);
      const r = await fetch(`/api/admin/traces?${params}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setTraces(j.traces || []);
      setTotal(j.total || 0);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setLoading(false);
    }
  }, [adminToken, q, status, severity, offset]);

  useEffect(() => { load(); }, [load]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    load();
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Every /ask query is captured with full forensic detail — prompts, retrieved chunks, critique JSON, every token. Click into a trace for the timeline + draft↔revised diff + downloads.
      </p>

      {/* Search + filters */}
      <form onSubmit={onSearchSubmit} className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
        <input
          type="search" placeholder="Search question + answer…" value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[200px] rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }}
                className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="partial">Partial</option>
        </select>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setOffset(0); }}
                className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm">
          <option value="">All severities</option>
          <option value="none">None</option>
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="major">Major</option>
        </select>
        <button type="submit" className="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
          {loading ? 'Loading…' : 'Search'}
        </button>
      </form>

      {error && <div className="mb-3 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

      <div className="text-xs text-slate-500 mb-2">
        {total} trace{total !== 1 ? 's' : ''} · last 7 days default · showing {offset + 1}–{Math.min(offset + limit, total)}
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">Feature</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Question</th>
              <th className="px-3 py-2 text-right">Status</th>
              <th className="px-3 py-2 text-right">Time</th>
              <th className="px-3 py-2 text-right">Severity</th>
              <th className="px-3 py-2 text-right">Events</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {traces.length === 0 && !loading && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-400">No traces found</td></tr>
            )}
            {traces.map((t) => (
              <tr key={t.trace_id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(t.started_at)}</td>
                <td className="px-3 py-2 text-xs"><span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.5">{t.feature}</span></td>
                <td className="px-3 py-2 text-xs text-slate-500">#{t.user_id}</td>
                <td className="px-3 py-2">
                  <Link href={`/${basePath}/traces/${t.trace_id}`} className="text-brand hover:underline">
                    {t.question_preview || <span className="text-slate-400 italic">no question captured</span>}
                  </Link>
                </td>
                <td className={`px-3 py-2 text-right text-xs font-medium ${STATUS_STYLES[t.status] || 'text-slate-500'}`}>{t.status}</td>
                <td className="px-3 py-2 text-right text-xs text-slate-500">{formatDuration(t.total_ms)}</td>
                <td className="px-3 py-2 text-right">
                  {t.severity ? (
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] ${SEVERITY_STYLES[t.severity] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>{t.severity}</span>
                  ) : <span className="text-xs text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2 text-right text-xs text-slate-500">{t.event_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="rounded border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:border-brand">
            ← Previous
          </button>
          <span className="text-xs text-slate-500">Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}</span>
          <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}
                  className="rounded border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:border-brand">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
