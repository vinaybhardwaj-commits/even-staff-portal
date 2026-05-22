import { AdminAuditLogClient } from './admin-audit-log-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Audit log' };

export default function Page() {
  return (
    <AdminPageChrome title="Audit log">
      <AdminAuditLogClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
