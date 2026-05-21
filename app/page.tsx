import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-6">
      <div className="max-w-xl w-full bg-white rounded-xl border border-[var(--color-border)] p-10 text-center shadow-card">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-brand text-white flex items-center justify-center text-xl font-medium">E</div>
          <div className="text-left">
            <div className="text-lg font-medium text-navy">Even Hospital</div>
            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Race Course Road</div>
          </div>
        </div>

        <h1 className="text-2xl font-medium text-navy mb-3">Staff Portal v1 — building</h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-8">
          The new portal is under active development per the v1 PRD. While we build, the existing static portal stays fully functional at the legacy link below.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/legacy.html"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition"
          >
            Open the current portal →
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
          SP.0 shipped · build {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'}
        </div>
      </div>
    </main>
  );
}
