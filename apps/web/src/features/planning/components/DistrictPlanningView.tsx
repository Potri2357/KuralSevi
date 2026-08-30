'use client';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { TradesDemandBarChart } from './TradesDemandBarChart';
import { EmploymentPreferencePieChart } from './EmploymentPreferencePieChart';
import { SkillGapsProgressList } from './SkillGapsProgressList';
import { PlanningInsightsGrid } from './PlanningInsightsGrid';
import type { PlanningMetricsData } from '../types';

interface Props {
  data: PlanningMetricsData;
}

export function DistrictPlanningView({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">District Planning Intelligence</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Batch-aggregated demand data from confirmed case profiles (FR-14, FR-16)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Last computed: Today 02:00 IST</p>
            <p className="text-[10px] text-amber-400/80">Batch mode — not real-time</p>
          </div>
          <Link href="/officer/export">
            <Button variant="secondary" size="sm" id="export-btn">⤴ Export Data</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard id="plan-total" label="Total Beneficiaries" value={data.totalBeneficiaries} accent="indigo" icon={<span>👥</span>} />
        <StatCard id="plan-profiles" label="Completed Profiles" value={data.completedProfiles} accent="emerald" icon={<span>✓</span>} trend={{ value: 24, label: 'vs last month' }} />
        <StatCard id="plan-mobility" label="Mobility Constraints" value={data.mobilityConstraints} accent="amber" icon={<span>♿</span>} />
        <StatCard id="plan-dropout" label="Mid-Interview Drop-off" value={data.midInterviewDropoffs} accent="rose" icon={<span>⚡</span>} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <TradesDemandBarChart data={data.topTrades} />
        <EmploymentPreferencePieChart data={data.employmentSplit} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SkillGapsProgressList skillGaps={data.skillGaps} />
        <PlanningInsightsGrid insights={data.insights} />
      </div>
    </div>
  );
}
