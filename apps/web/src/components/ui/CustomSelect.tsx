'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className,
  buttonClassName,
  disabled = false,
  'aria-label': ariaLabel,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const SelectedIcon = selectedOption?.icon;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl neuro-inset text-left font-semibold text-sm transition-all cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-[#0B3064]/20 focus:bg-white',
          disabled && 'opacity-60 cursor-not-allowed',
          isOpen && 'ring-2 ring-[#0B3064]/25 bg-white shadow-xs',
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
          {SelectedIcon && (
            <SelectedIcon className="w-4 h-4 text-[#0B3064] shrink-0" />
          )}
          <span className="truncate text-slate-900 font-bold">
            {selectedOption ? selectedOption.label : <span className="text-slate-400 font-normal">{placeholder}</span>}
          </span>
          {selectedOption?.badge && (
            <span className="chip chip-chakra text-[10px] py-0.5 px-2 font-bold shrink-0 ml-1">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 stroke-[2.2]',
            isOpen && 'rotate-180 text-[#0B3064]'
          )}
        />
      </button>

      {/* Modern Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 mt-2 p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_40px_-6px_rgba(11,48,100,0.16)] animate-in fade-in-0 zoom-in-95 duration-150 max-h-72 overflow-y-auto"
        >
          {/* Subtle top specular line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#0B3064]/30 to-transparent mb-1 rounded-full" />

          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              const OptionIcon = option.icon;

              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs font-semibold',
                    isSelected
                      ? 'bg-[#EAF1FB] text-[#0B3064] shadow-2xs border border-[#BACEEB]'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {OptionIcon && (
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-[#0B3064] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        <OptionIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-sm font-bold truncate', isSelected ? 'text-[#0B3064]' : 'text-slate-900')}>
                          {option.label}
                        </span>
                        {option.badge && (
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
                              isSelected
                                ? 'bg-[#0B3064] text-white'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            )}
                          >
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0B3064] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
