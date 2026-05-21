const STATUS_STYLE: Record<string, string> = {
  open:        'bg-brand-faint text-brand-dark',
  ack:         'bg-amber-50 text-amber-700',
  in_progress: 'bg-violet-50 text-violet-700',
  resolved:    'bg-emerald-50 text-emerald-700',
  wont_fix:    'bg-navy/10 text-navy',
};
const STATUS_LABEL: Record<string, string> = {
  open: 'Open', ack: 'Acknowledged', in_progress: 'In progress', resolved: 'Resolved', wont_fix: "Won't fix",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.open;
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
