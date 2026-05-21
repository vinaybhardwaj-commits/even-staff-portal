import Link from 'next/link';
import { Tv, Settings, Pin, MessageSquare, Phone, Link as LinkIcon, FlaskConical, Bell } from 'lucide-react';

export const metadata = { title: 'Even Admin · Restricted' };

const SECTIONS: { href: string; label: string; icon: typeof Tv; status: 'live' | 'sprint' }[] = [
  { href: '/admin/videos',    label: 'Videos',        icon: Tv,            status: 'live' },
  { href: '/admin/resources', label: 'Resources',     icon: LinkIcon,      status: 'live' },
  { href: '/admin/pilot',     label: 'Pilot apps',    icon: FlaskConical,  status: 'live' },
  { href: '#',                label: 'Bulletin',      icon: MessageSquare, status: 'sprint' },
  { href: '#',                label: 'Announcements', icon: Pin,           status: 'sprint' },
  { href: '#',                label: 'Contacts',      icon: Phone,         status: 'sprint' },
  { href: '#',                label: 'Sewa',          icon: Bell,          status: 'sprint' },
  { href: '#',                label: 'Settings',      icon: Settings,      status: 'sprint' },
];

export default function AdminLanding() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-pink text-white flex items-center justify-center text-base font-medium">A</div>
          <div>
            <div className="text-lg font-semibold text-navy">Even Admin</div>
            <div className="text-xs text-pink uppercase tracking-wide font-medium">Restricted</div>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
          You reached the hidden admin URL. Live admin surfaces below; remaining ship in SP.7.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const live = s.status === 'live';
            const Container = live ? Link : 'div';
            const props = live ? { href: s.href } : {};
            return (
              <Container
                key={s.label}
                {...(props as { href: string })}
                className={`block bg-white rounded-xl border border-[var(--color-border)] p-4 ${
                  live ? 'hover:border-brand hover:shadow-card hover:-translate-y-0.5 transition-all' : 'opacity-60'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${live ? 'text-brand' : 'text-[var(--color-text-muted)]'}`} strokeWidth={1.75} />
                <div className="text-[13px] font-medium text-navy">{s.label}</div>
                <div className={`text-[10px] uppercase tracking-wide ${live ? 'text-brand' : 'text-[var(--color-text-muted)]'}`}>
                  {live ? 'Live' : 'SP.7'}
                </div>
              </Container>
            );
          })}
        </div>

        <div className="mt-8 text-xs text-[var(--color-text-muted)]">
          Middleware verified: <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded">ADMIN_BASE_PATH</code> matched.
        </div>
      </div>
    </main>
  );
}
