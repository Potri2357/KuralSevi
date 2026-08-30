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
    high: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    needs_officer_review: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  }[label] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20';
}

export function confidenceLabel(label: string) {
  return {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    needs_officer_review: 'Needs Review',
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
  if (level <= 2) return 'text-sky-400';
  if (level <= 4) return 'text-indigo-400';
  if (level <= 6) return 'text-violet-400';
  return 'text-purple-400';
}
