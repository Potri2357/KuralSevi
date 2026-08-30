import { Metadata } from 'next';
import { DataExportView } from '@/features/export';

export const metadata: Metadata = {
  title: 'Data Export (FR-17) — Officer Portal',
};

export default function ExportPage() {
  return <DataExportView />;
}
