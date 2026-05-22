'use client';
import { useEffect, useState, useMemo } from 'react';
import { X, Loader2, History, RotateCcw, GitCompare } from 'lucide-react';
import { relativeTime, absoluteTime } from '@/lib/portal/time';

type EntityType = 'resource' | 'pilot_app' | 'announcement' | 'contact' | 'video' | 'complaint_type' | 'home_layout';

type Version = {
  id: number | string;
  version_num: number;
  snapshot: Record<string, unknown>;
  changed_by: string | null;
  changed_at: string;
};

const RESTORABLE = new Set<EntityType>(['resource', 'pilot_app', 'announcement', 'contact', 'home_layout']);

type Mode = 'view' | 'diff';

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
  const [compareId, setCompareId] = useState<number | string | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true); setError(null); setActiveId(null); setCompareId(null); setMode('view');
    fetch(`/api/admin/record-versions?entity_type=${entityType}&entity_id=${entityId}`, {
      headers: { authorization: auth }, cache: 'no-store',
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        const vs = (j.versions || []) as Version[];
        setVersions(vs);
        if (vs[0]) setActiveId(vs[0].id);
        if (vs[1]) setCompareId(vs[1].id);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, entityType, entityId, auth]);

  const active = versions.find((v) => v.id === activeId);
  const compare = versions.find((v) => v.id === compareId);
  const canRestore = RESTORABLE.has(entityType);
  const canDiff = versions.length >= 2;

  const diff = useMemo(() => {
    if (mode !== 'diff' || !active || !compare) return [];
    const left = compare.snapshot ?? {}; // older
    const right = active.snapshot ?? {};  // newer
    const allKeys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
    return allKeys.map((k) => {
      const l = JSON.stringify(left[k]);
      const r = JSON.stringify(right[k]);
      const status = l === r ? 'same' : l === undefined ? 'added' : r === undefined ? 'removed' : 'changed';
      return { key: k, left: l, right: r, status };
    });
  }, [mode, active, compare]);

  if (!open) return null;

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
      <aside className="w-full max-w-3xl bg-white border-l border-[var(--color-border)] shadow-card flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="px-5 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
          <History className="w-4 h-4 text-brand" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-navy">Version history</div>
            <div className="text-[10px] text-[var(--color-text-muted)] truncate">{entityType} · {entityLabel}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMode('view')} className={`text-[10px] px-2 py-1 rounded ${mode === 'view' ? 'bg-brand-faint text-brand' : 'text-[var(--color-text-muted)] hover:text-navy'}`}>View</button>
            <button onClick={() => setMode('diff')} disabled={!canDiff} className={`text-[10px] px-2 py-1 rounded inline-flex items-center gap-1 ${mode === 'diff' ? 'bg-brand-faint text-brand' : 'text-[var(--color-text-muted)] hover:text-navy disabled:opacity-40'}`}>
              <GitCompare className="w-3 h-3" /> Diff
            </button>
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
                {versions.map((v) => {
                  const isActive = activeId === v.id;
                  const isCompare = compareId === v.id;
                  return (
                    <li key={v.id} className="border-b border-[var(--color-border)]">
                      <button
                        onClick={() => setActiveId(v.id)}
                        className={`w-full text-left px-3 py-2 hover:bg-[var(--color-bg)] ${isActive ? 'bg-brand-faint' : ''}`}
                      >
                        <div className="text-[11px] font-medium text-navy">v{v.version_num}{isActive && mode === 'diff' && <span className="ml-1 text-[9px] text-brand uppercase">newer</span>}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)]" title={absoluteTime(v.changed_at)}>{relativeTime(v.changed_at)} · {v.changed_by || 'unknown'}</div>
                      </button>
                      {mode === 'diff' && (
                        <button
                          onClick={() => setCompareId(v.id)}
                          className={`block w-full text-left px-3 pb-1.5 text-[9px] uppercase tracking-wider ${isCompare ? 'text-pink-dark font-semibold' : 'text-[var(--color-text-muted)] hover:text-navy'}`}
                        >
                          {isCompare ? '◀ comparing as older' : 'compare as older'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Right pane */}
          <div className="overflow-y-auto p-4">
            {mode === 'view' && active && (
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
                <pre className="text-[10px] font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap">{JSON.stringify(active.snapshot, null, 2)}</pre>
              </div>
            )}

            {mode === 'diff' && active && compare && (
              <div>
                <div className="text-[11px] text-[var(--color-text-muted)] mb-2">
                  Comparing <span className="font-semibold text-pink-dark">v{compare.version_num}</span> (older) → <span className="font-semibold text-brand">v{active.version_num}</span> (newer)
                </div>
                <div className="space-y-1">
                  {diff.map((d) => (
                    <div key={d.key} className={`text-[11px] font-mono border-l-2 pl-2 py-1 ${
                      d.status === 'same' ? 'border-[var(--color-border)] opacity-50' :
                      d.status === 'added' ? 'border-emerald-500 bg-emerald-50' :
                      d.status === 'removed' ? 'border-pink bg-pink-light' :
                      'border-amber-500 bg-amber-50'
                    }`}>
                      <div className="font-semibold text-navy text-[10px]">{d.key} <span className="uppercase text-[8px] text-[var(--color-text-muted)]">{d.status}</span></div>
                      {d.status === 'changed' && (
                        <>
                          <div className="text-pink-dark"><span className="text-[8px] mr-1">-</span>{d.left}</div>
                          <div className="text-emerald-700"><span className="text-[8px] mr-1">+</span>{d.right}</div>
                        </>
                      )}
                      {d.status === 'added' && <div className="text-emerald-700"><span className="text-[8px] mr-1">+</span>{d.right}</div>}
                      {d.status === 'removed' && <div className="text-pink-dark"><span className="text-[8px] mr-1">-</span>{d.left}</div>}
                      {d.status === 'same' && <div className="text-[var(--color-text-muted)]">{d.left?.slice(0, 80)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'diff' && !canDiff && (
              <div className="text-[11px] text-[var(--color-text-muted)] py-6 text-center">
                Need at least 2 versions to diff.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
