import { AppLayout } from '@/components/AppLayout';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Resources · Even Staff Portal' };

export default function Page() {
  return (
    <AppLayout title="Resources">
      <ComingSoon title="Resources" sprint="SP.5" body="Admin-managed link library. KareXpert, Pulse, Chart, UpToDate, Cureus, and anything else V adds. The Home Resources card pulls from the same source." />
    </AppLayout>
  );
}
