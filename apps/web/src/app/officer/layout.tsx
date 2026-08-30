import { OfficerDashboardShell } from '@/components/layout/OfficerDashboardShell';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Officer Dashboard' };

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return <OfficerDashboardShell>{children}</OfficerDashboardShell>;
}
