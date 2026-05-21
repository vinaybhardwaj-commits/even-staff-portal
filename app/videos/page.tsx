import { AppLayout } from '@/components/AppLayout';
import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Videos · Even Staff Portal' };

export default function Page() {
  return (
    <AppLayout title="Videos">
      <ComingSoon title="Videos" sprint="SP.4" body="Library of admin-uploaded MP4s and YouTube embeds. One video at a time gets featured on Home; the rest live here for archive browsing." />
    </AppLayout>
  );
}
