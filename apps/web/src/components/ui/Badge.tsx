import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'chakra' | 'saffron' | 'green' | 'primary' | 'secondary' | 'indigo' | 'amber' | 'rose' | 'emerald' | 'sky' | 'violet' | 'blue';
  className?: string;
}

const variants = {
  // Core 3-Color Minimal Palette with Glassmorphism
  default: 'bg-slate-100/90 text-slate-700 border-slate-200/90 shadow-2xs backdrop-blur-xs',
  chakra: 'bg-[#EAF1FB]/90 text-[#0B3064] border-[#BACEEB] shadow-[0_2px_8px_-1px_rgba(11,48,100,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  primary: 'bg-[#EAF1FB]/90 text-[#0B3064] border-[#BACEEB] shadow-[0_2px_8px_-1px_rgba(11,48,100,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  blue: 'bg-[#EAF1FB]/90 text-[#0B3064] border-[#BACEEB] shadow-[0_2px_8px_-1px_rgba(11,48,100,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  sky: 'bg-[#EAF1FB]/90 text-[#0B3064] border-[#BACEEB] shadow-[0_2px_8px_-1px_rgba(11,48,100,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  indigo: 'bg-[#EAF1FB]/90 text-[#0B3064] border-[#BACEEB] shadow-[0_2px_8px_-1px_rgba(11,48,100,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',

  saffron: 'bg-[#FFF4ED]/90 text-[#C24810] border-[#FDD8C2] shadow-[0_2px_8px_-1px_rgba(224,90,27,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  secondary: 'bg-[#FFF4ED]/90 text-[#C24810] border-[#FDD8C2] shadow-[0_2px_8px_-1px_rgba(224,90,27,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  amber: 'bg-[#FFF4ED]/90 text-[#C24810] border-[#FDD8C2] shadow-[0_2px_8px_-1px_rgba(224,90,27,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  rose: 'bg-rose-50/90 text-rose-700 border-rose-200/90 shadow-[0_2px_8px_-1px_rgba(225,29,72,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  violet: 'bg-violet-50/90 text-violet-700 border-violet-200/90 shadow-[0_2px_8px_-1px_rgba(124,58,237,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',

  green: 'bg-[#EDF9F1]/90 text-[#0A783C] border-[#BBE8CB] shadow-[0_2px_8px_-1px_rgba(10,120,60,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  success: 'bg-[#EDF9F1]/90 text-[#0A783C] border-[#BBE8CB] shadow-[0_2px_8px_-1px_rgba(10,120,60,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
  emerald: 'bg-[#EDF9F1]/90 text-[#0A783C] border-[#BBE8CB] shadow-[0_2px_8px_-1px_rgba(10,120,60,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xs',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border leading-none tracking-wide transition-all',
      variants[variant] || variants.default, className
    )}>
      {children}
    </span>
  );
}
