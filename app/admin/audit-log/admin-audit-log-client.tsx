'use client';
import { useEffect, useState } from 'react';
import { Loader2, Activity } from 'lucide-react';
import { relativeTime, absoluteTime } from '@/lib/portal/time';

type Action = {
  id: number | string;
  actor_name: string | null;
  action: string;
  resource_type: string | null;
  resource_id: number | string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export function AdminAuditLogClient({ adminToken }: { adminToken: string }) {
  const auth = `Bearer ${adminToken}`;
  const [items, setItems] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/audit-log?limit=200', { headers: { authorization: auth }, cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (j.error) throw new Error(j.error); setItems(j.actions); setError(null); })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [auth]);

  return (
    <div className="space-y-4">
      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-semibold text-navy">Last {items.length} admin actions</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="w-8 h-8 text-[var(--color-text-muted)] opacity-40 mx-auto mb-2" />
            <div className="text-[12px] text-[var(--color-text-secondary)]">No admin actions logged yet.</div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-1">Actions start logging now — future edits will appear here.</div>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {items.map((a) => (
              <li key={a.id} className="px-4 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono">#{a.id}</span>
                  <span className="text-[12px] font-semibold text-navy capitalize">{a.action.replace(/_/g, ' ')}</span>
                  {a.resource_type && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">on {a.resource_type}{a.resource_id ? ` #${a.resource_id}` : ''}</span>
                  )}
                  <span className="text-[10px] text-[var(--color-text-muted)]" title={absoluteTime(a.created_at)}>· {relativeTime(a.created_at)}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">by {a.actor_name || 'unknown'}</span>
                </div>
                {a.meta && Object.keys(a.meta).length > 0 && (
                  <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 font-mono">
                    {Object.entries(a.meta).slice(0, 5).map(([k, v]) => `${k}: ${String(v).slice(0, 80)}`).join(' · ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
