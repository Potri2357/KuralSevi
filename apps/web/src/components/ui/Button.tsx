import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'saffron';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  // Primary: Deep Ashok Chakra Blue
  primary: 'bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white font-bold shadow-xs focus-visible:ring-2 focus-visible:ring-[#0B3064] focus-visible:outline-none',
  // Secondary: Minimalist Crisp White
  secondary: 'bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-900 font-semibold border border-slate-300 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#0B3064] focus-visible:outline-none',
  // Saffron Action
  saffron: 'bg-[#E05A1B] hover:bg-[#C24810] active:bg-[#A83C0A] text-white font-bold shadow-xs focus-visible:ring-2 focus-visible:ring-[#E05A1B] focus-visible:outline-none',
  // Danger / Reject: Dark Saffron / Brick
  danger: 'bg-[#C24810] hover:bg-[#A83C0A] active:bg-[#8F3006] text-white font-bold shadow-xs focus-visible:ring-2 focus-visible:ring-[#C24810] focus-visible:outline-none',
  // Success: Confirmed Green
  success: 'bg-[#0A783C] hover:bg-[#085C2E] active:bg-[#054320] text-white font-bold shadow-xs focus-visible:ring-2 focus-visible:ring-[#0A783C] focus-visible:outline-none',
  // Ghost
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none',
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
        'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
