import { Metadata } from 'next';
import { DistrictPlanningView, type PlanningMetricsData } from '@/features/planning';

export const metadata: Metadata = {
  title: 'District Planning Intelligence — Officer Dashboard',
};

const PLANNING_METRICS: PlanningMetricsData = {
  totalBeneficiaries: 142,
  completedProfiles: 118,
  mobilityConstraints: 31,
  midInterviewDropoffs: 18,
  topTrades: [
    { name: 'Tailoring', count: 48, fill: '#6366f1' },
    { name: 'Food Processing', count: 35, fill: '#8b5cf6' },
    { name: 'Handloom', count: 28, fill: '#a78bfa' },
    { name: 'Beauty Therapy', count: 22, fill: '#38bdf8' },
    { name: 'Electrician', count: 18, fill: '#f59e0b' },
    { name: 'Data Entry', count: 15, fill: '#10b981' },
    { name: 'Mason', count: 12, fill: '#f43f5e' },
  ],
  employmentSplit: [
    { name: 'Self Employment', value: 62, fill: '#8b5cf6' },
    { name: 'Wage Employment', value: 28, fill: '#38bdf8' },
    { name: 'Home Enterprise', value: 10, fill: '#f59e0b' },
  ],
  skillGaps: [
    { skill: 'Pattern Making', count: 45 },
    { skill: 'Digital Payments', count: 38 },
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
      icon: '📌',
      title: 'Training Slot Priority',
      body: '48 beneficiaries need Tailoring training. Namakkal ITI has capacity — coordinate for next batch.',
      urgency: 'indigo',
    },
    {
      icon: '🏭',
      title: 'MSME Linkage Opportunity',
      body: '35 Food Processing pathway beneficiaries — align with 12 registered food-processing MSMEs in district.',
      urgency: 'emerald',
    },
    {
      icon: '♿',
      title: 'Accessibility Gap',
      body: '31 beneficiaries have mobility constraints. Consider home-visit enrollment for 8 who dropped mid-interview.',
      urgency: 'amber',
    },
  ],
};

export default function PlanningPage() {
  return <DistrictPlanningView data={PLANNING_METRICS} />;
}
