import { sql } from '@/lib/db';

export type PilotApp = {
  id: number;
  name: string;
  description: string | null;
  long_description: string | null;
  status: 'alpha' | 'beta' | 'live' | 'sunset';
  owner_name: string | null;
  owner_email: string | null;
  open_url: string;
  screenshot_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listPilotApps(opts: { includeInactive?: boolean } = {}): Promise<PilotApp[]> {
  const rows = opts.includeInactive
    ? await sql`
        SELECT id, name, description, long_description, status, owner_name, owner_email,
               open_url, screenshot_url, sort_order, active, created_at::text, updated_at::text
        FROM pilot_apps ORDER BY sort_order ASC, name ASC
      `
    : await sql`
        SELECT id, name, description, long_description, status, owner_name, owner_email,
               open_url, screenshot_url, sort_order, active, created_at::text, updated_at::text
        FROM pilot_apps WHERE active = TRUE ORDER BY sort_order ASC, name ASC
      `;
  return rows as PilotApp[];
}
