import { AppLayout } from '@/components/AppLayout';
import { listPilotApps } from '@/lib/portal/pilot-reads';
import { ExternalLink, FlaskConical } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = { title: 'Pilot apps · Even Staff Portal' };

const STATUS_STYLE: Record<string, string> = {
  alpha:  'bg-pink-light text-pink-dark',
  beta:   'bg-brand-faint text-brand-dark',
  live:   'bg-emerald-50 text-emerald-700',
  sunset: 'bg-navy/10 text-navy',
};
const STATUS_LABEL: Record<string, string> = {
  alpha: 'Alpha', beta: 'Beta', live: 'Live', sunset: 'Sunset',
};

export default async function PilotAppsPage() {
  const apps = await listPilotApps();

  return (
    <AppLayout title="Pilot apps">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {apps.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
            <FlaskConical className="w-12 h-12 text-[var(--color-text-muted)] opacity-40 mx-auto mb-3" strokeWidth={1.5} />
            <div className="text-[14px] font-medium text-navy mb-1">No pilot apps yet</div>
            <div className="text-[12px] text-[var(--color-text-secondary)]">Demonstration software ships here as we add it.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apps.map((p) => (
              <article key={p.id} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-brand/40 hover:shadow-card transition-all">
                {p.screenshot_url ? (
                  <div className="aspect-[16/9] bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.screenshot_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-gradient-to-br from-brand-faint to-pink-light flex items-center justify-center border-b border-[var(--color-border)]">
                    <FlaskConical className="w-12 h-12 text-brand opacity-50" strokeWidth={1.5} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_STYLE[p.status] || STATUS_STYLE.beta}`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                    {p.owner_name && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">by {p.owner_name}</span>
                    )}
                  </div>
                  <h2 className="text-[15px] font-semibold text-navy leading-snug mb-1">{p.name}</h2>
                  {p.description && (
                    <p className="text-[12px] text-[var(--color-text-secondary)] leading-snug mb-3 line-clamp-3">{p.description}</p>
                  )}
                  {p.long_description && (
                    <details className="mb-3 group">
                      <summary className="text-[11px] text-brand hover:text-brand-dark cursor-pointer select-none">
                        What this is for →
                      </summary>
                      <div className="mt-2 text-[11px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap border-l-2 border-brand-faint pl-3">
                        {p.long_description}
                      </div>
                    </details>
                  )}
                  <a
                    href={p.open_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark transition-colors"
                  >
                    Open <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
