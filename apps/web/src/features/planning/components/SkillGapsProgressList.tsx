import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { SkillGapItem } from '../types';

interface Props {
  skillGaps: SkillGapItem[];
}

export function SkillGapsProgressList({ skillGaps }: Props) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-[var(--text-primary)]">Recurring Skill Gaps</h3>
        <p className="text-xs text-[var(--text-muted)]">Most common skills-to-acquire across all pathway recommendations</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {skillGaps.map(sg => (
          <div key={sg.skill} className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-secondary)] w-36 shrink-0">{sg.skill}</span>
            <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${(sg.count / 50) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-indigo-300 w-6 text-right">{sg.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
