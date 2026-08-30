import { cn, confidenceColor, confidenceLabel } from '@/lib/utils';

interface Props {
  label: string;
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({ label, size = 'md' }: Props) {
  const colors = confidenceColor(label);
  const text = confidenceLabel(label);
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-bold rounded-md border tracking-wide shadow-2xs',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      colors
    )}>
      <span className={cn(
        'rounded-full shrink-0',
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
        label === 'high' ? 'bg-[#0B3064]' :
        label === 'needs_officer_review' ? 'bg-[#E05A1B]' : 'bg-slate-400'
      )} />
      {text}
    </span>
  );
}
