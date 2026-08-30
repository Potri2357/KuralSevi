import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date));
}

export function getDaysRemaining(deadline: string): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getSlaStatus(deadline: string): 'ok' | 'warning' | 'breached' {
  const days = getDaysRemaining(deadline);
  if (days < 0) return 'breached';
  if (days <= 1) return 'warning';
  return 'ok';
}

export function confidenceColor(label: string) {
  return {
    high: 'text-[#0B3064] bg-[#EAF1FB] border-[#BACEEB]',
    medium: 'text-slate-700 bg-slate-100 border-slate-200',
    needs_officer_review: 'text-[#C24810] bg-[#FFF4ED] border-[#FDD8C2]',
  }[label] ?? 'text-slate-700 bg-slate-100 border-slate-200';
}

export function confidenceLabel(label: string) {
  return {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    needs_officer_review: 'Review Required',
  }[label] ?? label;
}

export function pathwayTypeLabel(type: string) {
  return {
    wage_employment: 'Wage Employment',
    self_employment: 'Self Employment',
    home_enterprise: 'Home Enterprise',
  }[type] ?? type;
}

export function nsqfLevelColor(level: number) {
  if (level <= 3) return 'text-slate-700 bg-slate-100 border-slate-200';
  if (level <= 5) return 'text-[#0B3064] bg-[#EAF1FB] border-[#BACEEB]';
  return 'text-[#082142] bg-[#D7E5F8] border-[#9ABBE5]';
}
