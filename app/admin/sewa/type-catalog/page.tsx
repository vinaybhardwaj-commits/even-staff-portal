import { TypeCatalogClient } from './type-catalog-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Sewa type catalog' };

export default function TypeCatalogPage() {
  return (
    <AdminPageChrome title="Sewa complaint-type catalog">
      <TypeCatalogClient adminToken={process.env.ADMIN_TOKEN || ''} />
    </AdminPageChrome>
  );
}
