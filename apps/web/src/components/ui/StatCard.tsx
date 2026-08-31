import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MotionGraph, type DataPoint } from './MotionGraph';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  accent?: 'chakra' | 'saffron' | 'green' | 'blue' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'danger' | 'sky' | 'violet' | 'neutral';
  id?: string;
  sparkline?: number[] | DataPoint[];
  unit?: string;
}

const accents = {
  // Primary: Ashok Chakra Blue
  chakra:  { border: 'border-slate-200/80 hover:border-[#BACEEB]', icon: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]', motion: 'chakra' as const },
  blue:    { border: 'border-slate-200/80 hover:border-[#BACEEB]', icon: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]', motion: 'chakra' as const },
  indigo:  { border: 'border-slate-200/80 hover:border-[#BACEEB]', icon: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]', motion: 'chakra' as const },
  sky:     { border: 'border-slate-200/80 hover:border-[#BACEEB]', icon: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]', motion: 'chakra' as const },

  // Secondary: Saffron
  saffron: { border: 'border-slate-200/80 hover:border-[#FDD8C2]', icon: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]', motion: 'saffron' as const },

  // Alert / Breach / Rose Red
  rose:    { border: 'border-slate-200/80 hover:border-rose-300', icon: 'bg-rose-50 text-rose-600 border-rose-200', motion: 'rose' as const },
  danger:  { border: 'border-slate-200/80 hover:border-rose-300', icon: 'bg-rose-50 text-rose-600 border-rose-200', motion: 'rose' as const },

  // Warning / Amber
  amber:   { border: 'border-slate-200/80 hover:border-amber-300', icon: 'bg-amber-50 text-amber-700 border-amber-200', motion: 'amber' as const },

  // Purple / Violet
  violet:  { border: 'border-slate-200/80 hover:border-violet-300', icon: 'bg-violet-50 text-violet-600 border-violet-200', motion: 'chakra' as const },

  // Tertiary: Green (Confirmed / Success)
  green:   { border: 'border-slate-200/80 hover:border-[#BBE8CB]', icon: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]', motion: 'green' as const },
  emerald: { border: 'border-slate-200/80 hover:border-[#BBE8CB]', icon: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]', motion: 'green' as const },

  // Neutral
  neutral: { border: 'border-slate-200/80 hover:border-slate-300', icon: 'bg-slate-100 text-slate-700 border-slate-200', motion: 'neutral' as const },
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  accent = 'chakra',
  id,
  sparkline,
  unit,
}: StatCardProps) {
  const a = accents[accent] || accents.chakra;

  return (
    <div
      id={id}
      className={cn(
        'bg-white/88 backdrop-blur-md rounded-2xl p-4 sm:p-5 border shadow-[0_4px_20px_-2px_rgba(11,48,100,0.04),0_1px_3px_0_rgba(11,48,100,0.03)] ring-1 ring-white/70 hover:-translate-y-1 hover:shadow-[0_14px_28px_-6px_rgba(11,48,100,0.09),0_6px_12px_-4px_rgba(11,48,100,0.04)] active:scale-[0.98] transition-all duration-200 cursor-pointer group flex flex-col justify-between overflow-hidden',
        a.border
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] sm:text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1 whitespace-nowrap overflow-hidden text-ellipsis"
              title={label}
            >
              {label}
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-mono group-hover:text-[#0B3064] transition-colors">
              {value}
            </p>
          </div>
          {icon && (
            <div
              className={cn(
                'p-2 sm:p-2.5 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs group-hover:scale-105 transition-transform duration-200',
                a.icon
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <p
            className={cn(
              'text-[11px] sm:text-xs mb-3 font-bold flex items-center gap-1 whitespace-nowrap',
              trend.value >= 0 ? 'text-[#0A783C]' : 'text-[#C24810]'
            )}
          >
            {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>
              {Math.abs(trend.value)}% {trend.label}
            </span>
          </p>
        )}
      </div>

      {/* Motion Sparkline Graph (All animation & hover interaction strictly within graph container) */}
      {sparkline && (
        <div className="mt-2 pt-2 border-t border-slate-100/80 -mx-1">
          <MotionGraph
            data={sparkline}
            accent={a.motion}
            height={44}
            unit={unit}
          />
        </div>
      )}
    </div>
  );
}

