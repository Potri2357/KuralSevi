import { Metadata } from 'next';
import { DistrictPlanningView } from '@/features/planning/components/DistrictPlanningView';
import type { PlanningMetricsData } from '@/features/planning/types';

export const metadata: Metadata = {
  title: 'District Planning Intelligence — Kural Sevi',
};

const PLANNING_METRICS: PlanningMetricsData = {
  totalBeneficiaries: 142,
  completedProfiles: 118,
  mobilityConstraints: 31,
  midInterviewDropoffs: 8,
  topTrades: [
    { name: 'Tailoring', count: 48, fill: '#0B3064' },
    { name: 'Food Processing', count: 35, fill: '#144282' },
    { name: 'Weaving / Loom', count: 22, fill: '#E05A1B' },
    { name: 'Mobile Repair', count: 18, fill: '#0B3064' },
    { name: 'Solar PV Tech', count: 14, fill: '#144282' },
    { name: 'Poultry Farm', count: 12, fill: '#E05A1B' },
    { name: 'Carpentry', count: 9, fill: '#475569' },
  ],
  employmentSplit: [
    { name: 'Wage Employment', value: 44, fill: '#0B3064' },
    { name: 'Self-Employment', value: 38, fill: '#E05A1B' },
    { name: 'Home-based Enterprise', value: 18, fill: '#0A783C' },
  ],
  skillGaps: [
    { skill: 'Basic Accounting & UPI', count: 42 },
    { skill: 'Machine Maintenance', count: 38 },
    { skill: 'Food Safety', count: 31 },
    { skill: 'Quality Inspection', count: 28 },
    { skill: 'Business Basics', count: 24 },
    { skill: 'Market Linkage', count: 19 },
  ],
  monthlyTrend: [
    { month: 'Apr', cases: 18, completed: 15 },
    { month: 'May', cases: 24, completed: 21 },
    { month: 'Jun', cases: 31, completed: 26 },
    { month: 'Jul', cases: 38, completed: 33 },
    { month: 'Aug', cases: 31, completed: 28 },
  ],
  insights: [
    {
      icon: 'School',
      title: 'Training Slot Priority',
      body: '48 beneficiaries need Tailoring training. Namakkal ITI has capacity — coordinate for next batch.',
      urgency: 'chakra',
    },
    {
      icon: 'Building2',
      title: 'MSME Linkage Opportunity',
      body: '35 Food Processing pathway beneficiaries — align with 12 registered food-processing MSMEs in district.',
      urgency: 'green',
    },
    {
      icon: 'Accessibility',
      title: 'Accessibility Gap',
      body: '31 beneficiaries have mobility constraints. Consider home-visit enrollment for 8 who dropped mid-interview.',
      urgency: 'saffron',
    },
  ],
};

export default function OfficerPlanningPage() {
  return <DistrictPlanningView data={PLANNING_METRICS} />;
}
