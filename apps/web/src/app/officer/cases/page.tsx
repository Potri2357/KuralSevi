import { Metadata } from 'next';
import { CaseQueueView, type CaseListItem } from '@/features/cases';
import { getAllOfficerCases } from '@/lib/recommendation-service';

export const metadata: Metadata = {
  title: 'Case Queue — Officer Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function CasesPage() {
  let allCases: CaseListItem[] = [];

  try {
    allCases = await getAllOfficerCases();
  } catch (err) {
    console.error('Error fetching officer cases for CasesPage:', err);
  }

  return <CaseQueueView initialCases={allCases} />;
}
