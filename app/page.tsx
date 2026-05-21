import { AppLayout } from '@/components/AppLayout';

export default function Home() {
  // SP.1.2 scaffold — six grid cells, structure only. SP.1.3 wires real
  // data reads (announcements, video, sewa CTA, lit, contacts, resources).
  const cells: { title: string; ships: string }[] = [
    { title: 'Hospital Updates & Announcements', ships: 'SP.1.3' },
    { title: 'Video player',                     ships: 'SP.1.3' },
    { title: 'Sewa · Raise a complaint',         ships: 'SP.1.3' },
    { title: 'Medical Literature',               ships: 'SP.1.3' },
    { title: 'Quick Contacts',                   ships: 'SP.1.3' },
    { title: 'Resources',                        ships: 'SP.1.3' },
  ];

  return (
    <AppLayout>
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-[1280px] mx-auto">
          {cells.map((c) => (
            <div
              key={c.title}
              className="h-[240px] bg-white rounded-xl border border-[var(--color-border)] p-4 hover:shadow-card hover:-translate-y-0.5 transition-all duration-150 flex flex-col"
            >
              <div className="text-[13px] font-medium text-navy">{c.title}</div>
              <div className="mt-auto text-[11px] text-[var(--color-text-muted)]">Card body ships in {c.ships}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center text-[11px] text-[var(--color-text-muted)]">
          portal v1 · SP.1.2 shipped · build {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'}
        </div>
      </div>
    </AppLayout>
  );
}
