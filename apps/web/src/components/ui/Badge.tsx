import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'indigo' | 'amber' | 'rose' | 'emerald' | 'sky' | 'violet';
  className?: string;
}

const variants = {
  default: 'bg-white/5 text-[var(--text-secondary)] border-white/10',
  indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant], className
    )}>
      {children}
    </span>
  );
}
