export interface ExportOption {
  id: string;
  title: string;
  desc: string;
  fields: string[];
  badge: string;
  badgeVariant: 'chakra' | 'saffron' | 'green' | 'emerald' | 'indigo' | 'violet' | 'rose' | 'amber' | 'blue' | 'sky' | 'default';
}
