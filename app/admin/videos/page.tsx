import { AdminVideosClient } from './admin-videos-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Videos · Even Staff Portal' };

export default function AdminVideosPage() {
  const adminToken = process.env.ADMIN_TOKEN || '';
  const basePath = process.env.ADMIN_BASE_PATH || '';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-md bg-pink text-white flex items-center justify-center text-sm font-medium">A</div>
          <div className="flex-1">
            <div className="text-[11px] text-pink-dark uppercase tracking-wide font-semibold">Even Admin · Restricted</div>
            <h1 className="text-[18px] font-semibold text-navy leading-tight">Videos</h1>
          </div>
          <Link href={basePath ? `/${basePath}/` : '/'} className="text-[11px] text-[var(--color-text-muted)] hover:text-brand">
            ← Admin home
          </Link>
        </div>

        <AdminVideosClient adminToken={adminToken} />
      </div>
    </div>
  );
}
