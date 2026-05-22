import Link from 'next/link';
import { Bell } from 'lucide-react';
import { getSewaMonthlyStats } from '@/lib/portal/reads';
import { getHomeLayout } from '@/lib/portal/settings';

export async function SewaCard() {
  const [stats, layout] = await Promise.all([
    getSewaMonthlyStats(),
    getHomeLayout(),
  ]);
  const showStats = !layout.kills.sewa_stats;

  return (
    <section className="h-full flex flex-col bg-white rounded-xl border border-[var(--color-border)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 overflow-hidden">
      <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-pink-light text-pink-dark flex items-center justify-center">
          <Bell className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <h2 className="text-[13px] font-semibold text-navy flex-1">Sewa · staff complaints + incidents</h2>
      </header>

      <div className="flex-1 flex flex-col px-4 py-4">
        <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug mb-4">
          Raise an operational issue, equipment fault, supply shortage, or safety concern. Routed to admin for triage.
        </p>
        <Link
          href="/sewa"
          className="block w-full text-center px-4 py-2.5 rounded-lg bg-brand text-white text-[13px] font-medium hover:bg-brand-dark transition-colors"
        >
          Raise a complaint
        </Link>
        <Link
          href="/sewa?tab=mine"
          className="block text-center mt-2 text-[11px] text-brand hover:text-brand-dark transition-colors"
        >
          View my past complaints →
        </Link>

        {showStats && (
          <div className="mt-auto pt-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] text-center">
            This month · <span className="font-medium text-navy">{stats.raised}</span> raised · <span className="font-medium text-navy">{stats.resolved}</span> resolved
          </div>
        )}
      </div>
    </section>
  );
}
