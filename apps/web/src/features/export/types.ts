import type { LucideIcon } from 'lucide-react';

export interface ExportField {
  name: string;
  icon?: LucideIcon;
}

export interface ExportOption {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  fields: ExportField[];
  badge: string;
  badgeIcon?: LucideIcon;
  badgeVariant: 'chakra' | 'saffron' | 'green' | 'emerald' | 'indigo' | 'violet' | 'rose' | 'amber' | 'blue' | 'sky' | 'default';
  recordCount?: string;
  lastUpdated?: string;
}
