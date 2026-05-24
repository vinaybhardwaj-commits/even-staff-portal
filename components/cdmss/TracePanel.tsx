'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, ChevronDown, ChevronUp, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { formatDuration } from '@/lib/cdmss/format-duration';
import { STAGE_EXPLAINERS } from '@/lib/cdmss/stage-explainers';
import { sanitizeModelNames } from '@/lib/cdmss/model-labels';

type StageMedians = {
  variants: number; retrieving: number; reranking: number;
  drafting: number; reviewing: number; revising: number;
  total_p50: number; total_p90: number;
};
const STAGE_WEIGHTS_FALLBACK: StageMedians = {
  variants: 10_000, retrieving: 40_000, reranking: 5_000,
  drafting: 50_000, reviewing: 30_000, revising: 50_000,
  total_p50: 185_000, total_p90: 280_000,
};

export type TraceEvent = {
  stage: string;
  msg: string;
  ms?: number;
  done: boolean;
  error?: boolean;
  ts: number;
};

const STAGE_LABEL: Record<string, string> = {
  expanding: 'Query expansion',
  variants: 'Variants generated',
  retrieving: 'Hybrid retrieval',
  reranking: 'Reranking',
  fusing: 'Source-quality fusion',
  generating: 'Generating answer',
  drafting: 'Drafting answer',
  reviewing: 'Auditing draft',
  revising: 'Revising draft',
  finalizing: 'Finalizing',
  parsing: 'Parsing response',
  persisting: 'Saving trace',
  done: 'Done',
};

export default function TracePanel({ events, totalMs, traceId }: { events: TraceEvent[]; totalMs?: number; traceId?: string | null }) {
  // ALL HOOKS FIRST — no early returns above this line
  const [open, setOpen] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [medians, setMedians] = useState<StageMedians>(STAGE_WEIGHTS_FALLBACK);
  const [t0] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ask/stage-medians').then((r) => r.json()).then((j) => {
      if (!cancelled && j && typeof j.total_p50 === 'number') setMedians(j);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  function copyTraceId() {
    if (!traceId) return;
    navigator.clipboard?.writeText(traceId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  const last = events.length > 0 ? events[events.length - 1] : null;
  const isComplete = events.some((e) => e.stage === 'done') || !!totalMs;
  const hasError = events.some((e) => e.error);

  useEffect(() => {
    if (isComplete || hasError || events.length === 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);  // 1Hz so progress bar feels live
    return () => clearInterval(t);
  }, [isComplete, hasError, events.length]);

  // Now safe to early-return
  if (events.length === 0 || !last) return null;
  const stalled = !isComplete && !hasError && (now - last.ts) > 45_000;

  return (
    <div className={`mb-3 rounded-lg border text-xs ${hasError ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        {hasError ? <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
          : isComplete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          : <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />}
        <span className="flex-1 font-medium text-slate-700">
          {isComplete ? `Pipeline complete · ${formatDuration(totalMs)}` : (STAGE_LABEL[last.stage] || last.stage)}
        </span>
        <span className="text-slate-400">{events.length} step{events.length !== 1 ? 's' : ''}</span>
        {open ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
      </button>
      {open && !isComplete && !hasError && (() => {
        const elapsed = now - t0;
        const eta = Math.max(0, medians.total_p50 - elapsed);
        const overdue = elapsed > medians.total_p90;
        const pct = Math.min(95, Math.max(2, (elapsed / medians.total_p50) * 100));
        const explainer = STAGE_EXPLAINERS[last.stage];
        return (
          <div className="border-t border-slate-200 bg-white/40 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>{formatDuration(elapsed)} elapsed</span>
              {overdue
                ? <span className="text-amber-700">Longer than usual — Mac Mini may be busy</span>
                : <span>~{formatDuration(eta)} remaining</span>}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200">
              <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            {explainer && (
              <div className="mt-2 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px]">
                <div className="font-medium text-slate-700">{explainer.title}</div>
                {explainer.body && <div className="mt-0.5 text-slate-600 leading-snug">{explainer.body}</div>}
              </div>
            )}
          </div>
        );
      })()}
      {open && stalled && (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          ⚠ No progress for {Math.round((now - last.ts) / 1000)}s. Mac Mini Ollama may be queuing — this can take up to 90s per stage. The Vercel function will time out at 300s total.
        </div>
      )}
      {open && traceId && (
        <div className="flex items-center gap-2 border-t border-slate-200 bg-white/60 px-3 py-1.5 text-[11px] text-slate-500">
          <span className="font-mono uppercase tracking-wide text-slate-400">trace</span>
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-700">{traceId.slice(0, 8)}…</code>
          <a
            href={`/ask/trace/${traceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 rounded border border-brand bg-brand-faint px-2 py-0.5 text-[10.5px] font-medium text-brand hover:bg-brand hover:text-white"
            aria-label="View full trace"
            title="Open the full forensic trace for this query in a new tab"
          >
            View trace
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={copyTraceId}
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10.5px] text-slate-500 hover:border-brand hover:text-brand"
            aria-label="Copy trace ID"
            title="Copy full trace ID"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      )}
      {open && (
        <ol className="space-y-1 border-t border-slate-200 px-3 py-2">
          {events.map((e, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-3 w-3 shrink-0 items-center justify-center">
                {e.error ? <AlertTriangle className="h-3 w-3 text-rose-600" />
                  : e.done ? <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  : <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
              </span>
              <span className="flex-1">
                <span className="font-medium text-slate-700">{STAGE_LABEL[e.stage] || e.stage}</span>
                {e.msg && <span className="text-slate-500"> — {sanitizeModelNames(e.msg)}</span>}
              </span>
              {e.ms !== undefined && <span className="shrink-0 text-slate-400">{formatDuration(e.ms)}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
