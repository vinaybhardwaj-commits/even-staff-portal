/**
 * v1.7 Sprint B — list traces for the admin dashboard.
 *
 * Query params:
 *   q       : free-text search (Postgres tsvector @@ plainto_tsquery)
 *   from    : ISO date (default: 7 days ago, lock #12)
 *   to      : ISO date (default: now)
 *   feature : 'ask' (only one for now)
 *   status  : 'success' | 'error' | 'partial'
 *   severity: 'none' | 'minor' | 'moderate' | 'major'
 *   user_id : int
 *   limit   : default 50, max 200
 *   offset  : default 0
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';
function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  const feature = url.searchParams.get('feature');
  const status = url.searchParams.get('status');
  const severity = url.searchParams.get('severity');
  const userId = url.searchParams.get('user_id');
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));

  const from = fromParam || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to = toParam || new Date().toISOString();

  const where: string[] = [`started_at >= $1`, `started_at <= $2`];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [from, to];
  if (q) { params.push(q); where.push(`search_tsv @@ plainto_tsquery('english', $${params.length})`); }
  if (feature) { params.push(feature); where.push(`feature = $${params.length}`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  if (severity) { params.push(severity); where.push(`severity = $${params.length}`); }
  if (userId) { params.push(parseInt(userId, 10)); where.push(`user_id = $${params.length}`); }

  const whereSql = where.join(' AND ');
  const listParams = [...params, limit, offset];

  const listQuery = `
    SELECT trace_id, user_id, feature, status, severity, question_preview,
           started_at::text AS started_at, finished_at::text AS finished_at,
           total_ms, model_summary,
           (SELECT COUNT(*) FROM trace_events WHERE trace_id = traces.trace_id) AS event_count
    FROM traces
    WHERE ${whereSql}
    ORDER BY started_at DESC
    LIMIT $${listParams.length - 1} OFFSET $${listParams.length}
  `;
  const countQuery = `SELECT COUNT(*)::int AS n FROM traces WHERE ${whereSql}`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sqlFn = sql as unknown as (q: string, p: unknown[]) => Promise<any[]>;
    const [rows, countRows] = await Promise.all([
      sqlFn(listQuery, listParams),
      sqlFn(countQuery, params),
    ]);
    return NextResponse.json({
      ok: true,
      traces: rows,
      total: countRows[0]?.n ?? 0,
      limit, offset,
      filters: { q, from, to, feature, status, severity, user_id: userId },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
