'use client';
/**
 * v1.3 P1: full public /contacts directory.
 *
 * Search + grouped-by-department + tap-to-call links.
 */
import { useMemo, useState } from 'react';
import { Phone, Mail, Search, Pin } from 'lucide-react';

type Contact = {
  id: number | string;
  name: string;
  role: string | null;
  department: string | null;
  extension: string | null;
  phone: string | null;
  email: string | null;
  pinned: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}
function colorFromName(name: string): string {
  const palette = ['bg-brand-faint text-brand', 'bg-pink-light text-pink-dark', 'bg-navy/10 text-navy', 'bg-amber-50 text-amber-700', 'bg-emerald-50 text-emerald-700', 'bg-violet-50 text-violet-700'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function ContactsListClient({ initialContacts }: { initialContacts: Contact[] }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return initialContacts;
    return initialContacts.filter((c) =>
      c.name.toLowerCase().includes(ql) ||
      (c.role || '').toLowerCase().includes(ql) ||
      (c.department || '').toLowerCase().includes(ql) ||
      (c.extension || '').includes(ql) ||
      (c.phone || '').includes(ql) ||
      (c.email || '').toLowerCase().includes(ql),
    );
  }, [initialContacts, q]);

  // Group by department, then sort: pinned first within each, then alpha
  const grouped = useMemo(() => {
    const groups = new Map<string, Contact[]>();
    for (const c of filtered) {
      const dept = c.department || 'Other';
      if (!groups.has(dept)) groups.set(dept, []);
      groups.get(dept)!.push(c);
    }
    const sorted = Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    });
    return sorted.map(([dept, list]) => [
      dept,
      list.sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || a.name.localeCompare(b.name)),
    ] as [string, Contact[]]);
  }, [filtered]);

  return (
    <>
      <label className="relative block mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" strokeWidth={1.75} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, role, department, number…"
          className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-[var(--color-border)] rounded-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
          <div className="text-[13px] text-[var(--color-text-secondary)]">No contacts match.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dept, list]) => (
            <section key={dept} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
              <header className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/40">
                <h2 className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">{dept}</h2>
              </header>
              <ul>
                {list.map((c) => {
                  const tel = c.phone || c.extension;
                  return (
                    <li key={c.id} className="px-4 py-2.5 border-b border-[var(--color-border)] last:border-b-0 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 ${colorFromName(c.name)}`}>
                        {initials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-navy leading-tight flex items-center gap-1.5">
                          {c.name}
                          {c.pinned && <Pin className="w-3 h-3 text-[var(--color-text-muted)]" />}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] leading-tight">
                          {c.role || ' '}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {tel && (
                          <a href={`tel:${tel}`} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand tabular-nums hover:text-brand-dark">
                            <Phone className="w-3.5 h-3.5" /> {tel}
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-brand max-w-[200px] truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{c.email}</span>
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
