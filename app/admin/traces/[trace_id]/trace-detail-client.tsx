'use client';

/**
 * v1.7 Sprint B — per-trace drill-down.
 *
 * Layout:
 *   Header: question, user, timing, status, download buttons
 *   Tabs:   Timeline · Sources · Draft↔Revised diff · Critique · Tokens
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { diff_match_patch } from 'diff-match-patch';

type Trace = {
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
  final_answer_text: string | null;
  input: { question?: string } | null;
  meta: unknown;
  error_message: string | null;
};

type Event = {
  seq: number;
  kind: string;
  stage: string | null;
  payload: Record<string, unknown> | null;
  latency_ms: number | null;
  created_at: string;
};

function fmtMs(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

type Tab = 'timeline' | 'sources' | 'diff' | 'critique' | 'tokens' | 'raw';

export function TraceDetailClient({ traceId, adminToken, basePath }: { traceId: string; adminToken: string; basePath: string }) {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('timeline');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/admin/traces/${traceId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        setTrace(j.trace); setEvents(j.events || []);
      } catch (e) { setError(String((e as Error).message)); }
      finally { setLoading(false); }
    })();
  }, [traceId, adminToken]);

  if (loading) return <div className="text-sm text-slate-500">Loading trace…</div>;
  if (error) return <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>;
  if (!trace) return <div className="text-sm text-slate-500">Trace not found</div>;

  const question = trace.input?.question || trace.question_preview || '(no question captured)';
  const sourcesEvent = events.find((e) => e.kind === 'retrieval_hydrated');
  const critiqueEvent = events.find((e) => e.kind === 'critique_parsed');
  const finalEvent = events.find((e) => e.kind === 'final_answer');
  const draftEvent = events.find((e) => e.kind === 'llm_response_stream_complete' && e.stage === 'draft');
  const reviseEvent = events.find((e) => e.kind === 'llm_response_stream_complete' && e.stage === 'revision');
  const draftText = (draftEvent?.payload as { content?: string })?.content || '';
  const reviseText = (reviseEvent?.payload as { content?: string })?.content || '';
  const tokenEvents = events.filter((e) => e.kind === 'stream_event');

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <Link href={`/${basePath}/traces`} className="text-xs text-brand hover:underline">← All traces</Link>
        <div className="mt-2 flex items-start gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{question}</h2>
            <div className="mt-1 text-xs text-slate-500">
              User #{trace.user_id} · {new Date(trace.started_at).toLocaleString('en-IN')} ·
              <span className="ml-1 font-medium">{fmtMs(trace.total_ms)}</span> ·
              <span className={`ml-1 ${trace.status === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>{trace.status}</span>
              {trace.severity && <span className="ml-2 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-700">{trace.severity}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`/api/admin/traces/${traceId}/json?token=${encodeURIComponent(adminToken)}`}
               className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand">
              { } JSON
            </a>
            <a href={`/api/admin/traces/${traceId}/md?token=${encodeURIComponent(adminToken)}`}
               className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand">
              📄 Markdown
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-slate-200 text-sm">
        {(['timeline', 'sources', 'diff', 'critique', 'tokens', 'raw'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-3 py-1.5 capitalize ${tab === t ? 'border-brand text-brand font-medium' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t === 'diff' ? 'Draft↔Revised' : t}
            {t === 'tokens' && tokenEvents.length > 0 && <span className="ml-1 text-[10px] text-slate-400">{tokenEvents.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'timeline' && <TimelineTab events={events} />}
      {tab === 'sources' && <SourcesTab event={sourcesEvent} />}
      {tab === 'diff' && <DiffTab draft={draftText} revised={reviseText} finalAnswer={finalEvent?.payload as { answer?: string } | null} />}
      {tab === 'critique' && <CritiqueTab event={critiqueEvent} />}
      {tab === 'tokens' && <TokensTab events={tokenEvents} />}
      {tab === 'raw' && <RawTab trace={trace} events={events} />}
    </div>
  );
}

function TimelineTab({ events }: { events: Event[] }) {
  return (
    <div className="space-y-1">
      {events.map((e) => (
        <details key={e.seq} className="rounded border border-slate-200 bg-white text-xs">
          <summary className="cursor-pointer px-3 py-2 hover:bg-slate-50">
            <span className="font-mono text-slate-400">#{e.seq}</span>{' '}
            <span className="font-medium text-slate-800">{e.kind}</span>
            {e.stage && <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">{e.stage}</span>}
            {e.latency_ms != null && <span className="ml-2 text-slate-500">{fmtMs(e.latency_ms)}</span>}
            <span className="ml-2 text-slate-400">{new Date(e.created_at).toLocaleTimeString()}</span>
          </summary>
          <pre className="overflow-x-auto bg-slate-50 px-3 py-2 text-[11px] text-slate-700">{JSON.stringify(e.payload, null, 2)}</pre>
        </details>
      ))}
    </div>
  );
}

function SourcesTab({ event }: { event?: Event }) {
  if (!event) return <div className="text-sm text-slate-500">No retrieval_hydrated event captured.</div>;
  const p = event.payload as { variants?: string[]; hits?: Array<{ id: number; book: string; chapter: string; page_start: number; similarity: number; source_quality_weight?: number; rerank_score?: number; rerank_backend?: string; text: string }> };
  return (
    <div>
      <div className="mb-3 rounded border border-slate-200 bg-slate-50 p-3 text-xs">
        <div className="font-medium text-slate-700">Query variants ({p.variants?.length || 0})</div>
        <ul className="mt-1 list-disc pl-4 text-slate-600">{p.variants?.map((v, i) => <li key={i}>{v}</li>)}</ul>
      </div>
      <div className="space-y-2">
        {(p.hits || []).map((h, i) => (
          <details key={i} className="rounded border border-slate-200 bg-white text-xs">
            <summary className="cursor-pointer px-3 py-2 hover:bg-slate-50">
              <span className="font-mono text-slate-400">[{i + 1}]</span>{' '}
              <span className="font-medium">{h.book}{h.chapter ? ' · ' + h.chapter : ''}{h.page_start ? ' · p.' + h.page_start : ''}</span>
              <span className="ml-2 text-slate-500">sim {h.similarity?.toFixed?.(2)}</span>
              {h.source_quality_weight != null && <span className="ml-2 text-rose-600">w {Number(h.source_quality_weight).toFixed(2)}</span>}
              {h.rerank_score != null && <span className="ml-2 text-cyan-700">rr {Number(h.rerank_score).toFixed(2)}</span>}
            </summary>
            <div className="whitespace-pre-wrap bg-slate-50 px-3 py-2 text-[11px] text-slate-700">{h.text}</div>
          </details>
        ))}
      </div>
    </div>
  );
}

function DiffTab({ draft, revised, finalAnswer }: { draft: string; revised: string; finalAnswer: { answer?: string } | null }) {
  if (!draft && !revised) {
    return (
      <div>
        <div className="mb-2 text-sm text-slate-500">Draft passed audit clean — no revision was run. Final answer:</div>
        <pre className="whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-xs text-slate-800">{finalAnswer?.answer || '(none)'}</pre>
      </div>
    );
  }
  if (!revised) {
    return <div className="text-sm text-slate-500">Only draft available (no revision fired).</div>;
  }
  // diff-match-patch word-level
  const dmp = new diff_match_patch();
  const a = dmp.diff_linesToChars_(draft, revised);
  const diffs = dmp.diff_main(a.chars1, a.chars2, false);
  dmp.diff_charsToLines_(diffs, a.lineArray);
  dmp.diff_cleanupSemantic(diffs);

  const leftHtml: string[] = [], rightHtml: string[] = [];
  for (const [op, text] of diffs) {
    const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (op === 0) { leftHtml.push(esc); rightHtml.push(esc); }
    else if (op === -1) leftHtml.push(`<span class="bg-rose-100 text-rose-800 line-through">${esc}</span>`);
    else if (op === 1) rightHtml.push(`<span class="bg-emerald-100 text-emerald-800">${esc}</span>`);
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <div className="mb-1 text-xs font-medium text-slate-600">Draft (qwen2.5:14b)</div>
        <div className="rounded border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap"
             dangerouslySetInnerHTML={{ __html: leftHtml.join('') }} />
      </div>
      <div>
        <div className="mb-1 text-xs font-medium text-slate-600">Revised (qwen2.5:7b)</div>
        <div className="rounded border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap"
             dangerouslySetInnerHTML={{ __html: rightHtml.join('') }} />
      </div>
    </div>
  );
}

function CritiqueTab({ event }: { event?: Event }) {
  if (!event) return <div className="text-sm text-slate-500">No critique was run.</div>;
  return (
    <pre className="overflow-x-auto rounded border border-slate-200 bg-white p-3 text-xs text-slate-800">
      {JSON.stringify(event.payload, null, 2)}
    </pre>
  );
}

function TokensTab({ events }: { events: Event[] }) {
  if (events.length === 0) return <div className="text-sm text-slate-500">No token-level events (TRACE_TOKENS=false?)</div>;
  // group by stage
  const byStage: Record<string, Event[]> = {};
  for (const e of events) {
    const s = e.stage || 'unknown';
    (byStage[s] ||= []).push(e);
  }
  return (
    <div className="space-y-3">
      {Object.entries(byStage).map(([stage, evs]) => (
        <div key={stage}>
          <div className="mb-1 text-xs font-medium text-slate-700">{stage} · {evs.length} tokens</div>
          <pre className="whitespace-pre-wrap rounded border border-slate-200 bg-white p-2 text-[11px] text-slate-800">
            {evs.map((e) => (e.payload as { content?: string })?.content || '').join('')}
          </pre>
        </div>
      ))}
    </div>
  );
}

function RawTab({ trace, events }: { trace: Trace; events: Event[] }) {
  return (
    <pre className="overflow-x-auto rounded border border-slate-200 bg-white p-3 text-[10px] text-slate-700">
      {JSON.stringify({ trace, events }, null, 2)}
    </pre>
  );
}
