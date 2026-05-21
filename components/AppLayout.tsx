/**
 * Unified app shell — sidebar (desktop) + header + main.
 *
 * Per PRD §4. Mobile bottom bar lands in SP.1.3 with the rest of the
 * mobile-specific tweaks.
 */
import { Sidebar } from './Sidebar';
import { PortalHeader } from './PortalHeader';

export function AppLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader title={title} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
