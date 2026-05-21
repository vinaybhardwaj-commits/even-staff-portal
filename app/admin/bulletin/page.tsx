import { AdminBulletinClient } from './admin-bulletin-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Bulletin moderation' };

export default function Page() {
  return (
    <AdminPageChrome title="Bulletin moderation">
      <AdminBulletinClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
