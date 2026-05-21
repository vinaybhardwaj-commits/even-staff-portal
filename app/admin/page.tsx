// Placeholder admin landing — only reachable via the hidden ADMIN_BASE_PATH per middleware.ts.
// Real admin surface ships in SP.7.
export default function AdminLanding() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-[var(--color-border)] p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-pink text-white flex items-center justify-center text-sm font-medium">A</div>
          <div>
            <div className="text-lg font-medium text-navy">Even Admin</div>
            <div className="text-xs text-pink uppercase tracking-wide font-medium">Restricted</div>
          </div>
        </div>
        <h1 className="text-xl font-medium text-navy mb-2">Admin landing — SP.0 placeholder</h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          You reached the hidden admin URL. Full admin CMS ships in SP.7 (announcements, videos, contacts, resources, pilot apps, bulletin moderation, Sewa complaints, settings, audit log).
        </p>
        <div className="mt-6 text-xs text-[var(--color-text-muted)]">
          Middleware verified: <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded">ADMIN_BASE_PATH</code> matched.
        </div>
      </div>
    </main>
  );
}
