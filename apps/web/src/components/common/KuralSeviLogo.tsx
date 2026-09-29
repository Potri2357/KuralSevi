'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { IndicEar } from '@/components/icons/indic';

export interface KuralSeviLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  showText?: boolean;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'blue' | 'green' | 'amber' | 'slate';
  className?: string;
  iconOnly?: boolean;
  textColor?: string;
}

export function KuralSeviIcon({
  size = 'md',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 rounded-md',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl',
  };

  const iconSizes = {
    xs: 14,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 30,
  };

  const strokeWidths = {
    xs: 2.5,
    sm: 2.3,
    md: 2.3,
    lg: 2.4,
    xl: 2.4,
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden shadow-xs flex items-center justify-center shrink-0 select-none bg-gradient-to-br from-[#0B3064] via-[#0D3B7A] to-[#144282] text-white',
        sizeClasses[size],
        className
      )}
    >
      <IndicEar
        size={iconSizes[size]}
        strokeWidth={strokeWidths[size]}
        color="currentColor"
        className="text-white drop-shadow-xs shrink-0"
      />
    </div>
  );
}

export function KuralSeviLogo({
  size = 'md',
  href,
  showText = true,
  subtitle,
  badge,
  badgeVariant = 'blue',
  className = '',
  iconOnly = false,
  textColor = 'text-[#0B3064]',
}: KuralSeviLogoProps) {
  const textSizeClasses = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  const badgeStyles = {
    blue: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
    green: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]',
    amber: 'bg-[#FEF5E7] text-[#B24A00] border-[#FCD9A5]',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const content = (
    <div className={cn('flex items-center gap-2.5 sm:gap-3 group select-none', className)}>
      <KuralSeviIcon size={size} className="group-hover:scale-105 transition-transform" />

      {showText && !iconOnly && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-bold font-display tracking-tight leading-tight',
                textSizeClasses[size],
                textColor
              )}
            >
              Kural Sevi
            </span>

            {badge && (
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border font-mono leading-none',
                  badgeStyles[badgeVariant]
                )}
              >
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium font-sans leading-tight mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center no-underline cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}
