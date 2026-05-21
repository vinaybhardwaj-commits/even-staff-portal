/**
 * NEW-detection — per PRD locked decision #26 (verbatim from static portal).
 *
 * Rules:
 *  - Items with a `publish_at` or `date` (announcements): within 48 hours of now.
 *  - Items without a date (resources, contacts, pilot apps): the most-recently
 *    -added row (sort by created_at DESC, top row gets the flag).
 *  - Bulletin posts: within 24 hours OR the most recent post if newer than
 *    7 days (whichever wider). Handled inline in the bulletin module.
 */
export const NEW_THRESHOLD_HOURS = 48;

export type IsNewOptions = {
  /** For dated lists: explicit threshold in hours. Default 48. */
  hours?: number;
  /** For undated lists: the position in the (created_at DESC)-sorted list
   * that gets flagged. 0 = top row only (default). */
  topNUndated?: number;
};

export function isNewDated(dateStr: string | Date | null | undefined, opts: IsNewOptions = {}): boolean {
  if (!dateStr) return false;
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return false;
  const threshold = (opts.hours ?? NEW_THRESHOLD_HOURS) * 60 * 60 * 1000;
  const delta = Date.now() - d.getTime();
  return delta >= 0 && delta <= threshold;
}

/** For undated lists ordered created_at DESC: index 0 is new. */
export function isNewUndatedByIndex(idx: number, opts: IsNewOptions = {}): boolean {
  return idx < (opts.topNUndated ?? 1);
}
