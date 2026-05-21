import { AdminSewaDetailClient } from './admin-sewa-detail-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Sewa · Complaint' };

export default async function AdminSewaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isFinite(n) || n <= 0) notFound();
  return (
    <AdminPageChrome title="Sewa complaint">
      <AdminSewaDetailClient adminToken={process.env.ADMIN_TOKEN || ''} complaintId={n} />
    </AdminPageChrome>
  );
}
