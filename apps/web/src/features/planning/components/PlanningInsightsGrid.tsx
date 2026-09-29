import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { School, Building2, Accessibility, Sparkles, type LucideIcon } from 'lucide-react';
import type { PlanningInsight } from '../types';

interface Props {
  insights: PlanningInsight[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  School,
  Building2,
  Accessibility,
  Sparkles,
};

const URGENCY_STYLES: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
  chakra: {
    border: 'border-[#BACEEB]',
    bg: 'bg-[#EAF1FB]/60',
    text: 'text-[#0B3064]',
    iconBg: 'bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB]',
  },
  green: {
    border: 'border-[#BBE8CB]',
    bg: 'bg-[#EDF9F1]/60',
    text: 'text-[#0A783C]',
    iconBg: 'bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB]',
  },
  saffron: {
    border: 'border-[#FDD8C2]',
    bg: 'bg-[#FFF4ED]/60',
    text: 'text-[#C24810]',
    iconBg: 'bg-[#FFF4ED] text-[#C24810] border border-[#FDD8C2]',
  },
  indigo: {
    border: 'border-indigo-200',
    bg: 'bg-indigo-50/60',
    text: 'text-indigo-700',
    iconBg: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  },
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50/60',
    text: 'text-amber-700',
    iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
};

export function PlanningInsightsGrid({ insights }: Props) {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-2xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#0B3064]" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
              Actionable Insights for District Planning Committee
            </h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Programmatic recommendations from aggregated case intake & local industrial data
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insights.map((insight) => {
            const style = URGENCY_STYLES[insight.urgency] || URGENCY_STYLES.chakra;
            const Icon = ICON_MAP[insight.icon] || Sparkles;

            return (
              <div
                key={insight.title}
                className={`rounded-xl p-4 border ${style.border} ${style.bg} space-y-2 transition-all shadow-2xs hover:shadow-xs`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg shadow-2xs ${style.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className={`font-bold text-xs ${style.text} leading-snug`}>
                    {insight.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
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
