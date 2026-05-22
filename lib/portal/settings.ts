/**
 * Portal settings (per PRD §11.8). Stored as a single JSONB-shaped TEXT row
 * in app_settings.value because the CDMSS-era column was created as TEXT
 * (see [[feedback-app-settings-text-not-jsonb]]). Reader JSON.parses; writer
 * JSON.stringify's.
 *
 * Key: app_settings.key = 'home_layout'
 */
import { sql } from '@/lib/db';

export type CardId = 'updates' | 'video' | 'sewa' | 'lit' | 'contacts' | 'resources';

export type Density = 'compact' | 'default' | 'comfy';

export type HomeLayoutSettings = {
  cards: { id: CardId; visible: boolean }[];
  density: Density;
  refresh_interval_sec: number | 0;        // 0 = no auto-refresh
  kills: {
    new_pulse: boolean;
    cmd_k: boolean;
    sewa_stats: boolean;
  };
};

export const DEFAULT_HOME_LAYOUT: HomeLayoutSettings = {
  cards: [
    { id: 'updates',   visible: true },
    { id: 'video',     visible: true },
    { id: 'sewa',      visible: true },
    { id: 'lit',       visible: true },
    { id: 'contacts',  visible: true },
    { id: 'resources', visible: true },
  ],
  density: 'default',
  refresh_interval_sec: 0,
  kills: { new_pulse: false, cmd_k: false, sewa_stats: false },
};

export async function getHomeLayout(): Promise<HomeLayoutSettings> {
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'home_layout'`;
  const first = (rows as { value: unknown }[])[0];
  if (!first?.value) return DEFAULT_HOME_LAYOUT;
  let raw: unknown = first.value;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('{')) {
      try { raw = JSON.parse(t); } catch { return DEFAULT_HOME_LAYOUT; }
    }
  }
  if (!raw || typeof raw !== 'object') return DEFAULT_HOME_LAYOUT;
  const merged = { ...DEFAULT_HOME_LAYOUT, ...(raw as Partial<HomeLayoutSettings>) };

  // Validate cards exist + reconcile with current canonical set (a setting
  // saved before a new card was added needs the new card spliced in).
  const knownIds = new Set<CardId>(DEFAULT_HOME_LAYOUT.cards.map((c) => c.id));
  const seen = new Set<CardId>();
  const cards: { id: CardId; visible: boolean }[] = [];
  for (const c of merged.cards ?? []) {
    if (knownIds.has(c.id as CardId) && !seen.has(c.id as CardId)) {
      cards.push({ id: c.id as CardId, visible: !!c.visible });
      seen.add(c.id as CardId);
    }
  }
  // Append any canonical cards missing from saved order
  for (const def of DEFAULT_HOME_LAYOUT.cards) {
    if (!seen.has(def.id)) cards.push(def);
  }
  merged.cards = cards;

  // Sanity: density must be valid
  if (!['compact', 'default', 'comfy'].includes(merged.density)) merged.density = 'default';
  return merged;
}

export async function setHomeLayout(next: HomeLayoutSettings): Promise<void> {
  const serialised = JSON.stringify(next);
  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('home_layout', ${serialised}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

// CSS class helpers consumed by AppLayout / home page
export function densityPaddingClass(d: Density): string {
  switch (d) {
    case 'compact': return 'px-4 py-2 gap-2';
    case 'comfy':   return 'px-8 py-6 gap-4';
    default:        return 'px-6 py-4 gap-3';
  }
}
