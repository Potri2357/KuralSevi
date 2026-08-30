import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, getDaysRemaining, getSlaStatus } from '@/lib/utils';
import type { CaseListItem } from '../types';

interface Props {
  cases: CaseListItem[];
}

export function CaseQueueTable({ cases }: Props) {
  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            {['Case ID', 'District', 'Top Pathway', 'NSQF', 'Preference', 'Confidence', 'SLA', 'Flags', 'Action'].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map(c => {
            const slaStatus = getSlaStatus(c.sla_deadline);
            const daysLeft = getDaysRemaining(c.sla_deadline);
            return (
              <tr key={c.id} className="border-b border-white/4 hover:bg-white/3 transition-colors group">
                <td className="px-5 py-4">
                  <Link
                    href={`/officer/cases/${c.id}`}
                    id={`case-link-${c.id}`}
                    className="font-mono text-xs text-indigo-300 hover:text-white transition-colors"
                  >
                    {c.case_id}
                  </Link>
                </td>
                <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">{c.district}, {c.state}</td>
                <td className="px-5 py-4">
                  <div>
                    <p className="text-xs text-[var(--text-primary)] font-medium">{c.top_trade}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">{c.qp_code}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs font-bold text-indigo-300">L{c.nsqf_level}</span>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={c.employment_pref === 'self' ? 'violet' : c.employment_pref === 'wage' ? 'sky' : 'default'}>
                    {c.employment_pref === 'self' ? 'Self' : c.employment_pref === 'wage' ? 'Wage' : 'Either'}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <ConfidenceBadge label={c.confidence} size="sm" />
                </td>
                <td className="px-5 py-4">
                  <span className={cn(
                    'text-xs font-semibold',
                    slaStatus === 'breached' ? 'text-rose-400' :
                    slaStatus === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    {slaStatus === 'breached' ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    {c.has_mobility && (
                      <span title="Mobility constraint" className="w-5 h-5 bg-amber-500/15 text-amber-400 rounded flex items-center justify-center text-[10px]">♿</span>
                    )}
                    {c.consultant_required && (
                      <span title="Consultant required" className="w-5 h-5 bg-violet-500/15 text-violet-400 rounded flex items-center justify-center text-[10px]">★</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {c.officer_action === 'pending' ? (
                    <Link href={`/officer/cases/${c.id}`}>
                      <Button size="sm" id={`review-btn-${c.id}`}>Review</Button>
                    </Link>
                  ) : (
                    <Badge variant="emerald">Actioned</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {cases.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)] text-sm">
          No cases match your filters.
        </div>
      )}
    </Card>
  );
}
