'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import { PathwayCard } from './PathwayCard';
import { OfficerActionPanel } from './OfficerActionPanel';
import { ProfileAuditTimeline } from './ProfileAuditTimeline';
import {
  ArrowLeft,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  History,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaseDetailData } from '../types';

interface Props {
  caseData: CaseDetailData;
}

export function CaseDetailView({ caseData }: Props) {
  const [rightView, setRightView] = useState<'pathways' | 'audit'>('pathways');
  const [selectedPathwayRank, setSelectedPathwayRank] = useState<number>(1);

  const primaryRec = caseData.recommendations.find((r) => r.rank === 1) || caseData.recommendations[0];
  const activeRec = caseData.recommendations.find((r) => r.rank === selectedPathwayRank) || primaryRec;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/officer/cases"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-[#0B3064] transition-colors bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Queue</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
          <span>Docket:</span>
          <span className="font-mono text-[#0B3064] font-bold">{caseData.case_id}</span>
        </div>
      </div>

      {/* Case Header Banner */}
      <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border)] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B3064] font-mono tracking-tight">
              {caseData.case_id}
            </h1>
            <ConfidenceBadge label="high" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1 font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-[#0B3064]" />
              {caseData.district}, {caseData.state}
            </span>
            <span>·</span>
            <span>Language: <strong className="text-slate-900">{caseData.language}</strong></span>
            <span>·</span>
            <span>Gender: <strong className="text-slate-900">{caseData.gender}</strong></span>
            <span>·</span>
            <span>Age: <strong className="text-slate-900">{caseData.age_group}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="saffron" className="px-3 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#E05A1B]" />
            SLA: 2 Days Remaining
          </Badge>
          <Badge variant="chakra" className="px-3 py-1 text-xs">
            Specialist Review Advised
          </Badge>
        </div>
      </div>

      {/* 2-Column Master-Detail Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Sticky Beneficiary Constraints & Profile (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          <Card className="border-[var(--border)] shadow-2xs">
            <CardHeader className="bg-slate-50/70 border-b border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0B3064]" />
                  <h2 className="font-bold text-sm text-[#0B3064]">
                    Beneficiary Intake Dossier
                  </h2>
                </div>
                <span className="text-xs bg-[#EDF9F1] text-[#0A783C] px-2 py-0.5 rounded border border-[#BBE8CB] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0A783C]" />
                  DPDP Verified
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              {/* Critical Constraints Alert Block (Saffron) */}
              <div className="bg-[#FFF4ED] border border-[#FDD8C2] rounded-lg p-3 space-y-1 text-[#C24810]">
                <p className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-[#C24810]">
                  <AlertTriangle className="w-4 h-4 text-[#E05A1B]" />
                  Mobility & Availability Constraints
                </p>
                <p className="leading-relaxed font-medium">
                  {caseData.profile.mobility_constraints}
                </p>
              </div>

              {/* Mandated Fields List */}
              <div className="space-y-3">
                <div className="border-b border-[var(--border-subtle)] pb-2.5">
                  <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">
                    Current Livelihood & Earnings
                  </p>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {caseData.profile.current_livelihood}
                  </p>
                </div>

                <div className="border-b border-[var(--border-subtle)] pb-2.5">
                  <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">
                    Existing Skills & Expressed Interests
                  </p>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {caseData.profile.skills_and_interests}
                  </p>
                </div>

                <div className="border-b border-[var(--border-subtle)] pb-2.5">
                  <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">
                    Family & Traditional Background
                  </p>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {caseData.profile.family_occupation}
                  </p>
                </div>

                <div className="border-b border-[var(--border-subtle)] pb-2.5">
                  <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">
                    Educational Attainment & Literacy
                  </p>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {caseData.profile.educational_background}
                  </p>
                </div>

                <div className="border-b border-[var(--border-subtle)] pb-2.5">
                  <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">
                    Employment Preference
                  </p>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {caseData.profile.employment_preference}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">
                    Local District Ecosystem Context
                  </p>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {caseData.profile.local_economic_context}
                  </p>
                </div>
              </div>

              {/* Profile Completeness Gauge */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)] font-bold">
                    Profile Data Completeness
                  </span>
                  <span className="text-xs font-bold text-[#0B3064]">
                    {Math.round(caseData.profile.completeness * 100)}% (7 of 7 Fields)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                  <div
                    className="h-full bg-[#0B3064] rounded-full transition-all"
                    style={{ width: `${caseData.profile.completeness * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Recommendations, Audit & Action Suite (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* View Mode Tabs (Pathways vs Audit Log) */}
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-[var(--border)] shadow-2xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRightView('pathways')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
                  rightView === 'pathways'
                    ? 'bg-[#0B3064] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Recommended Pathways ({caseData.recommendations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRightView('audit')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
                  rightView === 'audit'
                    ? 'bg-[#0B3064] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                )}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Trail</span>
              </button>
            </div>

            {rightView === 'pathways' && (
              <div className="hidden sm:flex items-center gap-1 text-xs">
                {caseData.recommendations.map((r) => (
                  <button
                    key={r.rank}
                    onClick={() => setSelectedPathwayRank(r.rank)}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer transition-colors',
                      selectedPathwayRank === r.rank
                        ? 'bg-white text-[#0B3064] border border-[#BACEEB] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    #{r.rank}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Main Content */}
          {rightView === 'pathways' ? (
            <div className="space-y-4">
              {/* Active / Selected Pathway Card */}
              <PathwayCard recommendation={activeRec} isPrimary={activeRec.rank === 1} />

              {/* Alternate Pathway Selectors if more than 1 */}
              {caseData.recommendations.length > 1 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    All Top 3 Evaluated Pathways:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {caseData.recommendations.map((r) => (
                      <button
                        key={r.rank}
                        type="button"
                        onClick={() => setSelectedPathwayRank(r.rank)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all cursor-pointer shadow-2xs',
                          selectedPathwayRank === r.rank
                            ? 'bg-[#EAF1FB] border-[#0B3064] text-[#0B3064] ring-1 ring-[#0B3064]/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span>Rank #{r.rank}</span>
                          <span className="text-[#0B3064]">L{r.nsqf_level}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{r.qp_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{r.qp_code}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ProfileAuditTimeline caseId={caseData.case_id} district={caseData.district} />
          )}

          {/* Officer Action & Sanction Suite */}
          <div className="pt-2">
            <OfficerActionPanel caseId={caseData.case_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
