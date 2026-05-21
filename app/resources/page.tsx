import { AppLayout } from '@/components/AppLayout';
import { getResources, type Resource } from '@/lib/portal/reads';
import { isNewUndatedByIndex } from '@/lib/portal/newness';
import { Link as LinkIcon, ExternalLink, Pin } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = { title: 'Resources · Even Staff Portal' };

function groupByCategory(items: Resource[]): { category: string; items: Resource[] }[] {
  const map = new Map<string, Resource[]>();
  for (const r of items) {
    const key = (r.category || 'Other').trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  // Stable order: HIS > Clinical reference > Education > everything else alpha
  const priority = ['HIS', 'Clinical reference', 'Education', 'Compliance', 'HR'];
  const cats = Array.from(map.keys()).sort((a, b) => {
    const pa = priority.indexOf(a);
    const pb = priority.indexOf(b);
    if (pa !== -1 && pb !== -1) return pa - pb;
    if (pa !== -1) return -1;
    if (pb !== -1) return 1;
    return a.localeCompare(b);
  });
  return cats.map((c) => ({ category: c, items: map.get(c)! }));
}

export default async function ResourcesPage() {
  const items = await getResources(100);
  const groups = groupByCategory(items);

  // NEW: the newest-by-created_at row across the whole list (per locked decision #26)
  const newest = [...items].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0];
  const newestId = newest?.id;

  return (
    <AppLayout title="Resources">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
            <LinkIcon className="w-12 h-12 text-[var(--color-text-muted)] opacity-40 mx-auto mb-3" strokeWidth={1.5} />
            <div className="text-[14px] font-medium text-navy mb-1">No resources yet</div>
            <div className="text-[12px] text-[var(--color-text-secondary)]">Admin will add HIS links, references, and other resources here.</div>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(({ category, items: rows }) => (
              <section key={category} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
                <header className="px-4 py-3 border-b border-[var(--color-border)]">
                  <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{category}</h2>
                </header>
                <ul className="divide-y divide-[var(--color-border)]">
                  {rows.map((r, idx) => {
                    const isNewRow = r.id === newestId && isNewUndatedByIndex(0);
                    return (
                      <li key={r.id}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-bg)] transition-colors group ${isNewRow ? 'is-new-row' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-md bg-brand-faint text-brand flex items-center justify-center text-[14px] shrink-0">
                            {r.icon || '🔗'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="text-[13px] font-medium text-navy">{r.name}</div>
                              {r.pinned && <Pin className="w-3 h-3 text-brand" strokeWidth={2} />}
                              {isNewRow && <span className="new-dot" aria-label="new" />}
                            </div>
                            {r.description && (
                              <div className="text-[11px] text-[var(--color-text-secondary)] leading-snug truncate">{r.description}</div>
                            )}
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-40 group-hover:opacity-90 shrink-0" strokeWidth={1.75} />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
