'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Megaphone, Calculator, Bell, Menu, X, Tv, Phone, Link as LinkIcon, FlaskConical,
  MessageCircle, Sparkles, Pill, Brain, BookOpen, Building2, Activity, FileText, ExternalLink } from 'lucide-react';

// 5 primary items per PRD §4.2
const PRIMARY = [
  { label: 'Home',     href: '/',             icon: Home },
  { label: 'Bulletin', href: '/bulletin',     icon: Megaphone },
  { label: 'Calc',     href: '/calculators',  icon: Calculator },
  { label: 'Sewa',     href: '/sewa',         icon: Bell },
];

// Menu items — everything else, grouped by section
const MENU_GROUPS = [
  { label: 'HOSPITAL SYSTEMS', items: [
    { label: 'KareXpert', href: 'https://even.karexpert.com/account-management/login', icon: Building2, external: true },
    { label: 'Pulse',     href: 'https://pulse.even.in/',                              icon: Activity,  external: true },
    { label: 'Chart',     href: 'https://chart.even.in/',                              icon: FileText,  external: true },
  ]},
  { label: 'WORKSPACE', items: [
    { label: 'Videos',     href: '/videos',    icon: Tv,           external: false },
    { label: 'Contacts',   href: '/contacts',  icon: Phone,        external: false },
    { label: 'Resources',  href: '/resources', icon: LinkIcon,     external: false },
    { label: 'Pilot apps', href: '/pilot',     icon: FlaskConical, external: false },
  ]},
  { label: 'CLINICAL TOOLS', items: [
    { label: 'Ask',    href: '/ask',    icon: MessageCircle, external: false },
    { label: 'DDx',    href: '/ddx',    icon: Sparkles,      external: false },
    { label: 'Drugs',  href: '/drugs',  icon: Pill,          external: false },
    { label: 'Coach',  href: '/coach',  icon: Brain,         external: false },
    { label: 'Review', href: '/review', icon: BookOpen,      external: false },
  ]},
];

export function BottomBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--color-border)] flex items-center justify-around safe-bottom shadow-[0_-2px_8px_rgba(0,32,84,0.04)]">
        {PRIMARY.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href));
          return (
            <Link key={it.label} href={it.href}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] ${active ? 'text-brand' : 'text-[var(--color-text-muted)]'}`}>
              <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
              <span className="text-[10px] mt-0.5 font-medium">{it.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center justify-center py-2 px-3 min-w-[64px] text-[var(--color-text-muted)]">
          <Menu className="w-5 h-5" strokeWidth={1.75} />
          <span className="text-[10px] mt-0.5 font-medium">Menu</span>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col" onClick={() => setMenuOpen(false)}>
          <div className="flex-1 bg-black/40" />
          <div className="bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] sticky top-0 bg-white">
              <h2 className="text-[14px] font-semibold text-navy">Menu</h2>
              <button onClick={() => setMenuOpen(false)} className="text-[var(--color-text-muted)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="py-3">
              {MENU_GROUPS.map((g) => (
                <div key={g.label} className="px-3 mb-3">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{g.label}</div>
                  <ul>
                    {g.items.map((item) => {
                      const Icon = item.icon;
                      const Container = item.external ? 'a' : Link;
                      const props = item.external
                        ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                        : { href: item.href };
                      return (
                        <li key={item.label}>
                          <Container {...(props as { href: string })} onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 text-[14px] text-navy hover:bg-[var(--color-bg)] rounded-lg">
                            <Icon className="w-5 h-5 text-[var(--color-text-muted)]" strokeWidth={1.75} />
                            <span className="flex-1">{item.label}</span>
                            {item.external && <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-50" />}
                          </Container>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
