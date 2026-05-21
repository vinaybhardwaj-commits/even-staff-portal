/**
 * Display-name identity for the no-auth portal.
 *
 * Per V's SP.3-kickoff decision: Anonymous by default, optional name
 * that persists to localStorage so subsequent posts auto-fill.
 *
 * 'Anonymous' is the literal display string when no name is set —
 * server stores NULL author_email always, and stores 'Anonymous' as
 * the display name. This keeps the storage shape consistent.
 */
const KEY = 'even-portal:display_name';

export const ANONYMOUS = 'Anonymous';

export function getDisplayName(): string {
  if (typeof window === 'undefined') return ANONYMOUS;
  try {
    const v = window.localStorage.getItem(KEY);
    return v?.trim() || ANONYMOUS;
  } catch {
    return ANONYMOUS;
  }
}

export function setDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      window.localStorage.removeItem(KEY);
    } else {
      window.localStorage.setItem(KEY, trimmed.slice(0, 60));
    }
  } catch {
    /* localStorage blocked — fail silently */
  }
}

/** Stable color from string — used to color initials avatars. */
export function colorFromName(name: string): { bg: string; fg: string } {
  const palette: { bg: string; fg: string }[] = [
    { bg: '#e6eeff', fg: '#0044cc' }, // brand
    { bg: '#fde8f2', fg: '#c4356b' }, // pink
    { bg: '#dbe7ff', fg: '#002054' }, // navy
    { bg: '#fef3c7', fg: '#92400e' }, // amber
    { bg: '#d1fae5', fg: '#065f46' }, // emerald
    { bg: '#ede9fe', fg: '#5b21b6' }, // violet
    { bg: '#fee2e2', fg: '#991b1b' }, // red
    { bg: '#e0f2fe', fg: '#075985' }, // cyan
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function initialsOf(name: string): string {
  if (!name || name === ANONYMOUS) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
