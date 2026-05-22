import { AdminSettingsClient } from './admin-settings-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Settings' };

export default function Page() {
  return (
    <AdminPageChrome title="Settings">
      <AdminSettingsClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
