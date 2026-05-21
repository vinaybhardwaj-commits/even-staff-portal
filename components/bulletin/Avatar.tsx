import { initialsOf, colorFromName } from '@/lib/portal/identity';

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = colorFromName(name);
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-[14px]' : 'w-8 h-8 text-[11px]';
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{ backgroundColor: c.bg, color: c.fg }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}
