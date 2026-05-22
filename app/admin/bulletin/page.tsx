import { AdminBulletinClient } from './admin-bulletin-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';
import { Compose } from '@/components/bulletin/Compose';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Bulletin moderation' };

export default function Page() {
  return (
    <AdminPageChrome title="Bulletin moderation">
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2 font-medium">Add a new post</div>
        <Compose />
      </div>
      <AdminBulletinClient adminToken={process.env.ADMIN_TOKEN || ''} basePath={process.env.ADMIN_BASE_PATH || 'admin'} />
    </AdminPageChrome>
  );
}
