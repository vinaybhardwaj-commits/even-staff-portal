import { AppLayout } from '@/components/AppLayout';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Contacts · Even Staff Portal' };

export default function Page() {
  return (
    <AppLayout title="Contacts">
      <ComingSoon title="Contacts" sprint="SP.5" body="Full directory of hospital contacts, pinned-first then alpha. The Home Quick Contacts card pulls from the same source." />
    </AppLayout>
  );
}
