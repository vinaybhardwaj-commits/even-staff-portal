import { AdminBulletinDetailClient } from './admin-bulletin-detail-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Bulletin · Post' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) notFound();
  return (
    <AdminPageChrome title="Bulletin post">
      <AdminBulletinDetailClient adminToken={process.env.ADMIN_TOKEN || ''} postId={n} basePath={process.env.ADMIN_BASE_PATH || 'admin'} />
    </AdminPageChrome>
  );
}
