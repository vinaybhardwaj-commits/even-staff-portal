const CATEGORY_STYLE: Record<string, string> = {
  clinical: 'bg-pink-light text-pink-dark',
  ops:      'bg-brand-faint text-brand-dark',
  social:   'bg-emerald-50 text-emerald-700',
  general:  'bg-navy/5 text-navy',
};
const CATEGORY_LABEL: Record<string, string> = {
  clinical: 'Clinical',
  ops:      'Ops',
  social:   'Social',
  general:  'General',
};

export function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLE[category] || CATEGORY_STYLE.general;
  const label = CATEGORY_LABEL[category] || category;
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${style}`}>
      {label}
    </span>
  );
}
