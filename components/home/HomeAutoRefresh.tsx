'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function HomeAutoRefresh({ intervalSec }: { intervalSec: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!intervalSec) return;
    const t = setInterval(() => router.refresh(), intervalSec * 1000);
    return () => clearInterval(t);
  }, [intervalSec, router]);
  return null;
}
