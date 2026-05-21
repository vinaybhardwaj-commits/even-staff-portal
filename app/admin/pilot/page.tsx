import { AdminPilotClient } from './admin-pilot-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Pilot apps · Even Staff Portal' };
export default function AdminPilotPage() {
  return (
    <AdminPageChrome title="Pilot apps">
      <AdminPilotClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
