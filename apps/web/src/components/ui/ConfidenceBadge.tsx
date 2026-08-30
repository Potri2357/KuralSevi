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
      'inline-flex items-center gap-1.5 font-semibold rounded-full border',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs',
      colors
    )}>
      <span className={cn(
        'rounded-full',
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
        label === 'high' ? 'bg-emerald-400' :
        label === 'medium' ? 'bg-amber-400' : 'bg-rose-400'
      )} />
      {text}
    </span>
  );
}
