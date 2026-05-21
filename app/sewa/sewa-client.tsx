'use client';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, Send, Bell, AlertTriangle, Lock, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMyComplaintIds, addMyComplaintId } from '@/lib/portal/sewa-identity';
import { getDisplayName, setDisplayName, ANONYMOUS } from '@/lib/portal/identity';
import { SeverityBadge } from '@/components/sewa/SeverityBadge';
import { StatusBadge } from '@/components/sewa/StatusBadge';
import { relativeTime } from '@/lib/portal/time';

type Field = {
  id: number | string;
  field_slug: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'image';
  field_options: { options?: string[] } | null;
  required: boolean;
};
type Resolution = {
  id: number | string;
  slug: string;
  label: string;
  icon: string | null;
  requires_note: boolean;
};
type CType = {
  id: number | string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  default_severity: 'low' | 'medium' | 'high' | 'critical';
  fields: Field[];
  resolutions: Resolution[];
};

type Complaint = {
  id: number | string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'ack' | 'in_progress' | 'resolved' | 'wont_fix';
  confidential: boolean;
  raised_by_display_name: string;
  sla_due_at: string;
  created_at: string;
  resolved_at: string | null;
  complaint_type_name: string | null;
  complaint_type_icon: string | null;
  resolution_label: string | null;
  resolution_notes: string | null;
  tags: string[];
};

type Attachment = { url: string; pathname: string; contentType: string; size: number };

