import { AdminAnnouncementsClient } from './admin-announcements-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Announcements' };

export default function Page() {
  return (
    <AdminPageChrome title="Announcements">
      <AdminAnnouncementsClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
