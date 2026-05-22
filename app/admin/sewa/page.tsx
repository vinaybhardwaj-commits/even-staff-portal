import { AdminSewaClient } from './admin-sewa-client';
import { AdminPageChrome } from '@/components/admin/AdminPageChrome';
import Link from 'next/link';
import { Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Sewa · Even Staff Portal' };

export default function AdminSewaPage() {
  const basePath = process.env.ADMIN_BASE_PATH || 'admin';
  return (
    <AdminPageChrome title="Sewa — staff complaints">
      <div className="mb-3 flex justify-end">
        <Link href={`/${basePath}/sewa/type-catalog`} className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-brand">
          <Settings className="w-3.5 h-3.5" /> Type catalog
        </Link>
      </div>
      <AdminSewaClient adminToken={process.env.ADMIN_TOKEN || ''} basePath={basePath} />
    </AdminPageChrome>
  );
}
