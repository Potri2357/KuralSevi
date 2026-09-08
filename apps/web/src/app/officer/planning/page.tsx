import { Metadata } from 'next';
import { DistrictPlanningView } from '@/features/planning/components/DistrictPlanningView';
import { getDistrictPlanningMetrics } from '@/lib/recommendation-service';

export const metadata: Metadata = {
  title: 'District Planning Intelligence — Kural Sevi',
};

export const dynamic = 'force-dynamic';

export default async function OfficerPlanningPage() {
  const data = await getDistrictPlanningMetrics();
  return <DistrictPlanningView data={data} />;
}
