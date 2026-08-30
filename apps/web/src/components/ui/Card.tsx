import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
  variant?: 'default' | 'chakra' | 'saffron' | 'green';
}

export function Card({ children, className, hover = false, id, variant = 'default' }: CardProps) {
  const variantBorder = {
    default: 'border-slate-200/85 hover:border-[#BACEEB]/80',
    chakra: 'border-[#BACEEB] hover:border-[#0B3064]/60',
    saffron: 'border-[#FDD8C2] hover:border-[#E05A1B]/60',
    green: 'border-[#BBE8CB] hover:border-[#0A783C]/60',
  }[variant];

  return (
    <div
      id={id}
      className={cn(
        'bg-white/88 backdrop-blur-md rounded-2xl border transition-all duration-250 shadow-[0_4px_20px_-2px_rgba(11,48,100,0.04),0_1px_3px_0_rgba(11,48,100,0.03)] ring-1 ring-white/70',
        variantBorder,
        hover && 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_32px_-6px_rgba(11,48,100,0.1),0_8px_16px_-4px_rgba(11,48,100,0.05)] active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4.5 border-b border-slate-100/90 flex flex-col gap-1', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100/90 bg-slate-50/50 backdrop-blur-sm rounded-b-2xl', className)}>
      {children}
    </div>
  );
}
