import { TraceDetailClient } from './trace-detail-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Trace' };

export default async function Page({ params }: { params: Promise<{ trace_id: string }> }) {
  const { trace_id } = await params;
  const adminBasePath = process.env.ADMIN_BASE_PATH || 'admin';
  return (
    <AdminPageChrome title="Trace forensic">
      <TraceDetailClient
        traceId={trace_id}
        adminToken={process.env.ADMIN_TOKEN || ''}
        basePath={adminBasePath}
      />
    </AdminPageChrome>
  );
}
