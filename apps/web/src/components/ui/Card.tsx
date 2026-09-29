import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  id?: string;
  variant?: 'default' | 'chakra' | 'saffron' | 'green';
  styleVariant?: 'default' | 'glass' | 'neuro' | 'neuro-glass';
}

export function Card({
  children,
  className,
  hover = false,
  id,
  variant = 'default',
  styleVariant = 'neuro-glass',
}: CardProps) {
  const variantBorder = {
    default: 'border-white/80 hover:border-[#BACEEB]/90',
    chakra: 'border-[#BACEEB]/90 hover:border-[#0B3064]/50 shadow-[0_8px_24px_-4px_rgba(11,48,100,0.07)]',
    saffron: 'border-[#FDD8C2]/90 hover:border-[#E05A1B]/50 shadow-[0_8px_24px_-4px_rgba(224,90,27,0.07)]',
    green: 'border-[#BBE8CB]/90 hover:border-[#0A783C]/50 shadow-[0_8px_24px_-4px_rgba(10,120,60,0.07)]',
  }[variant];

  const styleClasses = {
    default: 'bg-white/90 backdrop-blur-md shadow-[0_6px_20px_-2px_rgba(11,48,100,0.04)]',
    glass: 'glass-card',
    neuro: 'neuro-card',
    'neuro-glass': 'neuro-glass',
  }[styleVariant];

  return (
    <div
      id={id}
      className={cn(
        'rounded-2xl transition-all duration-200',
        styleClasses,
        variantBorder,
        hover &&
          'cursor-pointer hover:-translate-y-1.5 hover:shadow-[10px_10px_28px_-4px_rgba(11,48,100,0.1),-10px_-10px_28px_0_rgba(255,255,255,1)] active:scale-[0.99] active:translate-y-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4.5 border-b border-slate-100/80 flex flex-col gap-1 backdrop-blur-xs', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100/80 bg-slate-50/40 backdrop-blur-sm rounded-b-2xl', className)}>
      {children}
    </div>
  );
}

