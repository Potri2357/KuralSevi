import { Metadata } from 'next';
import { AssistedEnrollmentWizard } from '@/features/beneficiary';

export const metadata: Metadata = {
  title: 'New Beneficiary Intake — Panchayat Kiosk | Kural Sevi',
};

export default function KioskIntakePage() {
  return <AssistedEnrollmentWizard />;
}
