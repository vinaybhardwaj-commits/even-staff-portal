import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function AdminPageChrome({ title, children }: { title: string; children: React.ReactNode }) {
  const basePath = process.env.ADMIN_BASE_PATH || '';
  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-md bg-pink text-white flex items-center justify-center text-sm font-medium">A</div>
          <div className="flex-1">
            <div className="text-[11px] text-pink-dark uppercase tracking-wide font-semibold">Even Admin · Restricted</div>
            <h1 className="text-[18px] font-semibold text-navy leading-tight">{title}</h1>
          </div>
          <Link href={basePath ? `/${basePath}/` : '/'} className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-brand">
            <ArrowLeft className="w-3.5 h-3.5" /> Admin home
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
