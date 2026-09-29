import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Target, AlertCircle } from 'lucide-react';
import type { SkillGapItem } from '../types';

interface Props {
  skillGaps: SkillGapItem[];
}

const GAP_COLORS = [
  { bar: '#0B3064', bg: '#EAF1FB', border: '#BACEEB', text: '#0B3064' },
  { bar: '#0A783C', bg: '#EDF9F1', border: '#BBE8CB', text: '#0A783C' },
  { bar: '#C24810', bg: '#FFF4ED', border: '#FDD8C2', text: '#C24810' },
  { bar: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA' },
  { bar: '#0891B2', bg: '#E0F2FE', border: '#BAE6FD', text: '#0369A1' },
  { bar: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9' },
];

export function SkillGapsProgressList({ skillGaps }: Props) {
  if (!skillGaps || skillGaps.length === 0) return null;

  const maxCount = Math.max(...skillGaps.map((sg) => sg.count), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFF4ED] border border-[#FDD8C2] flex items-center justify-center">
            <Target className="w-4 h-4 text-[#C24810]" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
              Bridge Skill Gaps Across District
            </h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Most frequent bridge training modules required before NSQF certification
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        {skillGaps.slice(0, 6).map((sg, i) => {
          const color = GAP_COLORS[i % GAP_COLORS.length];
          const pct = Math.round((sg.count / maxCount) * 100);

          return (
            <div key={sg.skill} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold shrink-0"
                    style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.text }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-slate-800 font-semibold truncate">{sg.skill}</span>
                </div>
                <span
                  className="font-mono font-bold text-[11px] shrink-0 ml-2 px-2 py-0.5 rounded"
                  style={{ background: color.bg, color: color.text }}
                >
                  {sg.count} needed
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color.bar }}
                />
              </div>
            </div>
          );
        })}

        {skillGaps.length === 0 && (
          <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span>No skill gaps identified yet — more beneficiary data needed.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
