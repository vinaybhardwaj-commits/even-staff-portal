'use client';
import { useEffect, useState } from 'react';
import { X, Loader2, History, RotateCcw } from 'lucide-react';
import { relativeTime, absoluteTime } from '@/lib/portal/time';

type EntityType = 'resource' | 'pilot_app' | 'announcement' | 'contact' | 'video' | 'complaint_type';

type Version = {
  id: number | string;
  version_num: number;
  snapshot: Record<string, unknown>;
  changed_by: string | null;
  changed_at: string;
};

const RESTORABLE = new Set<EntityType>(['resource', 'pilot_app', 'announcement', 'contact']);

export function VersionHistoryDrawer({
  open, onClose, entityType, entityId, entityLabel, adminToken, onRestored,
}: {
  open: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: number | string;
  entityLabel: string;
  adminToken: string;
  onRestored?: () => void;
}) {
  const auth = `Bearer ${adminToken}`;
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeId, setActiveId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true); setError(null); setActiveId(null);
    fetch(`/api/admin/record-versions?entity_type=${entityType}&entity_id=${entityId}`, {
      headers: { authorization: auth }, cache: 'no-store',
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setVersions((j.versions || []) as Version[]);
        if (j.versions?.[0]) setActiveId(j.versions[0].id);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, entityType, entityId, auth]);

  if (!open) return null;
  const active = versions.find((v) => v.id === activeId);
  const canRestore = RESTORABLE.has(entityType);

  async function restore(versionId: number | string) {
    if (!confirm('Restore this version? It applies the snapshot back AND writes a new version row (no history lost).')) return;
    setRestoring(true); setError(null);
    try {
      const r = await fetch('/api/admin/record-versions/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: auth },
        body: JSON.stringify({ entity_type: entityType, entity_id: Number(entityId), version_id: Number(versionId) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'restore failed');
      onRestored?.();
      onClose();
    } catch (e) { setError((e as Error).message); }
    finally { setRestoring(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30" />
      <aside className="w-full max-w-2xl bg-white border-l border-[var(--color-border)] shadow-card flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="px-5 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
          <History className="w-4 h-4 text-brand" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-navy">Version history</div>
            <div className="text-[10px] text-[var(--color-text-muted)] truncate">{entityType} · {entityLabel}</div>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-[var(--color-text-muted)] hover:text-navy" /></button>
        </header>

        {error && <div className="mx-5 mt-3 bg-pink-light text-pink-dark text-[11px] px-2 py-1 rounded">{error}</div>}

        <div className="flex-1 grid grid-cols-[200px_1fr] min-h-0">
          {/* Version list */}
          <div className="border-r border-[var(--color-border)] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-[11px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-[var(--color-text-muted)]">No versions yet.</div>
            ) : (
              <ul>
                {versions.map((v) => (
                  <li key={v.id}>
                    <button
                      onClick={() => setActiveId(v.id)}
                      className={`w-full text-left px-3 py-2 border-b border-[var(--color-border)] hover:bg-[var(--color-bg)] ${activeId === v.id ? 'bg-brand-faint' : ''}`}
                    >
                      <div className="text-[11px] font-medium text-navy">v{v.version_num}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]" title={absoluteTime(v.changed_at)}>{relativeTime(v.changed_at)}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">{v.changed_by || 'unknown'}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Snapshot view */}
          <div className="overflow-y-auto p-4">
            {!active ? (
              <div className="text-[11px] text-[var(--color-text-muted)]">Pick a version to view its snapshot.</div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[12px] font-semibold text-navy">v{active.version_num} snapshot</div>
                  {canRestore && (
                    <button
                      onClick={() => restore(active.id)}
                      disabled={restoring}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand text-white text-[11px] hover:bg-brand-dark disabled:bg-[var(--color-text-muted)]"
                    >
                      {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Restore this version
                    </button>
                  )}
                </div>
                <pre className="text-[10px] font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">
{JSON.stringify(active.snapshot, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
