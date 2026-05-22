import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getComplaintTypeById, getFieldsForType } from '@/lib/portal/sewa-reads';
import { ANONYMOUS } from '@/lib/portal/identity';

export const runtime = 'nodejs';

const ALLOWED_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

function slaHoursFor(type: { sla_low_hours: number; sla_medium_hours: number; sla_high_hours: number; sla_critical_hours: number }, severity: string): number {
  switch (severity) {
    case 'low': return type.sla_low_hours;
    case 'medium': return type.sla_medium_hours;
    case 'high': return type.sla_high_hours;
    case 'critical': return type.sla_critical_hours;
    default: return type.sla_medium_hours;
  }
}

export async function POST(req: NextRequest) {
  let payload: {
    complaint_type_id?: number;
    title?: string;
    description?: string;
    severity?: string;
    confidential?: boolean;
    raised_by_display_name?: string;
    custom_fields?: Record<string, unknown>;
    attachment_url?: string | null;
    tags?: string[];
    patient_name?: string;
    patient_mrn?: string;
  };
  try { payload = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const typeId = Number(payload.complaint_type_id);
  if (!Number.isFinite(typeId) || typeId <= 0) return NextResponse.json({ error: 'complaint_type_id_required' }, { status: 400 });

  const ctype = await getComplaintTypeById(typeId);
  if (!ctype || !ctype.active || ctype.retired_at) {
    return NextResponse.json({ error: 'invalid_complaint_type' }, { status: 400 });
  }

  const title = (payload.title ?? '').trim();
  const description = (payload.description ?? '').trim();
  if (!title) return NextResponse.json({ error: 'title_required' }, { status: 400 });
  if (!description) return NextResponse.json({ error: 'description_required' }, { status: 400 });
  if (title.length > 200) return NextResponse.json({ error: 'title_too_long' }, { status: 400 });
  if (description.length > 8000) return NextResponse.json({ error: 'description_too_long' }, { status: 400 });

  const severity = (payload.severity ?? ctype.default_severity).toLowerCase();
  if (!ALLOWED_SEVERITIES.has(severity)) return NextResponse.json({ error: 'bad_severity' }, { status: 400 });

  // Validate required custom fields
  const fields = await getFieldsForType(typeId);
  const custom = (payload.custom_fields && typeof payload.custom_fields === 'object') ? payload.custom_fields : {};
  for (const f of fields) {
    if (f.required) {
      const v = custom[f.field_slug];
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
        return NextResponse.json({ error: `field_required:${f.field_slug}` }, { status: 400 });
      }
    }
  }

  const slaHours = slaHoursFor(ctype, severity);
  const slaDueAt = new Date(Date.now() + slaHours * 3600_000).toISOString();
  const author = (payload.raised_by_display_name ?? '').trim() || ANONYMOUS;
  const confidential = !!payload.confidential;
  const attachmentUrl = payload.attachment_url || null;
  const tags = Array.isArray(payload.tags) ? payload.tags.filter((t) => typeof t === 'string' && t.length < 60).slice(0, 10) : [];

  // v1.2 T8: optional patient_name + patient_mrn
  const patientName = typeof payload.patient_name === 'string' ? payload.patient_name.trim().slice(0, 120) || null : null;
  const patientMrn = typeof payload.patient_mrn === 'string' ? payload.patient_mrn.trim().slice(0, 40) || null : null;

  // Insert complaint (sets category to the type's slug for legacy column compat)
  const insertRows = await sql`
    INSERT INTO staff_complaints (
      title, description, category, severity, status, confidential,
      raised_by_display_name, sla_due_at, complaint_type_id, custom_fields, tags, attachment_url,
      patient_name, patient_mrn
    ) VALUES (
      ${title}, ${description}, ${ctype.slug}, ${severity}, 'open', ${confidential},
      ${author.slice(0, 60)}, ${slaDueAt}, ${typeId}, ${JSON.stringify(custom)}::jsonb,
      ${tags}::text[], ${attachmentUrl},
      ${patientName}, ${patientMrn}
    )
    RETURNING id
  `;
  const id = Number((insertRows as { id: number | string }[])[0]?.id);

  // Event log: 'created'
  await sql`
    INSERT INTO staff_complaint_events (complaint_id, event_type, actor, meta)
    VALUES (${id}, 'created', ${author.slice(0, 60)}, ${JSON.stringify({ severity, type: ctype.slug, sla_due_at: slaDueAt })}::jsonb)
  `;

  return NextResponse.json({ id, sla_due_at: slaDueAt }, { status: 201 });
}
