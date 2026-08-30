import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { PlanningInsight } from '../types';

interface Props {
  insights: PlanningInsight[];
}

export function PlanningInsightsGrid({ insights }: Props) {
  return (
    <Card className="border-indigo-500/20">
      <CardHeader>
        <h3 className="font-semibold text-[var(--text-primary)]">Planning Insights for District Officers</h3>
        <p className="text-xs text-[var(--text-muted)]">Auto-generated from aggregated case data (FR-14)</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map(insight => (
            <div key={insight.title} className="glass rounded-xl p-4 border border-white/8">
              <span className="text-2xl mb-2 block">{insight.icon}</span>
              <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-1">{insight.title}</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insight.body}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
