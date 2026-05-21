/**
 * Per-complaint action endpoint.
 *
 * POST /api/admin/sewa/complaints/[id]/action
 *   body: {
 *     action: 'ack' | 'assign' | 'severity_change' | 'status_change' | 'note' | 'resolve' | 'add_tag' | 'remove_tag',
 *     ...action-specific params (see below)
 *   }
 *
 * Per locked decision #31: 'resolve' writes resolution_required_note_at_save
 *   snapshot of the resolution's requires_note flag at moment of resolve, so
 *   future edits to the resolution definition don't retroactively change
 *   whether this complaint's note was mandatory.
 *
 * Soft-delete on resolve: sets soft_deleted_at = NOW() per locked decision #31.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
const STATUSES = new Set(['open', 'ack', 'in_progress', 'resolved', 'wont_fix']);

function unauth() { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization') || '';
  if (!process.env.ADMIN_TOKEN || auth !== `Bearer ${process.env.ADMIN_TOKEN}`) return unauth();

  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'bad_id' }, { status: 400 });

  let p: {
    action?: string;
    assigned_to?: string;
    severity?: string;
    status?: string;
    note?: string;
    resolution_id?: number;
    resolution_is_other?: boolean;
    resolution_notes?: string;
    tag?: string;
  };
  try { p = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const action = (p.action ?? '').toLowerCase();
  if (!action) return NextResponse.json({ error: 'action_required' }, { status: 400 });

  const existing = (await sql`SELECT id, status FROM staff_complaints WHERE id = ${id}`) as { id: number | string; status: string }[];
  if (existing.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  switch (action) {
    case 'ack': {
      await sql`UPDATE staff_complaints SET status = 'ack', ack_at = COALESCE(ack_at, NOW()) WHERE id = ${id}`;
      await sql`INSERT INTO staff_complaint_events (complaint_id, event_type, actor, meta) VALUES (${id}, 'ack', 'Admin', ${JSON.stringify({})}::jsonb)`;
      return NextResponse.json({ ok: true });
    }
    case 'assign': {
      const assignee = (p.assigned_to ?? '').trim();
      await sql`UPDATE staff_complaints SET assigned_to = ${assignee || null}, status = CASE WHEN status='open' THEN 'ack' ELSE status END, ack_at = COALESCE(ack_at, NOW()) WHERE id = ${id}`;
      await sql`INSERT INTO staff_complaint_events (complaint_id, event_type, actor, meta) VALUES (${id}, 'assign', 'Admin', ${JSON.stringify({ assigned_to: assignee })}::jsonb)`;
      return NextResponse.json({ ok: true });
    }
    case 'severity_change': {
      const sev = (p.severity ?? '').toLowerCase();
      if (!SEVERITIES.has(sev)) return NextResponse.json({ error: 'bad_severity' }, { status: 400 });
      await sql`UPDATE staff_complaints SET severity = ${sev} WHERE id = ${id}`;
      await sql`INSERT INTO staff_complaint_events (complaint_id, event_type, actor, meta) VALUES (${id}, 'severity_change', 'Admin', ${JSON.stringify({ to: sev })}::jsonb)`;
      return NextResponse.json({ ok: true });
    }
    case 'status_change': {
      const st = (p.status ?? '').toLowerCase();
      if (!STATUSES.has(st)) return NextResponse.json({ error: 'bad_status' }, { status: 400 });
      await sql`UPDATE staff_complaints SET status = ${st} WHERE id = ${id}`;
      await sql`INSERT INTO staff_complaint_events (complaint_id, event_type, actor, meta) VALUES (${id}, 'status_change', 'Admin', ${JSON.stringify({ to: st })}::jsonb)`;
      return NextResponse.json({ ok: true });
    }
    case 'note': {
      const note = (p.note ?? '').trim();
      if (!note) return NextResponse.json({ error: 'note_required' }, { status: 400 });
      await sql`INSERT INTO staff_complaint_events (complaint_id, event_type, actor, meta) VALUES (${id}, 'note', 'Admin', ${JSON.stringify({ note: note.slice(0, 2000) })}::jsonb)`;
      return NextResponse.json({ ok: true });
    }
    case 'resolve': {
      // Two paths: a known resolution_id, OR resolution_is_other (always requires note per decision #31)
      const isOther = !!p.resolution_is_other;
      const resolutionId = p.resolution_id ? Number(p.resolution_id) : null;
      const notes = (p.resolution_notes ?? '').trim();

      let requires_note_at_save = true;
      if (!isOther) {
        if (!resolutionId) return NextResponse.json({ error: 'resolution_id_or_other_required' }, { status: 400 });
        const rrows = (await sql`SELECT requires_note FROM complaint_resolutions WHERE id = ${resolutionId}`) as { requires_note: boolean }[];
        if (rrows.length === 0) return NextResponse.json({ error: 'resolution_not_found' }, { status: 404 });
        requires_note_at_save = !!rrows[0].requires_note;
      }
      if (requires_note_at_save && !notes) {
        return NextResponse.json({ error: 'note_required_for_this_resolution' }, { status: 400 });
      }

      await sql`
        UPDATE staff_complaints
        SET
          status = 'resolved',
          resolved_at = NOW(),
          soft_deleted_at = NOW(),
          resolution_id = ${isOther ? null : resolutionId},
          resolution_is_other = ${isOther},
          resolution_required_note_at_save = ${requires_note_at_save},
          resolution_notes = ${notes || null}
        WHERE id = ${id}
      `;
      await sql`
        INSERT INTO staff_complaint_events (complaint_id, event_type, actor, meta)
        VALUES (${id}, 'resolve', 'Admin', ${JSON.stringify({ resolution_id: resolutionId, resolution_is_other: isOther, notes: notes.slice(0, 2000) })}::jsonb)
      `;
      return NextResponse.json({ ok: true });
    }
    case 'add_tag':
    case 'remove_tag': {
      const tag = (p.tag ?? '').trim().slice(0, 60);
      if (!tag) return NextResponse.json({ error: 'tag_required' }, { status: 400 });
      if (action === 'add_tag') {
        await sql`UPDATE staff_complaints SET tags = array_append(COALESCE(tags, '{}'::text[]), ${tag}) WHERE id = ${id} AND NOT (${tag} = ANY(COALESCE(tags, '{}'::text[])))`;
      } else {
        await sql`UPDATE staff_complaints SET tags = array_remove(COALESCE(tags, '{}'::text[]), ${tag}) WHERE id = ${id}`;
      }
      await sql`INSERT INTO staff_complaint_events (complaint_id, event_type, actor, meta) VALUES (${id}, 'note', 'Admin', ${JSON.stringify({ tag_action: action, tag })}::jsonb)`;
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
  }
}
