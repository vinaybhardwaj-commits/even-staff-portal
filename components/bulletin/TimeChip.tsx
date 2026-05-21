'use client';
import { useEffect, useState } from 'react';
import { relativeTime, absoluteTime } from '@/lib/portal/time';

export function TimeChip({ iso }: { iso: string }) {
  const [, force] = useState(0);
  // Re-render every 60s so "3m ago" stays accurate.
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <time dateTime={iso} title={absoluteTime(iso)} className="text-[10px] text-[var(--color-text-muted)]">
      {relativeTime(iso)}
    </time>
  );
}
