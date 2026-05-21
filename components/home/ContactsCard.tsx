import { Phone } from 'lucide-react';
import { getContacts } from '@/lib/portal/reads';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
function colorFromName(name: string): string {
  // Deterministic palette pick — 6 muted brand-friendly tints
  const palette = ['bg-brand-faint text-brand', 'bg-pink-light text-pink-dark', 'bg-navy/10 text-navy', 'bg-amber-50 text-amber-700', 'bg-emerald-50 text-emerald-700', 'bg-violet-50 text-violet-700'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export async function ContactsCard() {
  const items = await getContacts();

  return (
    <section className="h-full flex flex-col bg-white rounded-xl border border-[var(--color-border)] hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 overflow-hidden">
      <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-pink-light text-pink-dark flex items-center justify-center">
          <Phone className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <h2 className="text-[13px] font-semibold text-navy">Quick Contacts</h2>
      </header>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 text-center">
          <Phone className="w-7 h-7 text-[var(--color-text-muted)] opacity-40 mb-2" strokeWidth={1.5} />
          <div className="text-[12px] text-[var(--color-text-secondary)] font-medium">No contacts yet</div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Admin will add staff directory entries</div>
        </div>
      ) : (
        <ul className="flex-1 card-scroll px-2 py-2">
          {items.map((c) => {
            const tel = c.phone || c.extension;
            const Cell = tel ? 'a' : 'div';
            const cellProps = tel ? { href: `tel:${tel}` } : {};
            return (
              <li key={c.id}>
                <Cell {...cellProps} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[var(--color-bg)] transition-colors">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 ${colorFromName(c.name)}`}>
                    {initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-navy leading-tight truncate">{c.name}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] leading-tight truncate">
                      {[c.role, c.department].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {tel && (
                    <div className="text-[11px] font-medium text-brand tabular-nums shrink-0">{tel}</div>
                  )}
                </Cell>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
