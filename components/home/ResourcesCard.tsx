import { Link as LinkIcon, ExternalLink } from 'lucide-react';
import { getResources } from '@/lib/portal/reads';
import { isNewUndatedByIndex } from '@/lib/portal/newness';

export async function ResourcesCard() {
  // Exclude categories that live in their own dedicated card
  // (LiteratureCard shows these). One row, one card.
  const LIT_CATEGORIES = new Set(['Clinical reference', 'Medical Literature', 'Literature']);
  const all = await getResources();
  const items = all.filter((r) => !r.category || !LIT_CATEGORIES.has(r.category));
  // NEW = position 0 in the (created_at DESC)-ordered "undated" view.
  // Our query orders pinned-first then sort_order, so we re-sort a shadow
  // copy by created_at DESC for the NEW flag specifically.
  const byCreated = [...items].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const newestId = byCreated[0]?.id;
  const newCount = items.filter((_, i) => isNewUndatedByIndex(i) && items[i].id === newestId).length;

  return (
    <section className="h-full flex flex-col bg-white rounded-xl border border-[var(--color-border)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 overflow-hidden">
      <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-brand-faint text-brand flex items-center justify-center">
          <LinkIcon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <h2 className="text-[13px] font-semibold text-navy flex-1">Resources</h2>
        {newCount > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-light text-pink-dark">
            {newCount} NEW
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 text-center">
          <LinkIcon className="w-7 h-7 text-[var(--color-text-muted)] opacity-40 mb-2" strokeWidth={1.5} />
          <div className="text-[12px] text-[var(--color-text-secondary)] font-medium">No resources yet</div>
        </div>
      ) : (
        <ul className="flex-1 card-scroll px-2 py-2">
          {items.map((r) => {
            const isNew = r.id === newestId;
            return (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[var(--color-bg)] transition-colors group ${isNew ? 'is-new-row' : ''}`}
                >
                  <div className="w-7 h-7 rounded-md bg-brand-faint text-brand flex items-center justify-center text-[14px] shrink-0 overflow-hidden">
                    {r.icon && /^https?:\/\//.test(r.icon) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.icon} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{r.icon || '🔗'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[12px] font-medium text-navy leading-tight truncate">{r.name}</div>
                      {isNew && <span className="new-dot" aria-label="new" />}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] leading-tight truncate">{r.category || r.description || ''}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-[var(--color-text-muted)] opacity-40 group-hover:opacity-90 shrink-0" strokeWidth={1.75} />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
