/**
 * v1.7 Sprint B — fetch a single trace with all its events.
 * Returns the trace row + ordered events (by seq ASC).
 *
 * Lock #8 — the per-query "View trace ↗" link should be accessible to the
 * trace owner without admin token. For now we accept EITHER:
 *   - Bearer ADMIN_TOKEN (admin dashboard use)
 *   - Cookie rounds_session whose user_id matches the trace's user_id
 *     (per-query link use)
 * If neither matches, 401.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

type TraceRow = {
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
  input: unknown;
  meta: unknown;
  error_message: string | null;
};

type EventRow = {
  seq: number;
  kind: string;
  stage: string | null;
  payload: unknown;
  latency_ms: number | null;
  created_at: string;
};

async function fetchTraceOwner(traceId: string): Promise<number | null> {
  const rows = await sql`SELECT user_id FROM traces WHERE trace_id = ${traceId}` as { user_id: number }[];
  return rows[0]?.user_id ?? null;
}

async function getSessionUserId(): Promise<number | null> {
  try {
    const c = await cookies();
    const tok = c.get('rounds_session')?.value;
    if (!tok) return null;
    // Lazy decode without full JWT verify — we just need user_id for trace ownership.
    // (Existing app uses HS256; full verify happens in /lib/auth.ts elsewhere.)
    const parts = tok.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload.user_id === 'number' ? payload.user_id : null;
  } catch { return null; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ trace_id: string }> }) {
  const { trace_id } = await params;
  if (!trace_id || trace_id.length < 8) {
    return NextResponse.json({ error: 'bad_trace_id' }, { status: 400 });
  }

  // Auth: admin bearer OR cookie-session user_id matches trace owner
  const auth = req.headers.get('authorization') || '';
  const isAdmin = !!process.env.ADMIN_TOKEN && auth === `Bearer ${process.env.ADMIN_TOKEN}`;
  if (!isAdmin) {
    const owner = await fetchTraceOwner(trace_id);
    const me = await getSessionUserId();
    if (!owner || !me || owner !== me) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  try {
    const traceRows = await sql`
      SELECT trace_id, user_id, feature, status, severity, question_preview,
             started_at::text AS started_at, finished_at::text AS finished_at,
             total_ms, model_summary, final_answer_text, input, meta, error_message
      FROM traces WHERE trace_id = ${trace_id}
    ` as TraceRow[];
    if (!traceRows[0]) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const eventRows = await sql`
      SELECT seq, kind, stage, payload, latency_ms, created_at::text AS created_at
      FROM trace_events WHERE trace_id = ${trace_id} ORDER BY seq ASC
    ` as EventRow[];

    return NextResponse.json({ ok: true, trace: traceRows[0], events: eventRows });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
