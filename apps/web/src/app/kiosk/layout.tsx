import type { Metadata } from 'next';
import { KioskShell } from '@/components/layout/KioskShell';

export const metadata: Metadata = { title: 'Panchayat Kiosk — Kural Sevi' };

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <KioskShell>{children}</KioskShell>;
}
