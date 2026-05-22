/**
 * v1.2 T7: 30-day purge cron for soft-deleted Sewa complaints.
 *
 * Per PRD §3 #31. Vercel Cron invokes this daily at 03:00 IST
 * (21:30 UTC). Auth: Vercel sends `Authorization: Bearer ${CRON_SECRET}`
 * header automatically when CRON_SECRET env var is set. We fall back
 * to ADMIN_TOKEN for manual invocations.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { logAdminAction } from '@/lib/portal/audit';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  const adminToken = process.env.ADMIN_TOKEN;
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  if (adminToken && auth === `Bearer ${adminToken}`) return true;
  return false;
}

export async function GET(req: NextRequest) {
  // Vercel Cron uses GET by default
  if (!isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Hard-delete complaints soft-deleted >30 days ago.
  // We delete child rows first (events + attachments not yet implemented, but defensively).
  const ids = await sql`
    SELECT id FROM staff_complaints
    WHERE soft_deleted_at IS NOT NULL
      AND soft_deleted_at < NOW() - INTERVAL '30 days'
    LIMIT 500
  `;

  let purged = 0;
  for (const row of ids) {
    const id = row.id;
    await sql`DELETE FROM staff_complaint_events WHERE complaint_id = ${id}`;
    await sql`DELETE FROM staff_complaints WHERE id = ${id}`;
    purged++;
  }

  if (purged > 0) {
    await logAdminAction(
      'purge',
      'staff_complaints',
      0,
      { count: purged, cutoff_days: 30, run_at: new Date().toISOString(), actor: 'cron' },
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, purged });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
