/**
 * v1.7 Sprint C — JSON dump of a trace + all events.
 * Returns Content-Disposition attachment so browsers download as a .json file.
 * Auth: admin Bearer (header) OR ?token=<ADMIN_TOKEN> query param for one-click downloads from the admin UI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

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
  ` as Record<string, unknown>[];

  const dump = { schema_version: 'v1.7', trace: traceRows[0], events };
  return new NextResponse(JSON.stringify(dump, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="trace-${trace_id}.json"`,
    },
  });
}
