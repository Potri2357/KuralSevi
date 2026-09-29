import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'saffron' | 'glass' | 'neuro';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  // Primary: Deep Ashok Chakra Blue with top specular rim
  primary:
    'bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white font-bold shadow-[0_4px_14px_rgba(11,48,100,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] border border-[#0B3064] focus-visible:ring-2 focus-visible:ring-[#0B3064] focus-visible:outline-none',
  // Secondary: Minimalist Crisp White with tactile soft depth
  secondary:
    'bg-white/95 hover:bg-white text-slate-800 hover:text-slate-950 font-semibold border border-slate-200/90 shadow-[3px_3px_10px_rgba(11,48,100,0.06),-3px_-3px_10px_rgba(255,255,255,0.9),inset_0_1px_0_rgba(255,255,255,1)] focus-visible:ring-2 focus-visible:ring-[#0B3064] focus-visible:outline-none',
  // Saffron Action with top specular rim
  saffron:
    'bg-[#E05A1B] hover:bg-[#C24810] active:bg-[#A83C0A] text-white font-bold shadow-[0_4px_14px_rgba(224,90,27,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] border border-[#E05A1B] focus-visible:ring-2 focus-visible:ring-[#E05A1B] focus-visible:outline-none',
  // Danger / Reject: Dark Saffron / Brick
  danger:
    'bg-[#C24810] hover:bg-[#A83C0A] active:bg-[#8F3006] text-white font-bold shadow-[0_4px_14px_rgba(194,72,16,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] border border-[#C24810] focus-visible:ring-2 focus-visible:ring-[#C24810] focus-visible:outline-none',
  // Success: Confirmed Green
  success:
    'bg-[#0A783C] hover:bg-[#085C2E] active:bg-[#054320] text-white font-bold shadow-[0_4px_14px_rgba(10,120,60,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] border border-[#0A783C] focus-visible:ring-2 focus-visible:ring-[#0A783C] focus-visible:outline-none',
  // Glassmorphic translucent button
  glass:
    'bg-white/80 hover:bg-white/95 text-slate-800 font-bold backdrop-blur-md border border-white/90 shadow-[0_4px_16px_rgba(11,48,100,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] focus-visible:ring-2 focus-visible:ring-[#0B3064] focus-visible:outline-none',
  // Neumorphic tactile button
  neuro:
    'bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200/80 neuro-btn focus-visible:ring-2 focus-visible:ring-[#0B3064] focus-visible:outline-none',
  // Ghost
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:backdrop-blur-sm font-medium focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none',
};

const sizes = {
  sm: 'px-3 py-1.5 min-h-[36px] text-xs',
  md: 'px-4 py-2.5 min-h-[42px] text-sm',
  lg: 'px-6 py-3 min-h-[48px] text-base',
};

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98]',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
