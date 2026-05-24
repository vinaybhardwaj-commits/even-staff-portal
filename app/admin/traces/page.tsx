import { AdminTracesClient } from './admin-traces-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Traces' };

export default function Page() {
  const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';
  return (
    <AdminPageChrome title="Traces (forensic)">
      <AdminTracesClient adminToken={process.env.ADMIN_TOKEN || ''} basePath={adminBasePath} />
    </AdminPageChrome>
  );
}
