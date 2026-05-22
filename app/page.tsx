import { AppLayout } from '@/components/AppLayout';
import { UpdatesCard } from '@/components/home/UpdatesCard';
import { VideoCard } from '@/components/home/VideoCard';
import { SewaCard } from '@/components/home/SewaCard';
import { LiteratureCard } from '@/components/home/LiteratureCard';
import { ContactsCard } from '@/components/home/ContactsCard';
import { ResourcesCard } from '@/components/home/ResourcesCard';
import { Suspense } from 'react';
import { getHomeLayout, densityPaddingClass, type CardId } from '@/lib/portal/settings';
import { HomeAutoRefresh } from '@/components/home/HomeAutoRefresh';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function CardSkeleton() {
  return (
    <div className="h-full bg-white rounded-xl border border-[var(--color-border)] animate-pulse">
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-[var(--color-bg)]" />
        <div className="h-3 w-32 rounded bg-[var(--color-bg)]" />
      </div>
      <div className="p-4 space-y-2">
        <div className="h-2 w-full rounded bg-[var(--color-bg)]" />
        <div className="h-2 w-5/6 rounded bg-[var(--color-bg)]" />
        <div className="h-2 w-3/4 rounded bg-[var(--color-bg)]" />
      </div>
    </div>
  );
}

const CARD_RENDERERS: Record<CardId, () => React.ReactElement> = {
  updates:   () => <UpdatesCard />,
  video:     () => <VideoCard />,
  sewa:      () => <SewaCard />,
  lit:       () => <LiteratureCard />,
  contacts:  () => <ContactsCard />,
  resources: () => <ResourcesCard />,
};

export default async function Home() {
  const layout = await getHomeLayout();
  const cells = layout.cards.filter((c) => c.visible);
  const padding = densityPaddingClass(layout.density);
  const killNewPulseClass = layout.kills.new_pulse ? 'kill-new-pulse' : '';

  return (
    <AppLayout settings={layout}>
      <div className={`${padding} ${killNewPulseClass}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-[1400px] mx-auto auto-rows-[260px]">
          {cells.map((c) => {
            const Renderer = CARD_RENDERERS[c.id];
            return (
              <Suspense key={c.id} fallback={<CardSkeleton />}>
                <Renderer />
              </Suspense>
            );
          })}
        </div>
        <div className="mt-4 text-center text-[10px] text-[var(--color-text-muted)]">
          portal v1.1 · © Even Healthcare · Internal Use Only
        </div>
        {layout.refresh_interval_sec > 0 && <HomeAutoRefresh intervalSec={layout.refresh_interval_sec} />}
      </div>
    </AppLayout>
  );
}
