const SEV_STYLE: Record<string, string> = {
  low:      'bg-emerald-50 text-emerald-700',
  medium:   'bg-amber-50 text-amber-700',
  high:     'bg-orange-50 text-orange-700',
  critical: 'bg-pink-light text-pink-dark',
};
const SEV_LABEL: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};

export function SeverityBadge({ severity }: { severity: string }) {
  const style = SEV_STYLE[severity] || SEV_STYLE.medium;
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style}`}>
      {SEV_LABEL[severity] || severity}
    </span>
  );
}
