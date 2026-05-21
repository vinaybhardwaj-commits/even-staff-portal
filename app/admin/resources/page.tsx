import { AdminResourcesClient } from './admin-resources-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Resources · Even Staff Portal' };
export default function AdminResourcesPage() {
  return (
    <AdminPageChrome title="Resources">
      <AdminResourcesClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
