import { ExternalLink, BookOpen, Newspaper } from 'lucide-react';
import { getResources } from '@/lib/portal/reads';

export async function LiteratureCard() {
  // Surface every resource tagged with the Clinical-reference category.
  // Admin curates the list from /even-admin/resources (set category =
  // 'Clinical reference' or 'Medical Literature'). ResourcesCard
  // excludes these categories so each item shows in exactly one card.
  const all = await getResources(50);
  const LIT_CATEGORIES = new Set(['Clinical reference', 'Medical Literature', 'Literature']);
  const items = all.filter((r) => r.category && LIT_CATEGORIES.has(r.category));

  return (
    <section className="h-full flex flex-col bg-white rounded-xl border border-[var(--color-border)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 overflow-hidden">
      <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-brand-faint text-brand flex items-center justify-center">
          <BookOpen className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <h2 className="text-[13px] font-semibold text-navy">Medical Literature</h2>
      </header>

      <div className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-[11px] text-[var(--color-text-muted)] py-4 text-center">
            No literature resources yet
          </div>
        ) : items.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[var(--color-border)] hover:border-brand hover:bg-brand-faint/30 transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-brand-faint flex items-center justify-center text-[18px] shrink-0">
              {r.icon || (r.url.includes('cureus') ? <Newspaper className="w-4 h-4 text-brand" /> : <BookOpen className="w-4 h-4 text-brand" />)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-navy leading-tight">{r.name}</div>
              <div className="text-[10px] text-[var(--color-text-muted)] leading-snug line-clamp-1 mt-0.5">
                {r.description || ''}
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-40 group-hover:opacity-90 shrink-0" strokeWidth={1.75} />
          </a>
        ))}
      </div>
    </section>
  );
}
