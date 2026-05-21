import { sql } from '@/lib/db';

export type ComplaintType = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  default_severity: 'low' | 'medium' | 'high' | 'critical';
  sla_low_hours: number;
  sla_medium_hours: number;
  sla_high_hours: number;
  sla_critical_hours: number;
  active: boolean;
  retired_at: string | null;
  sort_order: number;
};

export type ComplaintTypeField = {
  id: number;
  complaint_type_id: number;
  field_slug: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'image';
  field_options: { options?: string[] } | null;
  required: boolean;
  sort_order: number;
  active: boolean;
};

export type ComplaintResolution = {
  id: number;
  complaint_type_id: number;
  slug: string;
  label: string;
  icon: string | null;
  requires_note: boolean;
  sort_order: number;
  active: boolean;
};

export type StaffComplaint = {
  id: number;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'ack' | 'in_progress' | 'resolved' | 'wont_fix';
  confidential: boolean;
  raised_by_display_name: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  attachment_url: string | null;
  sla_due_at: string;
  created_at: string;
  ack_at: string | null;
  resolved_at: string | null;
  complaint_type_id: number | null;
  complaint_type_slug: string | null;
  complaint_type_name: string | null;
  complaint_type_icon: string | null;
  custom_fields: Record<string, unknown> | null;
  resolution_id: number | null;
  resolution_label: string | null;
  resolution_is_other: boolean | null;
  tags: string[];
  soft_deleted_at: string | null;
};

