import { OfficerDashboardShell } from '@/components/layout/OfficerDashboardShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'System Administration — Kural Sevi' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <OfficerDashboardShell>{children}</OfficerDashboardShell>;
}
