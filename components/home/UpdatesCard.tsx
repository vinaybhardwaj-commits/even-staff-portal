import { getAnnouncements } from '@/lib/portal/reads';
import { isNewDated } from '@/lib/portal/newness';
import { Megaphone } from 'lucide-react';

const TYPE_BADGE: Record<string, string> = {
  urgent:    'bg-pink-light text-pink-dark',
  update:    'bg-brand-faint text-brand',
  info:      'bg-navy/5 text-navy',
  education: 'bg-brand-faint text-brand-dark',
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return iso.slice(0, 10);
  }
}

export async function UpdatesCard() {
  const items = await getAnnouncements();
  const newCount = items.filter((i) => isNewDated(i.publish_at)).length;

  return (
    <section className="h-full flex flex-col bg-white rounded-xl border border-[var(--color-border)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 overflow-hidden">
      <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-brand-faint text-brand flex items-center justify-center">
          <Megaphone className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <h2 className="text-[13px] font-semibold text-navy flex-1">Hospital Updates &amp; Announcements</h2>
        {newCount > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-light text-pink-dark">
            {newCount} NEW
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 text-center">
          <Megaphone className="w-7 h-7 text-[var(--color-text-muted)] opacity-40 mb-2" strokeWidth={1.5} />
          <div className="text-[12px] text-[var(--color-text-secondary)] font-medium">No announcements yet</div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Admin will post here</div>
        </div>
      ) : (
        <ul className="flex-1 card-scroll px-4 py-2">
          {items.map((a) => {
            const itemNew = isNewDated(a.publish_at);
            const badge = TYPE_BADGE[(a.category || 'info').toLowerCase()] || TYPE_BADGE.info;
            return (
              <li key={a.id} className={`py-2 border-b border-[var(--color-border)] last:border-0 ${itemNew ? 'is-new' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {a.category && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge}`}>
                      {a.category}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--color-text-muted)]">{fmtDate(a.publish_at)}</span>
                  {itemNew && <span className="new-dot" aria-label="new" />}
                </div>
                <div className="text-[12px] font-medium text-navy leading-snug">{a.title}</div>
                {a.body && (
                  <div className="text-[11px] text-[var(--color-text-secondary)] leading-snug line-clamp-2 mt-0.5">
                    {a.body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
