import { AppLayout } from '@/components/AppLayout';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Bulletin Board · Even Staff Portal' };

export default function Page() {
  return (
    <AppLayout title="Bulletin Board">
      <ComingSoon title="Bulletin Board" sprint="SP.3" body="A team feed for clinical / ops / social / general posts with nested comments and admin pin-or-hide. Building per locked decisions #5 and #15." />
    </AppLayout>
  );
}
