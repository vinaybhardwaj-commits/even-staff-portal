/**
 * v1.7 Sprint C — Markdown forensic report.
 * Server-rendered template per PRD §5.4 — every prompt + every response
 * verbatim, all retrieved chunks with text + scores, critique JSON
 * pretty-printed, draft + revised side-by-side, all stage timings.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

type Event = {
  seq: number;
  kind: string;
  stage: string | null;
  payload: Record<string, unknown> | null;
  latency_ms: number | null;
  created_at: string;
};

function fmtMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fence(content: string, lang = ''): string {
  return `\`\`\`${lang}\n${content}\n\`\`\``;
}

function renderMessages(msgs: unknown): string {
  if (!Array.isArray(msgs)) return '_(no messages)_';
  return msgs.map((m) => {
    const mm = m as { role?: string; content?: string };
    return `**${mm.role || 'unknown'}:**\n${mm.content || ''}\n`;
  }).join('\n');
}

function buildReport(trace: Record<string, unknown>, events: Event[]): string {
  const t = trace as { trace_id: string; user_id: number; feature: string; status: string; severity: string | null; question_preview: string | null; started_at: string; finished_at: string | null; total_ms: number | null; model_summary: Record<string, string> | null; final_answer_text: string | null; input: { question?: string } | null };
  const out: string[] = [];

  out.push(`# Trace forensic report`);
  out.push(`**Question:** ${t.input?.question || t.question_preview || '(none captured)'}`);
  out.push(`**Trace ID:** \`${t.trace_id}\``);
  out.push(`**User:** #${t.user_id}`);
  out.push(`**Started:** ${t.started_at}`);
  out.push(`**Finished:** ${t.finished_at || '(running or partial)'}`);
  out.push(`**Total:** ${fmtMs(t.total_ms)}`);
  out.push(`**Status:** ${t.status}${t.severity ? ` · severity ${t.severity}` : ''}`);
  if (t.model_summary) {
    out.push(`**Models used:** ${Object.entries(t.model_summary).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  }
  out.push('');

  // Stage-by-stage narrative
  const stageEvents: Record<string, Event[]> = {};
  for (const e of events) {
    const s = e.stage || e.kind;
    (stageEvents[s] ||= []).push(e);
  }

  // 1. Request
  const reqEv = events.find((e) => e.kind === 'request_received');
  if (reqEv) {
    out.push(`## 1 — Request received`);
    out.push(fence(JSON.stringify(reqEv.payload, null, 2), 'json'));
    out.push('');
  }

  // 2. Variants
  const variantsEv = events.find((e) => e.kind === 'llm_response_stream_complete' && e.stage === null) ||
                     events.find((e) => e.kind === 'llm_request' && (e.payload as { model?: string })?.model === 'llama3.1:8b');
  const variantsLogEv = events.find((e) => (e.payload as { variants?: string[] })?.variants);
  if (variantsLogEv) {
    out.push(`## 2 — Query expansion (multi-query)`);
    const p = variantsLogEv.payload as { variants?: string[]; per_variant_counts?: number[] };
    out.push(`**Variants generated:** ${p.variants?.length || 0}`);
    (p.variants || []).forEach((v, i) => out.push(`  ${i + 1}. ${v}`));
    out.push('');
  }

  // 3. Retrieval — full chunk text
  const retEv = events.find((e) => e.kind === 'retrieval_hydrated');
  if (retEv) {
    out.push(`## 3 — Hybrid retrieval (vector + BM25 RRF)`);
    const p = retEv.payload as { hits?: Array<{ id: number; book: string; chapter: string; page_start: number; similarity: number; source_quality_weight?: number; rerank_score?: number; text: string }> };
    out.push(`**Chunks retrieved:** ${p.hits?.length || 0}`);
    out.push('');
    (p.hits || []).forEach((h, i) => {
      out.push(`### [${i + 1}] ${h.book}${h.chapter ? ' · ' + h.chapter : ''}${h.page_start ? ' · p.' + h.page_start : ''}`);
      out.push(`sim ${h.similarity?.toFixed?.(3) ?? '—'} · weight ${h.source_quality_weight ?? '—'} · rerank ${h.rerank_score ?? '—'}`);
      out.push('');
      out.push('> ' + (h.text || '').replace(/\n/g, '\n> '));
      out.push('');
    });
  }

  // 4. PLOS
  const plosEv = events.find((e) => e.kind === 'plos_search');
  if (plosEv) {
    out.push(`## 4 — PLOS ONE primary research`);
    const p = plosEv.payload as { hits?: Array<{ doi: string; title: string; year: number; abstract: string }> };
    out.push(`**PLOS hits:** ${p.hits?.length || 0}`);
    (p.hits || []).forEach((h, i) => {
      out.push(`### [P${i + 1}] ${h.title} (${h.year})`);
      out.push(`DOI: ${h.doi}`);
      out.push('');
      out.push('> ' + (h.abstract || '').replace(/\n/g, '\n> '));
      out.push('');
    });
  }

  // 5. Draft prompt + response
  const draftReq = events.find((e) => e.kind === 'llm_request' && e.stage === 'draft');
  const draftRes = events.find((e) => e.kind === 'llm_response_stream_complete' && e.stage === 'draft');
  if (draftReq || draftRes) {
    out.push(`## 5 — Draft (${(draftReq?.payload as { model?: string })?.model || 'unknown'})`);
    if (draftReq) {
      out.push(`### Prompt sent`);
      out.push(renderMessages((draftReq.payload as { messages?: unknown }).messages));
    }
    if (draftRes) {
      out.push(`### Response (${fmtMs(draftRes.latency_ms)})`);
      out.push(fence(((draftRes.payload as { content?: string }).content || '').trim(), 'markdown'));
    }
    out.push('');
  }

  // 6. Critique
  const critiqueEv = events.find((e) => e.kind === 'critique_parsed');
  if (critiqueEv) {
    out.push(`## 6 — Self-critique audit (${(critiqueEv.payload as { critique?: { overall_severity?: string } }).critique?.overall_severity || 'unknown'})`);
    out.push(fence(JSON.stringify((critiqueEv.payload as { critique?: unknown }).critique, null, 2), 'json'));
    out.push('');
  }

  // 7. Revision
  const revReq = events.find((e) => e.kind === 'llm_request' && e.stage === 'revision');
  const revRes = events.find((e) => e.kind === 'llm_response_stream_complete' && e.stage === 'revision');
  if (revReq || revRes) {
    out.push(`## 7 — Revision (${(revReq?.payload as { model?: string })?.model || 'unknown'})`);
    if (revRes) {
      out.push(`### Revised answer (${fmtMs(revRes.latency_ms)})`);
      out.push(fence(((revRes.payload as { content?: string }).content || '').trim(), 'markdown'));
    }
    out.push('');
  }

  // 8. Final
  const finalEv = events.find((e) => e.kind === 'final_answer');
  if (finalEv) {
    out.push(`## 8 — Final answer delivered to user`);
    out.push(fence(((finalEv.payload as { answer?: string }).answer || '').trim(), 'markdown'));
    out.push('');
  }

  out.push(`---`);
  out.push(`Generated ${new Date().toISOString()} by Even Staff Portal v1.7 forensic export.`);
  return out.join('\n');
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ trace_id: string }> }) {
  const { trace_id } = await params;
  if (!trace_id || trace_id.length < 8) return NextResponse.json({ error: 'bad_trace_id' }, { status: 400 });

  const auth = req.headers.get('authorization') || '';
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get('token') || '';
  const isAdmin = !!process.env.ADMIN_TOKEN && (auth === `Bearer ${process.env.ADMIN_TOKEN}` || tokenParam === process.env.ADMIN_TOKEN);
  if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const traceRows = await sql`
    SELECT trace_id, user_id, feature, status, severity, question_preview,
           started_at::text AS started_at, finished_at::text AS finished_at,
           total_ms, model_summary, final_answer_text, input, meta, error_message
    FROM traces WHERE trace_id = ${trace_id}
  ` as Record<string, unknown>[];
  if (!traceRows[0]) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const events = await sql`
    SELECT seq, kind, stage, payload, latency_ms, created_at::text AS created_at
    FROM trace_events WHERE trace_id = ${trace_id} ORDER BY seq ASC
  ` as Event[];

  const md = buildReport(traceRows[0], events);
  return new NextResponse(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="trace-${trace_id}.md"`,
    },
  });
}
