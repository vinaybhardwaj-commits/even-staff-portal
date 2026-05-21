'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock, Filter, AlertOctagon } from 'lucide-react';
import { SeverityBadge } from '@/components/sewa/SeverityBadge';
import { StatusBadge } from '@/components/sewa/StatusBadge';
import { relativeTime } from '@/lib/portal/time';

type Complaint = {
  id: number | string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'ack' | 'in_progress' | 'resolved' | 'wont_fix';
  confidential: boolean;
  raised_by_display_name: string;
  assigned_to: string | null;
  sla_due_at: string;
  created_at: string;
  resolved_at: string | null;
  complaint_type_name: string | null;
  complaint_type_icon: string | null;
  tags: string[];
  soft_deleted_at: string | null;
};

const STATUS_FILTER_OPTS: { label: string; values: string[] }[] = [
  { label: 'All open', values: ['open', 'ack', 'in_progress'] },
  { label: 'Open', values: ['open'] },
  { label: 'Acknowledged', values: ['ack'] },
  { label: 'In progress', values: ['in_progress'] },
  { label: 'Resolved', values: ['resolved'] },
];

export function AdminSewaClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>(['open', 'ack', 'in_progress']);
  const [severityFilter, setSeverityFilter] = useState<string | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/sewa/complaints?includeDeleted=${includeDeleted ? '1' : '0'}`, { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'list failed');
      setItems(j.complaints || []);
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [includeDeleted]);

  const filtered = items.filter((c) => {
    if (!statusFilter.includes(c.status)) return false;
    if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
    return true;
  });

  const counts = {
    open: items.filter((c) => c.status === 'open').length,
    ack:  items.filter((c) => c.status === 'ack').length,
    inp:  items.filter((c) => c.status === 'in_progress').length,
    crit: items.filter((c) => c.severity === 'critical' && c.status !== 'resolved').length,
  };

  return (
    <div className="space-y-4">
      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-2">
        <Stat label="Open" value={counts.open} />
        <Stat label="Acknowledged" value={counts.ack} />
        <Stat label="In progress" value={counts.inp} />
        <Stat label="Critical (unresolved)" value={counts.crit} highlight={counts.crit > 0} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-3 flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        <div className="flex items-center gap-1">
          {STATUS_FILTER_OPTS.map((opt) => {
            const isActive = opt.values.length === statusFilter.length && opt.values.every((v) => statusFilter.includes(v));
            return (
              <button key={opt.label} onClick={() => setStatusFilter(opt.values)}
                className={`text-[11px] font-medium px-2 py-1 rounded-full border transition-colors ${isActive ? 'bg-brand text-white border-brand' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-brand'}`}>
                {opt.label}
              </button>
            );
          })}
        </div>
        <span className="text-[10px] text-[var(--color-text-muted)] mx-2">·</span>
        <div className="flex items-center gap-1">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`text-[11px] font-medium px-2 py-1 rounded-full border ${severityFilter === s ? 'bg-brand text-white border-brand' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-brand'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <label className="text-[10px] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
          <input type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} className="rounded" />
          Show resolved/soft-deleted
        </label>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-semibold text-navy">Complaints ({filtered.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]">No complaints match these filters.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {filtered.map((c) => {
              const isDeleted = !!c.soft_deleted_at;
              return (
                <li key={c.id} className={isDeleted ? 'opacity-60' : ''}>
                  <Link href={`/admin/sewa/${c.id}`} className="block px-4 py-3 hover:bg-[var(--color-bg)] transition-colors">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] text-[var(--color-text-muted)] font-mono">#{c.id}</span>
                      {c.complaint_type_icon && <span className="text-[12px]">{c.complaint_type_icon}</span>}
                      {c.complaint_type_name && <span className="text-[10px] text-[var(--color-text-muted)]">{c.complaint_type_name}</span>}
                      <SeverityBadge severity={c.severity} />
                      <StatusBadge status={c.status} />
                      {c.confidential && <Lock className="w-3 h-3 text-[var(--color-text-muted)]" />}
                      {c.severity === 'critical' && c.status !== 'resolved' && <AlertOctagon className="w-3 h-3 text-pink" />}
                      <span className="text-[10px] text-[var(--color-text-muted)]">{relativeTime(c.created_at)}</span>
                      {c.assigned_to && <span className="text-[10px] text-[var(--color-text-muted)]">· assigned: {c.assigned_to}</span>}
                    </div>
                    <div className="text-[13px] font-medium text-navy leading-snug">{c.title}</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] leading-snug truncate mt-0.5">
                      by {c.raised_by_display_name} — {c.description}
                    </div>
                    {c.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {c.tags.map((t) => (
                          <span key={t} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-navy/10 text-navy">{t}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border ${highlight ? 'border-pink' : 'border-[var(--color-border)]'} p-3`}>
      <div className={`text-[18px] font-semibold ${highlight ? 'text-pink-dark' : 'text-navy'}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}
