import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  accent?: 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' | 'violet';
  id?: string;
}

const accents = {
  indigo: { border: 'border-indigo-500/20', icon: 'bg-indigo-500/10 text-indigo-400', glow: 'hover:shadow-indigo-500/10' },
  amber:  { border: 'border-amber-500/20',  icon: 'bg-amber-500/10 text-amber-400',   glow: 'hover:shadow-amber-500/10' },
  emerald:{ border: 'border-emerald-500/20',icon: 'bg-emerald-500/10 text-emerald-400',glow: 'hover:shadow-emerald-500/10' },
  rose:   { border: 'border-rose-500/20',   icon: 'bg-rose-500/10 text-rose-400',     glow: 'hover:shadow-rose-500/10' },
  sky:    { border: 'border-sky-500/20',    icon: 'bg-sky-500/10 text-sky-400',       glow: 'hover:shadow-sky-500/10' },
  violet: { border: 'border-violet-500/20', icon: 'bg-violet-500/10 text-violet-400', glow: 'hover:shadow-violet-500/10' },
};

export function StatCard({ label, value, icon, trend, accent = 'indigo', id }: StatCardProps) {
  const a = accents[accent];
  return (
    <div id={id} className={cn(
      'glass rounded-xl p-5 border card-hover transition-shadow',
      a.border, a.glow
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1.5', trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-xl', a.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
