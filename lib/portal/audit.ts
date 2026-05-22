import { sql } from '@/lib/db';

/** Wire fire-and-forget admin action logging into admin endpoints. */
export async function logAdminAction(
  action: string,
  resource_type: string | null,
  resource_id: number | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_actions (actor_name, action, resource_type, resource_id, meta)
      VALUES ('Admin', ${action}, ${resource_type}, ${resource_id}, ${meta ? JSON.stringify(meta) : null}::jsonb)
    `;
  } catch { /* fail silently — audit is informational, not load-bearing */ }
}
