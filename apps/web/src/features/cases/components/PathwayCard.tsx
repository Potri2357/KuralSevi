import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, MapPin, TrendingUp, Check, Plus, Building2 } from 'lucide-react';
import { cn, nsqfLevelColor, pathwayTypeLabel } from '@/lib/utils';
import type { RecommendationDetail } from '../types';

interface Props {
  recommendation: RecommendationDetail;
  isPrimary?: boolean;
}

export function PathwayCard({ recommendation: rec, isPrimary = false }: Props) {
  const isRankOne = rec.rank === 1 || isPrimary;

  return (
    <Card
      styleVariant="neuro-glass"
      className={cn(
        'transition-all duration-200 cursor-pointer',
        isRankOne
          ? 'border-[#BACEEB] outline outline-2 outline-[#0B3064]/25 shadow-[8px_8px_28px_-4px_rgba(11,48,100,0.12),-8px_-8px_28px_0_rgba(255,255,255,1)]'
          : 'border-slate-200/80 hover:border-[#BACEEB]'
      )}
    >
      <CardHeader className={isRankOne ? 'bg-[#EAF1FB]/80 backdrop-blur-xs border-b border-[#BACEEB]' : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs glass-pill',
                  isRankOne
                    ? 'bg-[#0B3064] text-white border-[#0B3064]'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                )}
              >
                Priority #{rec.rank}
              </span>
              <ConfidenceBadge label={rec.confidence} size="sm" />
            </div>
            <h3 className="font-extrabold text-base text-[#0B3064] leading-snug pt-0.5">
              {rec.qp_name}
            </h3>
            <p className="text-xs text-[#0B3064] font-mono font-semibold">{rec.qp_code}</p>
          </div>

          <div className="text-right shrink-0">
            <span
              className={cn(
                'inline-block text-xs font-bold px-2.5 py-1 rounded-md border shadow-2xs glass-pill',
                nsqfLevelColor(rec.nsqf_level)
              )}
            >
              NSQF Level {rec.nsqf_level}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Pathway Type & Income Potential */}
        <div className="flex items-center justify-between gap-2 text-xs neuro-inset p-3 rounded-xl">
          <Badge variant="chakra">
            {pathwayTypeLabel(rec.pathway_type)}
          </Badge>
          <span className="text-[#0A783C] font-bold flex items-center gap-1.5 glass-green px-2.5 py-1 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5 text-[#0A783C]" />
            {rec.income_range}
          </span>
        </div>

        {/* Matched Skills */}
        <div>
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-[#0A783C]" />
            Matched Existing Competencies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {rec.matched_skills.map((s) => (
              <span
                key={s}
                className="text-xs bg-[#EDF9F1] text-[#0A783C] px-2.5 py-1 rounded-md border border-[#BBE8CB] font-bold shadow-2xs"
              >
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Skills to Acquire (Bridge Training) */}
        <div>
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-[#E05A1B]" />
            Required Bridge Modules ({rec.training_hours} hrs)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {rec.skills_to_acquire.map((s) => (
              <span
                key={s}
                className="text-xs bg-[#FFF4ED] text-[#C24810] px-2.5 py-1 rounded-md border border-[#FDD8C2] font-bold shadow-2xs"
              >
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Local District Opportunity Evidence */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#0B3064]" />
              District Ecosystem Evidence
            </p>
            <span
              className={cn(
                'text-xs font-bold px-2 py-0.5 rounded border',
                rec.opportunity.strength === 'high'
                  ? 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]'
                  : 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]'
              )}
            >
              {rec.opportunity.strength.toUpperCase()} DEMAND
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed font-medium">{rec.opportunity.evidence}</p>
          <p className="text-slate-500 text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            Source: {rec.opportunity.source} · {rec.opportunity.date}
          </p>
        </div>

        {/* Rational Explanation */}
        <div className="border-t border-[var(--border-subtle)] pt-3">
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#0B3064]" />
            Recommendation Rationale
          </p>
          <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-200">
            &ldquo;{rec.explanation}&rdquo;
          </p>
        </div>

        {/* Match Score Bar */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-subtle)]">
          <span className="text-[var(--text-muted)] font-semibold">Algorithmic Match Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
              <div
                className="h-full bg-[#0B3064] rounded-full"
                style={{ width: `${Math.round(rec.topsis_score * 100)}%` }}
              />
            </div>
            <span className="text-[#0B3064] font-mono font-bold">
              {Math.round(rec.topsis_score * 100)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
