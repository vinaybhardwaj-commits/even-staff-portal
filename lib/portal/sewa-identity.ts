/**
 * Tracks complaint IDs raised from this browser (per V's SP.6-kickoff lock).
 * Lets the staff "My complaints" tab show recently-raised tickets without auth.
 */
const KEY = 'even-portal:sewa:my-ids';

export function getMyComplaintIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  } catch {
    return [];
  }
}

export function addMyComplaintId(id: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(id)) return;
  try {
    const existing = getMyComplaintIds();
    if (existing.includes(id)) return;
    const next = [id, ...existing].slice(0, 100);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* localStorage blocked */ }
}

export function clearMyComplaintIds(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(KEY); } catch { /* noop */ }
}
