import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Target } from 'lucide-react';
import type { SkillGapItem } from '../types';

interface Props {
  skillGaps: SkillGapItem[];
}

export function SkillGapsProgressList({ skillGaps }: Props) {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-2xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#0B3064]" />
          <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
            Recurring Bridge Skill Gaps Across District
          </h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Most frequent vocational bridge training modules required before NSQF certification
        </p>
      </CardHeader>

      <CardContent className="space-y-3.5 pt-3">
        {skillGaps.map((sg) => (
          <div key={sg.skill} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-semibold">{sg.skill}</span>
              <span className="font-mono font-bold text-[#0B3064]">
                {sg.count} candidates ({Math.round((sg.count / 50) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-[#0B3064] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (sg.count / 50) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
