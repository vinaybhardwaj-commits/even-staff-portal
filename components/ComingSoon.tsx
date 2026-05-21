/**
 * Placeholder for sprint-deferred routes. Renders inside <AppLayout>.
 * Mentions which sprint ships the real surface so V (and any staff who
 * click in) know it's intentional, not broken.
 */
import { Sparkles } from 'lucide-react';

export function ComingSoon({ title, sprint, body }: { title: string; sprint: string; body?: string }) {
  return (
    <div className="px-6 py-12 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-10 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-brand-faint text-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-xl font-semibold text-navy">{title}</div>
            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide font-medium">Ships in {sprint}</div>
          </div>
        </div>
        {body && <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{body}</p>}
        <div className="mt-6 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
          The sidebar nav is wired so the route exists. The page renders here when {sprint} lands.
        </div>
      </div>
    </div>
  );
}
