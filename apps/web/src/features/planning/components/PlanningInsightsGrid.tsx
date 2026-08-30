import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { School, Building2, Accessibility, Sparkles, type LucideIcon } from 'lucide-react';
import type { PlanningInsight } from '../types';

interface Props {
  insights: PlanningInsight[];
}

const INSIGHT_ICONS: Record<string, { icon: LucideIcon; border: string; bg: string; text: string; iconBg: string }> = {
  'Training Slot Priority': {
    icon: School,
    border: 'border-[#BACEEB]',
    bg: 'bg-[#EAF1FB]/60',
    text: 'text-[#0B3064]',
    iconBg: 'bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB]',
  },
  'MSME Linkage Opportunity': {
    icon: Building2,
    border: 'border-[#BBE8CB]',
    bg: 'bg-[#EDF9F1]/60',
    text: 'text-[#0A783C]',
    iconBg: 'bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB]',
  },
  'Accessibility Gap': {
    icon: Accessibility,
    border: 'border-[#FDD8C2]',
    bg: 'bg-[#FFF4ED]/60',
    text: 'text-[#C24810]',
    iconBg: 'bg-[#FFF4ED] text-[#C24810] border border-[#FDD8C2]',
  },
};

export function PlanningInsightsGrid({ insights }: Props) {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-2xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0B3064]" />
          <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
            Actionable Insights for District Planning Committee
          </h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Programmatic recommendations generated from aggregated case intake and local industrial profile data
        </p>
      </CardHeader>

      <CardContent className="pt-3">
        <div className="space-y-3">
          {insights.map((insight) => {
            const style = INSIGHT_ICONS[insight.title] || {
              icon: Sparkles,
              border: 'border-slate-200',
              bg: 'bg-slate-50',
              text: 'text-slate-900',
              iconBg: 'bg-slate-200 text-slate-700',
            };
            const Icon = style.icon;

            return (
              <div
                key={insight.title}
                className={`rounded-xl p-4 border ${style.border} ${style.bg} space-y-1.5 transition-all shadow-2xs`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg shadow-2xs ${style.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className={`font-bold text-sm ${style.text}`}>
                    {insight.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium pl-8">
                  {insight.body}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
