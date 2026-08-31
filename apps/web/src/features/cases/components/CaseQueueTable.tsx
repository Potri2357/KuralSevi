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
  FileText,
  MapPin,
  Briefcase,
  Sparkles,
  Flag,
  UserCheck,
  Award,
  Sun,
  User,
} from 'lucide-react';
import {
  IndicScroll,
  IndicHandloom,
  IndicAgriSickle,
  IndicToolTrowel,
} from '@/components/icons/indic';
import { cn, getDaysRemaining, getSlaStatus } from '@/lib/utils';
import type { CaseListItem } from '../types';

interface Props {
  cases: CaseListItem[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

function getTradeIcon(trade: string) {
  const t = (trade || '').toLowerCase();
  if (
    t.includes('tailor') ||
    t.includes('weav') ||
    t.includes('handloom') ||
    t.includes('textile') ||
    t.includes('handicraft')
  ) {
    return {
      icon: IndicHandloom,
      color: 'text-[#E05A1B] bg-[#FFF4ED] border-[#FDD8C2]',
    };
  }
  if (
    t.includes('food') ||
    t.includes('agri') ||
    t.includes('farm') ||
    t.includes('poultry') ||
    t.includes('crop')
  ) {
    return {
      icon: IndicAgriSickle,
      color: 'text-[#0A783C] bg-[#EDF9F1] border-[#BBE8CB]',
    };
  }
  if (
    t.includes('solar') ||
    t.includes('electr') ||
    t.includes('power') ||
    t.includes('energy')
  ) {
    return {
      icon: Sun,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    };
  }
  if (
    t.includes('beauty') ||
    t.includes('therapy') ||
    t.includes('wellness') ||
    t.includes('care')
  ) {
    return {
      icon: Sparkles,
      color: 'text-violet-600 bg-violet-50 border-violet-200',
    };
  }
  if (
    t.includes('mason') ||
    t.includes('construct') ||
    t.includes('plumb') ||
    t.includes('weld') ||
    t.includes('trowel')
  ) {
    return {
      icon: IndicToolTrowel,
      color: 'text-[#0B3064] bg-[#EAF1FB] border-[#BACEEB]',
    };
  }
  return {
    icon: Briefcase,
    color: 'text-[#0B3064] bg-[#EAF1FB] border-[#BACEEB]',
  };
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
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Case Identifier</span>
                </div>
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>District / State</span>
                </div>
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Top NSQF Recommendation</span>
                </div>
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Mode</span>
                </div>
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Confidence</span>
                </div>
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>SLA Status</span>
                </div>
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Flags</span>
                </div>
              </th>
              <th scope="col" className="px-5 py-3.5 text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                  <span>Action</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-subtle)]">
            {cases.map((c) => {
              const slaStatus = getSlaStatus(c.sla_deadline);
              const daysLeft = getDaysRemaining(c.sla_deadline);
              const isSelected = selectedIds.includes(c.id);
              const tradeMeta = getTradeIcon(c.top_trade);
              const TradeIcon = tradeMeta.icon;

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
                      className="text-[#0B3064] hover:text-[#144282] transition-colors underline-offset-4 hover:underline flex items-center gap-2 group"
                    >
                      <div className="w-6 h-6 rounded-md bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <IndicScroll className="w-3.5 h-3.5 text-[#0B3064]" />
                      </div>
                      <span>{c.case_id}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.district}, {c.state}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2.5">
                      <div className={cn('w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs mt-0.5', tradeMeta.color)}>
                        <TradeIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs text-[var(--text-primary)] font-semibold truncate">{c.top_trade}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[var(--text-muted)] font-mono">{c.qp_code}</span>
                          <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold flex items-center gap-0.5">
                            <Award className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                            <span>L{c.nsqf_level}</span>
                          </span>
                        </div>
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
                      className="gap-1 inline-flex items-center"
                    >
                      {c.employment_pref === 'self' ? (
                        <>
                          <User className="w-3 h-3 text-[#C24810]" />
                          <span>Self-Emp</span>
                        </>
                      ) : c.employment_pref === 'wage' ? (
                        <>
                          <Briefcase className="w-3 h-3 text-[#0B3064]" />
                          <span>Wage</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-slate-600" />
                          <span>Either</span>
                        </>
                      )}
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
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2.5 py-1 rounded shadow-2xs">
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
