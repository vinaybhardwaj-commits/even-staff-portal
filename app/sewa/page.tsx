import { AppLayout } from '@/components/AppLayout';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Sewa — Staff complaints + incidents · Even Staff Portal' };

export default function Page() {
  return (
    <AppLayout title="Sewa — Staff complaints + incidents">
      <ComingSoon title="Sewa — Staff complaints + incidents" sprint="SP.6" body="Raise a complaint (equipment, supply, process, safety, interpersonal, other) and track your past complaints. Per locked decision #25." />
    </AppLayout>
  );
}
