import { sql } from '@/lib/db';

/**
 * Writes a record_versions snapshot for the given entity.
 * Per PRD locked decision #28 — every save on tracked entities writes
 * a new version row with full snapshot JSONB.
 */
export async function saveVersion(
  entityType: 'resource' | 'pilot_app' | 'announcement' | 'contact' | 'video' | 'complaint_type' | 'complaint_type_field' | 'complaint_resolution',
  entityId: number,
  snapshot: Record<string, unknown>,
): Promise<void> {
  await sql`
    INSERT INTO record_versions (entity_type, entity_id, version_num, snapshot, changed_by)
    SELECT
      ${entityType},
      ${entityId},
      COALESCE(MAX(version_num), 0) + 1,
      ${JSON.stringify(snapshot)}::jsonb,
      'Admin'
    FROM record_versions
    WHERE entity_type = ${entityType} AND entity_id = ${entityId}
  `;
}