export type ComplaintEvent = {
  id: number;
  complaint_id: number;
  event_type: 'created' | 'ack' | 'assign' | 'severity_change' | 'status_change' | 'note' | 'resolve';
  actor: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export async function listComplaintTypes(opts: { includeRetired?: boolean } = {}): Promise<ComplaintType[]> {
  const rows = opts.includeRetired
    ? await sql`
        SELECT id, slug, name, description, icon, color, default_severity,
               sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours,
               active, retired_at::text, sort_order
        FROM complaint_types ORDER BY sort_order ASC, name ASC
      `
    : await sql`
        SELECT id, slug, name, description, icon, color, default_severity,
               sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours,
               active, retired_at::text, sort_order
        FROM complaint_types
        WHERE active = TRUE AND retired_at IS NULL
        ORDER BY sort_order ASC, name ASC
      `;
  return rows as ComplaintType[];
}

export async function getComplaintTypeBySlug(slug: string): Promise<ComplaintType | null> {
  const rows = await sql`
    SELECT id, slug, name, description, icon, color, default_severity,
           sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours,
           active, retired_at::text, sort_order
    FROM complaint_types WHERE slug = ${slug}
  `;
  return (rows[0] as ComplaintType | undefined) ?? null;
}

export async function getComplaintTypeById(id: number): Promise<ComplaintType | null> {
  const rows = await sql`
    SELECT id, slug, name, description, icon, color, default_severity,
           sla_low_hours, sla_medium_hours, sla_high_hours, sla_critical_hours,
           active, retired_at::text, sort_order
    FROM complaint_types WHERE id = ${id}
  `;
  return (rows[0] as ComplaintType | undefined) ?? null;
}

export async function getFieldsForType(typeId: number): Promise<ComplaintTypeField[]> {
  const rows = await sql`
    SELECT id, complaint_type_id, field_slug, field_label, field_type,
           field_options, required, sort_order, active
    FROM complaint_type_fields
    WHERE complaint_type_id = ${typeId} AND active = TRUE
    ORDER BY sort_order ASC
  `;
  return rows as ComplaintTypeField[];
}

export async function getResolutionsForType(typeId: number): Promise<ComplaintResolution[]> {
  const rows = await sql`
    SELECT id, complaint_type_id, slug, label, icon, requires_note, sort_order, active
    FROM complaint_resolutions
    WHERE complaint_type_id = ${typeId} AND active = TRUE
    ORDER BY sort_order ASC
  `;
  return rows as ComplaintResolution[];
}

const COMPLAINT_COLS = `
  c.id, c.title, c.description, c.category, c.severity, c.status, c.confidential,
  c.raised_by_display_name, c.assigned_to, c.resolution_notes, c.attachment_url,
  c.sla_due_at::text, c.created_at::text, c.ack_at::text, c.resolved_at::text,
  c.complaint_type_id, c.custom_fields, c.resolution_id, c.resolution_is_other,
  COALESCE(c.tags, '{}'::text[]) AS tags,
  c.soft_deleted_at::text,
  ct.slug AS complaint_type_slug, ct.name AS complaint_type_name, ct.icon AS complaint_type_icon,
  cr.label AS resolution_label
`;

export async function getComplaint(id: number): Promise<StaffComplaint | null> {
  const rows = await sql`
    SELECT
      c.id, c.title, c.description, c.category, c.severity, c.status, c.confidential,
      c.raised_by_display_name, c.assigned_to, c.resolution_notes, c.attachment_url,
      c.sla_due_at::text, c.created_at::text, c.ack_at::text, c.resolved_at::text,
      c.complaint_type_id, c.custom_fields, c.resolution_id, c.resolution_is_other,
      COALESCE(c.tags, '{}'::text[]) AS tags,
      c.soft_deleted_at::text,
      ct.slug AS complaint_type_slug, ct.name AS complaint_type_name, ct.icon AS complaint_type_icon,
      cr.label AS resolution_label
    FROM staff_complaints c
    LEFT JOIN complaint_types ct ON ct.id = c.complaint_type_id
    LEFT JOIN complaint_resolutions cr ON cr.id = c.resolution_id
    WHERE c.id = ${id}
  `;
  return (rows[0] as StaffComplaint | undefined) ?? null;
}

export async function listComplaintsByIds(ids: number[]): Promise<StaffComplaint[]> {
  if (ids.length === 0) return [];
  const rows = await sql`
    SELECT
      c.id, c.title, c.description, c.category, c.severity, c.status, c.confidential,
      c.raised_by_display_name, c.assigned_to, c.resolution_notes, c.attachment_url,
      c.sla_due_at::text, c.created_at::text, c.ack_at::text, c.resolved_at::text,
      c.complaint_type_id, c.custom_fields, c.resolution_id, c.resolution_is_other,
      COALESCE(c.tags, '{}'::text[]) AS tags,
      c.soft_deleted_at::text,
      ct.slug AS complaint_type_slug, ct.name AS complaint_type_name, ct.icon AS complaint_type_icon,
      cr.label AS resolution_label
    FROM staff_complaints c
    LEFT JOIN complaint_types ct ON ct.id = c.complaint_type_id
    LEFT JOIN complaint_resolutions cr ON cr.id = c.resolution_id
    WHERE c.id = ANY(${ids})
    ORDER BY c.created_at DESC
  `;
  return rows as StaffComplaint[];
}

export async function listAdminComplaints(opts: {
  status?: string[];
  severity?: string[];
  typeId?: number;
  includeDeleted?: boolean;
  limit?: number;
} = {}): Promise<StaffComplaint[]> {
  // Simple variant — explicit filter combos.
  const limit = opts.limit ?? 200;
  const incDel = opts.includeDeleted ?? false;
  const rows = await sql`
    SELECT
      c.id, c.title, c.description, c.category, c.severity, c.status, c.confidential,
      c.raised_by_display_name, c.assigned_to, c.resolution_notes, c.attachment_url,
      c.sla_due_at::text, c.created_at::text, c.ack_at::text, c.resolved_at::text,
      c.complaint_type_id, c.custom_fields, c.resolution_id, c.resolution_is_other,
      COALESCE(c.tags, '{}'::text[]) AS tags,
      c.soft_deleted_at::text,
      ct.slug AS complaint_type_slug, ct.name AS complaint_type_name, ct.icon AS complaint_type_icon,
      cr.label AS resolution_label
    FROM staff_complaints c
    LEFT JOIN complaint_types ct ON ct.id = c.complaint_type_id
    LEFT JOIN complaint_resolutions cr ON cr.id = c.resolution_id
    WHERE (${incDel}::boolean OR c.soft_deleted_at IS NULL)
    ORDER BY
      CASE c.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      c.created_at DESC
    LIMIT ${limit}
  `;
  return rows as StaffComplaint[];
}

export async function listEventsForComplaint(complaintId: number): Promise<ComplaintEvent[]> {
  const rows = await sql`
    SELECT id, complaint_id, event_type, actor, meta, created_at::text
    FROM staff_complaint_events
    WHERE complaint_id = ${complaintId}
    ORDER BY created_at ASC
  `;
  return rows as ComplaintEvent[];
}
