import { Sidebar } from './Sidebar';
import { PortalHeader } from './PortalHeader';
import type { HomeLayoutSettings } from '@/lib/portal/settings';

export function AppLayout({ children, title, settings }: { children: React.ReactNode; title?: string; settings?: HomeLayoutSettings }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader title={title} hideCmdK={!!settings?.kills.cmd_k} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
