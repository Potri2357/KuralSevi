'use client';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Accessibility,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn, getDaysRemaining, getSlaStatus } from '@/lib/utils';
import type { CaseListItem } from '../types';

interface Props {
  cases: CaseListItem[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

export function CaseQueueTable({
  cases,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
}: Props) {
  const isAllSelected = cases.length > 0 && selectedIds.length === cases.length;

  return (
    <Card className="overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-slate-50/70">
              {onToggleSelect && (
                <th scope="col" className="px-4 py-3.5 w-10 text-center">
                  <label htmlFor="select-all-cases-checkbox" className="sr-only">Select all cases in view</label>
                  <input
                    id="select-all-cases-checkbox"
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300 focus:ring-blue-500 cursor-pointer"
                    aria-label="Select all cases in view"
                  />
                </th>
              )}
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                Case Identifier
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                District / State
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                Top NSQF Recommendation
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                Mode
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                Confidence
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                SLA Status
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                Flags
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider text-right whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {cases.map((c) => {
              const slaStatus = getSlaStatus(c.sla_deadline);
              const daysLeft = getDaysRemaining(c.sla_deadline);
              const isSelected = selectedIds.includes(c.id);

              return (
                <tr
                  key={c.id}
                  className={cn(
                    'transition-colors',
                    isSelected ? 'bg-[#EAF1FB]/50' : 'hover:bg-slate-50'
                  )}
                >
                  {onToggleSelect && (
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <label htmlFor={`select-case-${c.id}`} className="sr-only">Select case {c.case_id}</label>
                      <input
                        id={`select-case-${c.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(c.id)}
                        className="w-4 h-4 rounded text-[#0B3064] bg-white border-slate-300 focus:ring-[#0B3064] cursor-pointer"
                        aria-label={`Select case ${c.case_id}`}
                      />
                    </td>
                  )}
                  <td className="px-5 py-4 font-mono text-xs font-bold whitespace-nowrap">
                    <Link
                      href={`/officer/cases/${c.id}`}
                      id={`case-link-${c.id}`}
                      className="text-[#0B3064] hover:text-[#144282] transition-colors underline-offset-4 hover:underline"
                    >
                      {c.case_id}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                    {c.district}, {c.state}
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-0.5">
                      <p className="text-xs text-[var(--text-primary)] font-semibold">{c.top_trade}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">{c.qp_code}</span>
                        <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                          L{c.nsqf_level}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        c.employment_pref === 'self'
                          ? 'saffron'
                          : c.employment_pref === 'wage'
                          ? 'chakra'
                          : 'default'
                      }
                    >
                      {c.employment_pref === 'self'
                        ? 'Self-Emp'
                        : c.employment_pref === 'wage'
                        ? 'Wage'
                        : 'Either'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <ConfidenceBadge label={c.confidence} size="sm" />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-2xs whitespace-nowrap leading-none',
                        slaStatus === 'breached' || slaStatus === 'warning'
                          ? 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]'
                          : 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]'
                      )}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {slaStatus === 'breached'
                          ? `${Math.abs(daysLeft)}d overdue`
                          : `${daysLeft}d left`}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {c.has_mobility && (
                        <span
                          title="Mobility constraint reported"
                          className="w-6 h-6 bg-[#FFF4ED] text-[#C24810] border border-[#FDD8C2] rounded flex items-center justify-center text-xs shadow-2xs"
                          aria-label="Mobility constraint"
                        >
                          <Accessibility className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {c.consultant_required && (
                        <span
                          title="Specialist consultant referral indicated"
                          className="w-6 h-6 bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] rounded flex items-center justify-center text-xs shadow-2xs"
                          aria-label="Consultant referral needed"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {!c.has_mobility && !c.consultant_required && (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    {c.officer_action === 'pending' ? (
                      <Link href={`/officer/cases/${c.id}`}>
                        <Button size="sm" id={`review-btn-${c.id}`} className="font-bold text-xs">
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2.5 py-1 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Actioned
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cases.length === 0 && (
        <div className="text-center py-16 text-[var(--text-muted)] text-sm space-y-2">
          <p className="font-semibold text-slate-700">No cases found matching the current filters.</p>
          <p className="text-xs">Try clearing your search query or selecting &quot;All Cases&quot;.</p>
        </div>
      )}
    </Card>
  );
}