export function SewaClient({ initialTypes }: { initialTypes: CType[] }) {
  const router = useRouter();
  const search = useSearchParams();
  const tabFromUrl = search.get('tab') === 'mine' ? 'mine' : 'raise';
  const [tab, setTab] = useState<'raise' | 'mine'>(tabFromUrl);

  // Compose
  const [activeType, setActiveType] = useState<CType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [confidential, setConfidential] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [displayName, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  // Mine
  const [mine, setMine] = useState<Complaint[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);

  useEffect(() => { setName(getDisplayName()); }, []);

  // Pick type → seed severity to its default + clear custom values
  useEffect(() => {
    if (activeType) {
      setSeverity(activeType.default_severity);
      setCustomValues({});
    }
  }, [activeType]);

  const myIds = useMemo(() => getMyComplaintIds(), [tab, createdId]);

  useEffect(() => {
    if (tab !== 'mine') return;
    if (myIds.length === 0) { setMine([]); return; }
    setLoadingMine(true);
    fetch(`/api/sewa/complaints/by-ids?ids=${myIds.join(',')}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setMine((j.complaints || []) as Complaint[]))
      .catch(() => setMine([]))
      .finally(() => setLoadingMine(false));
  }, [tab, myIds.join(',')]);

  function resetCompose() {
    setActiveType(null); setTitle(''); setDescription(''); setSeverity('medium');
    setConfidential(false); setCustomValues({}); setAttachment(null); setError(null);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', f);
      // Reuse bulletin upload endpoint — same storage backend, same constraints
      const r = await fetch('/api/bulletin/upload', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) { setError(j.error === 'storage_not_configured' ? 'Attachment storage not configured.' : (j.detail || j.error || 'Upload failed')); return; }
      setAttachment({ url: j.url, pathname: j.pathname, contentType: j.contentType, size: j.size });
    } catch (err) { setError((err as Error).message); }
    finally { setUploading(false); }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeType) return;
    if (!title.trim() || !description.trim()) return;
    // Required custom fields validation (server also enforces)
    for (const f of activeType.fields) {
      if (f.required && !(customValues[f.field_slug] || '').trim()) {
        setError(`${f.field_label} is required`); return;
      }
    }
    setSubmitting(true); setError(null);
    try {
      const r = await fetch('/api/sewa/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_type_id: Number(activeType.id),
          title: title.trim(),
          description: description.trim(),
          severity,
          confidential,
          raised_by_display_name: displayName || ANONYMOUS,
          custom_fields: customValues,
          attachment_url: attachment?.url ?? null,
        }),
      });
      const j = await r.json();
      if (!r.ok) { setError(j.error || 'Failed to raise complaint'); return; }
      const newId = Number(j.id);
      addMyComplaintId(newId);
      setCreatedId(newId);
      resetCompose();
    } catch (err) { setError((err as Error).message); }
    finally { setSubmitting(false); }
  }

  function saveName(n: string) {
    setName(n); setDisplayName(n); setEditingName(false);
  }

  function switchTab(t: 'raise' | 'mine') {
    setTab(t);
    const params = new URLSearchParams(window.location.search);
    if (t === 'mine') params.set('tab', 'mine'); else params.delete('tab');
    const url = params.toString() ? `/sewa?${params}` : '/sewa';
    router.replace(url, { scroll: false });
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[var(--color-border)]">
        <button onClick={() => switchTab('raise')} className={`px-4 py-2 text-[13px] font-medium border-b-2 ${tab === 'raise' ? 'text-brand border-brand' : 'text-[var(--color-text-muted)] border-transparent hover:text-navy'}`}>
          Raise a complaint
        </button>
        <button onClick={() => switchTab('mine')} className={`px-4 py-2 text-[13px] font-medium border-b-2 ${tab === 'mine' ? 'text-brand border-brand' : 'text-[var(--color-text-muted)] border-transparent hover:text-navy'}`}>
          My past complaints {myIds.length > 0 && <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">({myIds.length})</span>}
        </button>
      </div>

      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg mb-3">{error}</div>}

      {tab === 'raise' && (
        <form onSubmit={onSubmit} className="space-y-4">
          {createdId && !activeType && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] px-3 py-2.5 rounded-lg flex items-center gap-2">
              <Bell className="w-4 h-4 shrink-0" />
              <span>Complaint #{createdId} raised. Routed to admin for triage. View it in <button type="button" onClick={() => switchTab('mine')} className="font-semibold underline">My past complaints</button>.</span>
              <button type="button" onClick={() => setCreatedId(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Type picker — chips */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">What kind of issue is this?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {initialTypes.map((t) => (
                <button
                  type="button" key={t.id}
                  onClick={() => setActiveType(t)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    activeType?.id === t.id
                      ? 'border-brand bg-brand-faint text-navy'
                      : 'border-[var(--color-border)] bg-white hover:border-brand/40 text-navy'
                  }`}
                >
                  <div className="text-[18px] mb-1">{t.icon || '💬'}</div>
                  <div className="text-[12px] font-semibold">{t.name}</div>
                  {t.description && <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{t.description}</div>}
                </button>
              ))}
            </div>
          </div>

          {activeType && (
            <>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Title</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Brief summary (e.g. ${activeType.slug === 'equipment-fault' ? 'Vitals monitor in bed 4 not turning on' : 'one-line description'})`}
                  maxLength={200} required
                  className="w-full px-3 py-2 text-[13px] font-medium text-navy bg-white border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Details</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={8000} required
                  placeholder="What happened, when, what you tried, anything else admin needs to know."
                  className="w-full px-3 py-2 text-[13px] text-navy bg-white border border-[var(--color-border)] rounded-lg resize-none focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>

              {/* Custom fields for this type */}
              {activeType.fields.length > 0 && (
                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 space-y-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">For {activeType.name}</div>
                  {activeType.fields.map((f) => {
                    const val = customValues[f.field_slug] || '';
                    const setVal = (v: string) => setCustomValues((cv) => ({ ...cv, [f.field_slug]: v }));
                    return (
                      <div key={f.id}>
                        <label className="block text-[11px] font-medium text-navy mb-0.5">
                          {f.field_label} {f.required && <span className="text-pink-dark">*</span>}
                        </label>
                        {f.field_type === 'textarea' ? (
                          <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={2}
                            className="w-full px-3 py-1.5 text-[12px] bg-white border border-[var(--color-border)] rounded-md resize-none focus:outline-none focus:border-brand" />
                        ) : f.field_type === 'select' && f.field_options?.options ? (
                          <select value={val} onChange={(e) => setVal(e.target.value)}
                            className="w-full px-3 py-1.5 text-[12px] bg-white border border-[var(--color-border)] rounded-md focus:outline-none focus:border-brand">
                            <option value="">— Select —</option>
                            {f.field_options.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.field_type === 'number' ? 'number' : f.field_type === 'date' ? 'date' : 'text'} value={val} onChange={(e) => setVal(e.target.value)}
                            className="w-full px-3 py-1.5 text-[12px] bg-white border border-[var(--color-border)] rounded-md focus:outline-none focus:border-brand" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Severity */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Severity</label>
                <div className="flex items-center gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                    <button type="button" key={s} onClick={() => setSeverity(s)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                        severity === s ? 'bg-brand text-white border-brand' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-brand hover:text-brand'
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  {severity === activeType.default_severity && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">(default for {activeType.name})</span>
                  )}
                </div>
              </div>

              {/* Confidential toggle */}
              <label className="flex items-center gap-2 text-[12px] text-navy cursor-pointer">
                <input type="checkbox" checked={confidential} onChange={(e) => setConfidential(e.target.checked)} className="rounded" />
                <Lock className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span>Mark as confidential — only admin sees the details; others see title + status only.</span>
              </label>

              {/* Attachment */}
              {attachment ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                  {attachment.contentType.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-brand" /> : <FileText className="w-4 h-4 text-brand" />}
                  <span className="text-[11px] text-[var(--color-text-secondary)] flex-1 truncate">{attachment.pathname}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">{(attachment.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" onClick={() => setAttachment(null)}><X className="w-3.5 h-3.5 text-[var(--color-text-muted)] hover:text-navy" /></button>
                </div>
              ) : (
                <div>
                  <input type="file" accept="image/*,application/pdf" onChange={onUpload} className="hidden" id="sewa-attach" disabled={uploading} />
                  <label htmlFor="sewa-attach" className="text-[11px] text-[var(--color-text-secondary)] hover:text-brand inline-flex items-center gap-1.5 cursor-pointer">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                    {uploading ? 'Uploading…' : 'Attach screenshot, photo, or PDF (10 MB max, optional)'}
                  </label>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]">
                {editingName ? (
                  <input autoFocus type="text" defaultValue={displayName === ANONYMOUS ? '' : displayName}
                    onBlur={(e) => saveName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveName((e.target as HTMLInputElement).value); } }}
                    placeholder="Your name (optional)" maxLength={60}
                    className="text-[11px] px-2 py-1 border border-[var(--color-border)] rounded bg-white" />
                ) : (
                  <button type="button" onClick={() => setEditingName(true)} className="text-[11px] text-[var(--color-text-muted)] hover:text-brand">
                    Raising as <span className="text-navy font-medium">{displayName || ANONYMOUS}</span> · change
                  </button>
                )}
                <div className="flex-1" />
                <button type="button" onClick={resetCompose} className="text-[11px] text-[var(--color-text-muted)] hover:text-navy px-2 py-1">Cancel</button>
                <button type="submit" disabled={submitting || !title.trim() || !description.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark disabled:bg-[var(--color-text-muted)] disabled:cursor-not-allowed">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {submitting ? 'Raising…' : 'Raise complaint'}
                </button>
              </div>
            </>
          )}

          {!activeType && !createdId && (
            <div className="text-[12px] text-[var(--color-text-muted)] py-6 text-center border-2 border-dashed border-[var(--color-border)] rounded-lg">
              <AlertTriangle className="w-7 h-7 text-[var(--color-text-muted)] opacity-40 mx-auto mb-2" strokeWidth={1.5} />
              Pick a complaint type above to start.
            </div>
          )}
        </form>
      )}

      {tab === 'mine' && (
        <div>
          {myIds.length === 0 ? (
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-10 text-center">
              <Bell className="w-10 h-10 text-[var(--color-text-muted)] opacity-40 mx-auto mb-3" strokeWidth={1.5} />
              <div className="text-[14px] font-medium text-navy mb-1">No past complaints from this browser</div>
              <div className="text-[12px] text-[var(--color-text-secondary)]">Complaints you raise from this browser will appear here.</div>
            </div>
          ) : loadingMine ? (
            <div className="text-center py-10 text-[12px] text-[var(--color-text-muted)]"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" /> Loading…</div>
          ) : (
            <ul className="space-y-2">
              {mine.map((c) => (
                <li key={c.id} className="bg-white rounded-xl border border-[var(--color-border)] p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">#{c.id}</span>
                    {c.complaint_type_icon && <span className="text-[12px]">{c.complaint_type_icon}</span>}
                    {c.complaint_type_name && <span className="text-[10px] text-[var(--color-text-muted)]">{c.complaint_type_name}</span>}
                    <SeverityBadge severity={c.severity} />
                    <StatusBadge status={c.status} />
                    {c.confidential && <Lock className="w-3 h-3 text-[var(--color-text-muted)]" />}
                    <span className="text-[10px] text-[var(--color-text-muted)]">{relativeTime(c.created_at)}</span>
                  </div>
                  <h3 className="text-[13px] font-semibold text-navy leading-snug">{c.title}</h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug line-clamp-2 mt-0.5">{c.description}</p>
                  {c.resolution_label && (
                    <div className="text-[10px] text-emerald-700 mt-2 inline-flex items-center gap-1">
                      <span className="font-semibold">Resolved:</span> {c.resolution_label}{c.resolution_notes ? ` — ${c.resolution_notes}` : ''}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
