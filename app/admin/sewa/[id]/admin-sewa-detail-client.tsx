'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, X, AlertOctagon, Lock, FileText, Image as ImageIcon, Send, UserPlus, ChevronDown, Tag as TagIcon } from 'lucide-react';
import { SeverityBadge } from '@/components/sewa/SeverityBadge';
import { StatusBadge } from '@/components/sewa/StatusBadge';
import { relativeTime, absoluteTime } from '@/lib/portal/time';

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
  complaint_type_id: number | null;
  complaint_type_name: string | null;
  complaint_type_icon: string | null;
  custom_fields: Record<string, unknown> | null;
  attachment_url: string | null;
  resolution_id: number | null;
  resolution_label: string | null;
  resolution_is_other: boolean | null;
  resolution_notes: string | null;
  tags: string[];
  soft_deleted_at: string | null;
};

type EventRow = {
  id: number | string;
  event_type: 'created' | 'ack' | 'assign' | 'severity_change' | 'status_change' | 'note' | 'resolve';
  actor: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

type Resolution = { id: number | string; slug: string; label: string; icon: string | null; requires_note: boolean };

// SUGGESTED_TAGS now fetched at runtime from /api/admin/sewa/suggested-tags

export function AdminSewaDetailClient({ adminToken, complaintId }: { adminToken: string; complaintId: number }) {
  const auth = `Bearer ${adminToken}`;
  const [c, setC] = useState<Complaint | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action UI
  const [noteText, setNoteText] = useState('');
  const [postingNote, setPostingNote] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignee, setAssignee] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveResId, setResolveResId] = useState<number | 'other' | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>(['patient-impact', 'sla-breach', 'escalate-mgr', 'repeat', 'confidential']);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/sewa/complaints/${complaintId}`, { headers: { authorization: auth }, cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'load failed');
      setC(j.complaint as Complaint);
      setEvents(j.events as EventRow[]);
      // Fetch resolutions for this complaint's type
      if (j.complaint?.complaint_type_id) {
        const rr = await fetch(`/api/admin/sewa/complaint-types/${j.complaint.complaint_type_id}/resolutions`, { headers: { authorization: auth }, cache: 'no-store' });
        const rj = await rr.json();
        if (rr.ok) setResolutions(rj.resolutions || []);
      }
      setError(null);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [complaintId]);
  useEffect(() => {
    fetch('/api/admin/sewa/suggested-tags', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (Array.isArray(j.tags)) setSuggestedTags(j.tags); }).catch(() => {});
  }, []);

  async function action(body: Record<string, unknown>) {
    const r = await fetch(`/api/admin/sewa/complaints/${complaintId}/action`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', authorization: auth },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'action failed');
    await refresh();
  }

  async function postNote() {
    if (!noteText.trim()) return;
    setPostingNote(true); setError(null);
    try { await action({ action: 'note', note: noteText.trim() }); setNoteText(''); }
    catch (e) { setError((e as Error).message); }
    finally { setPostingNote(false); }
  }
  async function doAssign() {
    if (!assignee.trim()) return;
    setAssigning(true); setError(null);
    try { await action({ action: 'assign', assigned_to: assignee.trim() }); setAssignee(''); }
    catch (e) { setError((e as Error).message); }
    finally { setAssigning(false); }
  }
  async function doAck() { try { await action({ action: 'ack' }); } catch (e) { setError((e as Error).message); } }
  async function changeStatus(s: string) { try { await action({ action: 'status_change', status: s }); } catch (e) { setError((e as Error).message); } }
  async function changeSeverity(s: string) { try { await action({ action: 'severity_change', severity: s }); } catch (e) { setError((e as Error).message); } }
  async function addTag(t: string) {
    if (!t.trim()) return;
    try { await action({ action: 'add_tag', tag: t.trim() }); setTagInput(''); } catch (e) { setError((e as Error).message); }
  }
  async function removeTag(t: string) { try { await action({ action: 'remove_tag', tag: t }); } catch (e) { setError((e as Error).message); } }

  async function doResolve() {
    if (!resolveResId) { setError('Pick a resolution or "Other"'); return; }
    const isOther = resolveResId === 'other';
    const r = isOther ? null : resolutions.find((rr) => Number(rr.id) === resolveResId);
    if (!isOther && !r) { setError('resolution_not_found'); return; }
    const requiresNote = isOther || (r?.requires_note ?? false);
    if (requiresNote && !resolveNotes.trim()) { setError('This resolution requires a note.'); return; }
    setResolving(true); setError(null);
    try {
      await action({
        action: 'resolve',
        resolution_id: isOther ? null : Number(resolveResId),
        resolution_is_other: isOther,
        resolution_notes: resolveNotes.trim(),
      });
      setResolveOpen(false); setResolveResId(null); setResolveNotes('');
    } catch (e) { setError((e as Error).message); }
    finally { setResolving(false); }
  }

  if (loading) return <div className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
  if (error && !c) return <div className="bg-pink-light text-pink-dark text-[12px] p-3 rounded">{error}</div>;
  if (!c) return null;

  const isResolved = c.status === 'resolved';

  return (
    <div className="space-y-4">
      <Link href="/admin/sewa" className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-brand"><ArrowLeft className="w-3.5 h-3.5" /> Back to all complaints</Link>

      {error && <div className="bg-pink-light border border-pink/40 text-pink-dark text-[12px] px-3 py-2 rounded-lg">{error}</div>}

      <article className="bg-white rounded-xl border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px] text-[var(--color-text-muted)] font-mono">#{c.id}</span>
          {c.complaint_type_icon && <span className="text-[14px]">{c.complaint_type_icon}</span>}
          {c.complaint_type_name && <span className="text-[11px] text-[var(--color-text-muted)]">{c.complaint_type_name}</span>}
          <SeverityBadge severity={c.severity} />
          <StatusBadge status={c.status} />
          {c.confidential && <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]"><Lock className="w-3 h-3" /> Confidential</span>}
          {c.severity === 'critical' && !isResolved && <AlertOctagon className="w-3.5 h-3.5 text-pink" />}
        </div>
        <h1 className="text-[18px] font-semibold text-navy leading-tight mb-2">{c.title}</h1>
        <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap mb-3">{c.description}</p>

        {c.custom_fields && Object.keys(c.custom_fields).length > 0 && (
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 mb-3">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Custom fields</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              {Object.entries(c.custom_fields).map(([k, v]) => (
                <div key={k} className="flex gap-1">
                  <dt className="text-[var(--color-text-muted)]">{k}:</dt>
                  <dd className="text-navy font-medium">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {c.attachment_url && (
          <a href={c.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-brand hover:text-brand-dark mb-3">
            {/\.pdf$/i.test(c.attachment_url) ? <FileText className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />} Attachment →
          </a>
        )}

        {c.tags.length > 0 && (
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {c.tags.map((t) => (
              <button key={t} onClick={() => removeTag(t)} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-navy/10 text-navy inline-flex items-center gap-1 hover:bg-pink-light hover:text-pink-dark group">
                {t} <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        )}

        <div className="text-[10px] text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
          Raised by <span className="text-navy font-medium">{c.raised_by_display_name}</span> · {absoluteTime(c.created_at)} · SLA due {relativeTime(c.sla_due_at)}
          {c.assigned_to && <> · assigned: <span className="text-navy font-medium">{c.assigned_to}</span></>}
          {isResolved && c.resolution_label && (
            <span className="block mt-1 text-emerald-700">
              ✓ Resolved {c.resolved_at && relativeTime(c.resolved_at)}: <span className="font-semibold">{c.resolution_label}</span>{c.resolution_notes ? ` — ${c.resolution_notes}` : ''}
            </span>
          )}
        </div>
      </article>

      {/* Actions */}
      {!isResolved && (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Actions</div>
          <div className="flex items-center gap-2 flex-wrap">
            {c.status === 'open' && (
              <button onClick={doAck} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark"><Check className="w-3.5 h-3.5" /> Acknowledge</button>
            )}
            {c.status !== 'in_progress' && (
              <button onClick={() => changeStatus('in_progress')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-navy text-[12px] hover:border-brand hover:text-brand">Mark in-progress</button>
            )}
            <button onClick={() => changeStatus('wont_fix')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[12px] hover:border-pink hover:text-pink-dark">Won&apos;t fix</button>
            <button onClick={() => setResolveOpen(true)} className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700"><Check className="w-3.5 h-3.5" /> Resolve</button>
          </div>

          {/* Quick severity */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Severity:</span>
            {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
              <button key={s} onClick={() => changeSeverity(s)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  c.severity === s ? 'bg-brand text-white border-brand' : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-brand'
                }`}>{s}</button>
            ))}
          </div>

          {/* Assign */}
          <div className="flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Assign to (name)" className="flex-1 px-2 py-1 text-[11px] border border-[var(--color-border)] rounded" />
            <button onClick={doAssign} disabled={assigning || !assignee.trim()} className="text-[10px] px-2 py-1 rounded bg-brand text-white disabled:bg-[var(--color-text-muted)]">{assigning ? '…' : 'Assign'}</button>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2">
            <TagIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }} placeholder="Add tag" maxLength={60} className="flex-1 px-2 py-1 text-[11px] border border-[var(--color-border)] rounded" />
            <button onClick={() => addTag(tagInput)} className="text-[10px] px-2 py-1 rounded border border-[var(--color-border)] hover:border-brand">Add</button>
            <div className="flex items-center gap-1 flex-wrap">
              {suggestedTags.filter((t) => !c.tags.includes(t)).map((t) => (
                <button key={t} onClick={() => addTag(t)} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-brand-faint hover:text-brand">+{t}</button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} placeholder="Internal admin note (appears in event log)" className="w-full px-2 py-1.5 text-[11px] bg-white border border-[var(--color-border)] rounded resize-none" maxLength={2000} />
            <div className="flex justify-end mt-1">
              <button onClick={postNote} disabled={postingNote || !noteText.trim()} className="text-[10px] px-2 py-1 rounded bg-brand text-white hover:bg-brand-dark disabled:bg-[var(--color-text-muted)] inline-flex items-center gap-1">
                <Send className="w-3 h-3" /> {postingNote ? 'Posting…' : 'Post note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event log */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Event log</div>
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="text-[11px] border-l-2 border-brand-faint pl-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-navy capitalize">{e.event_type.replace('_', ' ')}</span>
                <span className="text-[var(--color-text-muted)]">by {e.actor || 'unknown'}</span>
                <span className="text-[var(--color-text-muted)]" title={absoluteTime(e.created_at)}>· {relativeTime(e.created_at)}</span>
              </div>
              {e.meta && Object.keys(e.meta).length > 0 && (
                <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                  {Object.entries(e.meta).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Resolve modal */}
      {resolveOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setResolveOpen(false)}>
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-emerald-700" />
              <h2 className="text-[14px] font-semibold text-navy flex-1">Resolve complaint #{c.id}</h2>
              <button onClick={() => setResolveOpen(false)}><X className="w-4 h-4 text-[var(--color-text-muted)] hover:text-navy" /></button>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mb-3">
              Pick the resolution that fits this complaint. Note becomes mandatory when the chosen option flags <code className="bg-[var(--color-bg)] px-1 rounded text-[10px]">requires_note</code>.
            </p>
            <div className="space-y-1.5 mb-3">
              {resolutions.map((r) => (
                <label key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded border border-[var(--color-border)] hover:border-brand cursor-pointer text-[12px]">
                  <input type="radio" name="res" checked={resolveResId === Number(r.id)} onChange={() => setResolveResId(Number(r.id))} />
                  <span className="text-[14px]">{r.icon || '✅'}</span>
                  <span className="flex-1 text-navy">{r.label}</span>
                  {r.requires_note && <span className="text-[9px] text-pink-dark">note required</span>}
                </label>
              ))}
              <label className="flex items-center gap-2 px-2 py-1.5 rounded border border-dashed border-[var(--color-border)] hover:border-brand cursor-pointer text-[12px]">
                <input type="radio" name="res" checked={resolveResId === 'other'} onChange={() => setResolveResId('other')} />
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="flex-1 text-navy">Other (describe)</span>
                <span className="text-[9px] text-pink-dark">note required</span>
              </label>
            </div>
            <textarea value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="Notes" rows={3} maxLength={2000} className="w-full px-2 py-1.5 text-[12px] bg-white border border-[var(--color-border)] rounded resize-none mb-3" />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setResolveOpen(false)} className="text-[11px] px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)]">Cancel</button>
              <button onClick={doResolve} disabled={resolving} className="text-[11px] px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-[var(--color-text-muted)] inline-flex items-center gap-1">
                {resolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
