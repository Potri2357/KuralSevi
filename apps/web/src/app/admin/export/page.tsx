import { Metadata } from 'next';
import { DataExportView } from '@/features/export';

export const metadata: Metadata = {
  title: 'Scheme Data Export & Analytics — Admin Console',
  description: 'Download anonymized DPDP-compliant scheme microdata, district aggregates, and official audit registries.',
};

export default function AdminExportPage() {
  return (
    <div className="space-y-6">
      <DataExportView />
    </div>
  );
}
