import { Metadata } from 'next';
import { AssistedEnrollmentWizard } from '@/features/beneficiary';

export const metadata: Metadata = {
  title: 'Assisted Enrollment — Officer Portal',
};

export default function NewBeneficiaryPage() {
  return <AssistedEnrollmentWizard />;
}
