import { AppLayout } from '@/components/AppLayout';
import { listComplaintTypes, getFieldsForType, getResolutionsForType } from '@/lib/portal/sewa-reads';
import { SewaClient } from './sewa-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = { title: 'Sewa · Even Staff Portal' };

export default async function SewaPage() {
  const types = await listComplaintTypes();
  const enriched = await Promise.all(types.map(async (t) => {
    const [fields, resolutions] = await Promise.all([
      getFieldsForType(Number(t.id)),
      getResolutionsForType(Number(t.id)),
    ]);
    return { ...t, fields, resolutions };
  }));

  return (
    <AppLayout title="Sewa">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="mb-4">
          <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug">
            Raise an operational issue — equipment fault, supply shortage, process problem, safety incident.
            Routed to admin for triage. Anonymous by default.
          </p>
        </div>
        {/* @ts-expect-error — SewaClient accepts the enriched type shape */}
        <SewaClient initialTypes={enriched} />
      </div>
    </AppLayout>
  );
}
