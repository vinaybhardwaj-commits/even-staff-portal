import { AdminContactsClient } from './admin-contacts-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Contacts' };

export default function Page() {
  return (
    <AdminPageChrome title="Contacts">
      <AdminContactsClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
