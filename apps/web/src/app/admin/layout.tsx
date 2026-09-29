import type { Metadata } from 'next';
import { AdminShell } from '@/components/layout/AdminShell';

export const metadata: Metadata = { title: 'System Administration — Kural Sevi' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
