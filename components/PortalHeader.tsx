/**
 * Top hero — per PRD §4.3.
 *
 * Left: handled by sidebar brand block (above the hero).
 * Center: global search input (Cmd/Ctrl+K command palette wires in SP.7).
 * Right: live clock + date (updates every second).
 *
 * 60-72px tall. Sits above the 3×2 grid on Home; reused as a slim header
 * on other pages.
 */
'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PortalHeader({ title }: { title?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : ' ';
  const dateStr = now
    ? now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
    : ' ';

  return (
    <header className="h-[72px] bg-white border-b border-[var(--color-border)] flex items-center gap-4 px-6 shrink-0">
      {title && (
        <div className="text-[15px] font-semibold text-navy shrink-0 min-w-[120px]">{title}</div>
      )}

      <div className="flex-1 max-w-2xl mx-auto">
        <label className="relative block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search announcements, contacts, resources, bulletin…"
            className="w-full pl-9 pr-12 py-2 text-[13px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-navy placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition"
            aria-label="Global search (coming SP.7)"
          />
          <kbd className="hidden lg:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] bg-white border border-[var(--color-border)] rounded">
            ⌘K
          </kbd>
        </label>
      </div>

      <div className="text-right shrink-0 hidden sm:block">
        <div className="text-[14px] font-semibold text-navy tabular-nums leading-tight">{timeStr}</div>
        <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide leading-tight">{dateStr}</div>
      </div>
    </header>
  );
}
