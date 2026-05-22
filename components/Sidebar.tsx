'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { NAV_ITEMS, SECTION_LABELS, type NavSection } from '@/lib/portal/nav';

const SECTION_ORDER: NavSection[] = ['systems', 'workspace', 'clinical', 'operations'];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-[168px] lg:w-[196px] shrink-0 bg-white border-r border-[var(--color-border)] h-screen sticky top-0">
      {/* Brand header */}
      <Link href="/" className="block px-4 py-4 border-b border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">E</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-navy leading-tight truncate">Even Hospital</div>
            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide leading-tight">Race Course Road</div>
          </div>
        </div>
      </Link>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {SECTION_ORDER.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {SECTION_LABELS[section]}
              </div>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = !item.external && (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href));
                  const baseClass = 'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors group';
                  const stateClass = active
                    ? 'bg-brand-faint text-brand font-medium'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-navy';

                  if (item.external) {
                    // Hospital Systems items open in a new tab (external HIS apps).
                    // Clinical Tools also use external:false now (middleware-redirected internal paths).
                    return (
                      <li key={item.label}>
                        <a href={item.href} className={`${baseClass} ${stateClass}`} target="_blank" rel="noopener noreferrer">
                          <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                          <span className="truncate flex-1">{item.label}</span>
                          <ExternalLink className="w-3 h-3 opacity-40 shrink-0 group-hover:opacity-70" strokeWidth={1.75} />
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <Link href={item.href} className={`${baseClass} ${stateClass}`}>
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer slot */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]">
        Internal · v1.1
      </div>
    </aside>
  );
}
