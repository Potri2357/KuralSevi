import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import { cn, nsqfLevelColor, pathwayTypeLabel } from '@/lib/utils';
import type { RecommendationDetail } from '../types';

interface Props {
  recommendation: RecommendationDetail;
}

export function PathwayCard({ recommendation: rec }: Props) {
  return (
    <Card className={cn(
      'border transition-all',
      rec.rank === 1 ? 'border-indigo-500/30 glow-indigo' : 'border-white/8'
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                rec.rank === 1 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/10 text-[var(--text-muted)]'
              )}>#{rec.rank}</span>
              <ConfidenceBadge label={rec.confidence} size="sm" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight">{rec.qp_name}</h3>
            <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{rec.qp_code}</p>
          </div>
          <span className={cn('text-lg font-bold', nsqfLevelColor(rec.nsqf_level))}>L{rec.nsqf_level}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <Badge variant={rec.pathway_type === 'self_employment' ? 'violet' : rec.pathway_type === 'home_enterprise' ? 'amber' : 'sky'}>
            {pathwayTypeLabel(rec.pathway_type)}
          </Badge>
          <span className="text-emerald-400 font-semibold">{rec.income_range}</span>
        </div>

        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Matched Skills</p>
          <div className="flex flex-wrap gap-1">
            {rec.matched_skills.map(s => (
              <span key={s} className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Skills to Acquire</p>
          <div className="flex flex-wrap gap-1">
            {rec.skills_to_acquire.map(s => (
              <span key={s} className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="glass rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Local Opportunity</p>
            <span className={cn('text-[10px] font-semibold',
              rec.opportunity.strength === 'high' ? 'text-emerald-400' : 'text-amber-400'
            )}>{rec.opportunity.strength.toUpperCase()}</span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)]">{rec.opportunity.evidence}</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Source: {rec.opportunity.source} · {rec.opportunity.date}
          </p>
        </div>

        <div className="border-t border-white/6 pt-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Why Recommended (FR-8a)</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">&ldquo;{rec.explanation}&rdquo;</p>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--text-muted)]">TOPSIS Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${rec.topsis_score * 100}%` }} />
            </div>
            <span className="text-indigo-300 font-mono">{(rec.topsis_score * 100).toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
