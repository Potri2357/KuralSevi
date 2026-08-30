import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'chakra' | 'saffron' | 'green' | 'primary' | 'secondary' | 'indigo' | 'amber' | 'rose' | 'emerald' | 'sky' | 'violet' | 'blue';
  className?: string;
}

const variants = {
  // Core 3-Color Minimal Palette
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  chakra: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
  primary: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
  blue: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
  sky: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
  indigo: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',

  saffron: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',
  secondary: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',
  amber: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',
  rose: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',
  violet: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',

  green: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]',
  success: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]',
  emerald: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border leading-none tracking-wide shadow-2xs',
      variants[variant] || variants.default, className
    )}>
      {children}
    </span>
  );
}
