import { NextRequest } from 'next/server';
import { retrieve } from '@/lib/cdmss/retrieve';
import { searchPlos, formatPlosForPrompt, type PlosHit } from '@/lib/cdmss/plos';
import { TEXT_MODEL } from '@/lib/cdmss/llm';
import { makeNdjsonStream, ndjsonHeaders } from '@/lib/cdmss/stream';
import { startTrace, finishTrace, tracedChat, logStreamComplete } from '@/lib/cdmss/trace';

export const runtime = 'nodejs';
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are Even CDMSS, a medical study companion for residents and physicians.
You answer questions using ONLY the excerpts provided below — they come from two source families:
  - MKSAP / StatPearls / UpToDate excerpts (cite as [1], [2], …)
  - PLOS ONE primary research abstracts (cite as [P1], [P2], …)

Rules:
- Be concise, precise, and clinically useful — the audience is a working physician.
- Cite the source for every clinical claim using bracketed numbers like [1], [2] that map to the excerpts.
- If the excerpts do not cover the question, say so plainly. Do not invent.
- If an excerpt looks garbled or nonsensical, ignore it rather than quoting it.
- Match the voice of MKSAP: structured, evidence-based, practical.
- Prefer textbook excerpts for established clinical guidance; prefer PLOS for recent primary evidence and emerging biomarkers.`;

export async function POST(req: NextRequest) {
  let body: { question?: string; bookFilter?: string; includePlos?: boolean };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }
  const question = (body.question || '').trim();
  if (!question) {
    return new Response(JSON.stringify({ error: 'question is required' }), { status: 400 });
  }

  const { stream, emit, close } = makeNdjsonStream();
  const t0 = Date.now();
  const traceId = await startTrace('ask', { question, bookFilter: body.bookFilter });

  (async () => {
    let outcome: 'success' | 'error' | 'partial' = 'success';
    let outcomeMsg: string | undefined;
    try {
      emit({ type: 'progress', stage: 'expanding', msg: 'Rewriting query for semantic search…' });
      // Fire MKSAP retrieval and PLOS in PARALLEL — PLOS adds ~500-2000ms of network
      // latency that we'd otherwise stack onto the critical path. Promise.all means
      // total wait = max(retrieve, plos) instead of retrieve + plos.
      const includePlos = body.includePlos !== false;  // default true
      const [result, plosHits] = await Promise.all([
        retrieve(question, { bookFilter: body.bookFilter, topK: 8 }),
        includePlos ? searchPlos(question, { rows: 5, yearsBack: 5 }) : Promise.resolve([] as PlosHit[]),
      ]);
      const hits = result.hits;
      emit({ type: 'progress', stage: 'retrieving', msg: `Retrieved ${hits.length} MKSAP/StatPearls + ${plosHits.length} PLOS ONE excerpts`, ms: Date.now() - t0 });

      if (hits.length === 0 && plosHits.length === 0) {
        emit({ type: 'error', message: 'no relevant excerpts above similarity threshold' });
        outcome = 'error'; outcomeMsg = 'no relevant excerpts';
        close();
        return;
      }

      // Internal-source citations — preserve existing shape
      const sources = hits.map((h, i) => ({
        n: i + 1, id: h.id, book: h.book, chapter: h.chapter,
        page_start: h.page_start, page_end: h.page_end,
        item_number: h.item_number, chunk_type: h.chunk_type,
        similarity: Number(h.similarity.toFixed(3)),
        preview: h.text.slice(0, 600),
      }));
      // PLOS citations rendered with kind:'plos' so the client can style them as a separate chip
      const plosSources = plosHits.map((p, i) => ({
        n: i + 1, kind: 'plos' as const, doi: p.doi, title: p.title,
        authors: p.authors, year: p.year, url: p.url, full_url: p.full_url,
        preview: p.abstract.slice(0, 600),
      }));
      emit({ type: 'sources', items: sources, plos: plosSources });

      const contextBlock = hits.map((h, i) => {
        const cite = `[${i + 1}] ${h.book}${h.chapter ? ' · ' + h.chapter : ''}${h.page_start ? ' · p.' + h.page_start : ''}${h.item_number ? ' · Item ' + h.item_number : ''}`;
        return `--- Excerpt ${i + 1} ---\n${cite}\n${h.text}\n`;
      }).join('\n');

      const plosBlock = formatPlosForPrompt(plosHits);

      const userMsg = `Question:\n${question}\n\nMKSAP / StatPearls / UpToDate Excerpts:\n${contextBlock || '(none)'}\n\n${plosBlock ? 'PLOS ONE Primary Research Abstracts:\n' + plosBlock + '\n\n' : ''}Answer using only these excerpts. Cite textbook claims with [n] and PLOS abstracts with [P{n}].`;
      emit({ type: 'progress', stage: 'generating', msg: `Generating answer with ${TEXT_MODEL}…`, ms: Date.now() - t0 });

      const llmStart = Date.now();
      const completion = await tracedChat(traceId, 'answer', {
        model: TEXT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.2,
        stream: true,
        ...({ options: { num_ctx: 16384 }, keep_alive: '15m' } as Record<string, unknown>),
      });

      // Collect full content as we stream so we can log it once the stream is done.
      let fullContent = '';
      for await (const part of completion) {
        const delta = part.choices?.[0]?.delta?.content ?? '';
        if (delta) { fullContent += delta; emit({ type: 'token', content: delta }); }
      }
      await logStreamComplete(traceId, 'answer', fullContent, llmStart, { model: TEXT_MODEL });
      emit({ type: 'done', ms: Date.now() - t0 });
    } catch (e) {
      outcome = 'error';
      outcomeMsg = String((e as Error).message);
      emit({ type: 'error', message: outcomeMsg });
    } finally {
      await finishTrace(traceId, outcome, outcomeMsg);
      close();
    }
  })();

  const headers = ndjsonHeaders();
  headers.set('X-Trace-Id', traceId);
  return new Response(stream, { headers });
}
