import { AppLayout } from '@/components/AppLayout';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Pilot Apps · Even Staff Portal' };

export default function Page() {
  return (
    <AppLayout title="Pilot Apps">
      <ComingSoon title="Pilot Apps" sprint="SP.5" body="Showcase of demonstration software (OPD Encounter App first). Per-app card with status, screenshot, owner, and an Open link." />
    </AppLayout>
  );
}
