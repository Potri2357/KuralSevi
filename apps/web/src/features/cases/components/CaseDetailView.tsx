'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import { PathwayCard } from './PathwayCard';
import { OfficerActionPanel } from './OfficerActionPanel';
import { ProfileAuditTimeline } from './ProfileAuditTimeline';
import { cn } from '@/lib/utils';
import type { CaseDetailData } from '../types';

interface Props {
  caseData: CaseDetailData;
}

export function CaseDetailView({ caseData }: Props) {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'profile' | 'audit'>('recommendations');

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span>Case Queue</span>
        <span>›</span>
        <span className="text-indigo-300 font-mono">{caseData.case_id}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <span className="font-mono text-indigo-400">{caseData.case_id}</span>
            <ConfidenceBadge label="high" />
          </h1>
          <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-secondary)]">
            <span>{caseData.district}, {caseData.state}</span>
            <span>·</span>
            <span>Language: {caseData.language}</span>
            <span>·</span>
            <span>{caseData.gender}</span>
            <span>·</span>
            <span>{caseData.age_group}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="amber">SLA: 2 days left</Badge>
          <Badge variant="violet">★ Consultant Required</Badge>
        </div>
      </div>

      <div className="flex gap-1 glass rounded-xl p-1 w-fit border border-white/8">
        {([
          ['recommendations', 'Top Pathways'],
          ['profile', 'Beneficiary Profile'],
          ['audit', 'Audit Trail'],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'recommendations' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {caseData.recommendations.map(rec => (
            <PathwayCard key={rec.rank} recommendation={rec} />
          ))}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(caseData.profile)
            .filter(([k]) => k !== 'completeness')
            .map(([key, value]) => (
              <Card key={key}>
                <CardContent className="py-4">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">{value as string}</p>
                </CardContent>
              </Card>
            ))}
          <div className="md:col-span-2">
            <div className="glass rounded-xl p-4 border border-indigo-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)]">Profile Completeness</span>
                <span className="text-sm font-bold text-indigo-300">
                  {(caseData.profile.completeness * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                  style={{ width: `${caseData.profile.completeness * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <ProfileAuditTimeline caseId={caseData.case_id} district={caseData.district} />
      )}

      <OfficerActionPanel caseId={caseData.case_id} />
    </div>
  );
}
