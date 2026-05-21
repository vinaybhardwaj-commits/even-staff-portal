import { AppLayout } from '@/components/AppLayout';
import { UpdatesCard } from '@/components/home/UpdatesCard';
import { VideoCard } from '@/components/home/VideoCard';
import { SewaCard } from '@/components/home/SewaCard';
import { LiteratureCard } from '@/components/home/LiteratureCard';
import { ContactsCard } from '@/components/home/ContactsCard';
import { ResourcesCard } from '@/components/home/ResourcesCard';
import { Suspense } from 'react';

// Disable static caching — cards should render with fresh data on every load.
// Per PRD §17.2: home cards may auto-refresh later via app_settings.refresh_interval.
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

export default function Home() {
  return (
    <AppLayout>
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-[1400px] mx-auto auto-rows-[260px]">
          <Suspense fallback={<CardSkeleton />}><UpdatesCard /></Suspense>
          <Suspense fallback={<CardSkeleton />}><VideoCard /></Suspense>
          <Suspense fallback={<CardSkeleton />}><SewaCard /></Suspense>
          <Suspense fallback={<CardSkeleton />}><LiteratureCard /></Suspense>
          <Suspense fallback={<CardSkeleton />}><ContactsCard /></Suspense>
          <Suspense fallback={<CardSkeleton />}><ResourcesCard /></Suspense>
        </div>
        <div className="mt-4 text-center text-[10px] text-[var(--color-text-muted)]">
          portal v1 · SP.1.3 shipped · © Even Healthcare · Internal Use Only
        </div>
      </div>
    </AppLayout>
  );
}
