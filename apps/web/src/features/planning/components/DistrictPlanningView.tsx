'use client';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { TradesDemandBarChart } from './TradesDemandBarChart';
import { EmploymentPreferencePieChart } from './EmploymentPreferencePieChart';
import { SkillGapsProgressList } from './SkillGapsProgressList';
import { PlanningInsightsGrid } from './PlanningInsightsGrid';
import { MonthlyIntakeTrendChart } from './MonthlyIntakeTrendChart';
import {
  Users,
  CheckCircle2,
  Accessibility,
  AlertOctagon,
  Download,
  Clock,
  BarChart3,
} from 'lucide-react';
import type { PlanningMetricsData } from '../types';

interface Props {
  data: PlanningMetricsData;
}

export function DistrictPlanningView({ data }: Props) {
  const completionRate =
    data.totalBeneficiaries > 0
      ? Math.round((data.completedProfiles / data.totalBeneficiaries) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064] shadow-2xs shrink-0">
            <BarChart3 className="w-6 h-6 text-[#0B3064]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0B3064] tracking-tight font-display">
              District Livelihood Planning Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Batch-aggregated skilling demand & enterprise capacity intelligence for District Social Welfare Officers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Aggregated: Today 02:00 IST
            </p>
            <p className="text-xs text-[#0B3064] font-bold">Nightly Batch Sync Mode</p>
          </div>
          <Link href="/officer/export">
            <Button variant="secondary" size="sm" id="export-btn" className="text-xs font-bold shadow-2xs">
              <Download className="w-3.5 h-3.5 text-[#0B3064]" />
              <span>Export Datasets</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          id="plan-total"
          label="Total Beneficiaries"
          value={data.totalBeneficiaries}
          accent="chakra"
          icon={<Users className="w-5 h-5 text-[#0B3064]" />}
        />
        <StatCard
          id="plan-profiles"
          label="Verified Profiles"
          value={data.completedProfiles}
          accent="green"
          icon={<CheckCircle2 className="w-5 h-5 text-[#0A783C]" />}
          trend={
            data.totalBeneficiaries > 0
              ? { value: completionRate, label: 'completion rate' }
              : undefined
          }
        />
        <StatCard
          id="plan-mobility"
          label="Mobility Barriers"
          value={data.mobilityConstraints}
          accent="saffron"
          icon={<Accessibility className="w-5 h-5 text-[#E05A1B]" />}
        />
        <StatCard
          id="plan-dropout"
          label="Incomplete Intakes"
          value={data.midInterviewDropoffs}
          accent="rose"
          icon={<AlertOctagon className="w-5 h-5 text-rose-600" />}
        />
      </div>

      {/* Primary Charts Row: Bar + Pie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <TradesDemandBarChart data={data.topTrades} />
        <EmploymentPreferencePieChart data={data.employmentSplit} />
      </div>

      {/* Secondary Row: Monthly Trend + Skill Gaps */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MonthlyIntakeTrendChart data={data.monthlyTrend} />
        <SkillGapsProgressList skillGaps={data.skillGaps} />
      </div>

      {/* Insights Row */}
      <PlanningInsightsGrid insights={data.insights} />
    </div>
  );
}
