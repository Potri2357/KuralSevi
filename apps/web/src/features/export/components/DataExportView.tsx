'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ExportCard } from './ExportCard';
import type { ExportOption } from '../types';

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'case-data',
    title: 'Case Data Export',
    desc: 'All confirmed beneficiary profiles and pathway recommendations (anonymized).',
    fields: ['Case ID', 'District', 'QP Codes', 'Confidence Labels', 'Officer Actions', 'Beneficiary Decisions'],
    badge: 'Anonymized',
    badgeVariant: 'emerald',
  },
  {
    id: 'planning-data',
    title: 'Planning Intelligence Export',
    desc: 'District-level aggregated statistics for planning use.',
    fields: ['Top 10 Trades by District', 'Employment Preference Split', 'Recurring Skill Gaps', 'Mobility Barrier Count', 'Monthly Trend'],
    badge: 'Aggregate Only',
    badgeVariant: 'indigo',
  },
  {
    id: 'recommendations',
    title: 'Recommendations Export',
    desc: 'QP-NOS pathway recommendations with NSQF metadata for SIDH/PM-AJAY integration.',
    fields: ['QP Code', 'NSQF Level', 'Matched Skills', 'Skill Gaps', 'Confidence Labels', 'Explanation Factors'],
    badge: 'SIDH Compatible',
    badgeVariant: 'violet',
  },
  {
    id: 'officer-actions',
    title: 'Officer Action Audit',
    desc: 'All officer decisions for compliance and monitoring purposes.',
    fields: ['Officer ID', 'Case ID', 'Action Taken', 'Timestamp', 'SLA Status', 'Notes'],
    badge: 'Admin Only',
    badgeVariant: 'rose',
  },
];

export function DataExportView() {
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = (type: string, format: 'json' | 'csv') => {
    setExportingId(`${type}-${format}`);
    setTimeout(() => setExportingId(null), 2000);
    window.open(`/api/export?type=${type}&format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Data Export (FR-17)</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          Lightweight export for external consumption and inter-department coordination.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {EXPORT_OPTIONS.map(opt => (
          <ExportCard
            key={opt.id}
            option={opt}
            isExporting={exportingId === `${opt.id}-json` || exportingId === `${opt.id}-csv`}
            onExport={handleExport}
          />
        ))}
      </div>

      <Card className="border-amber-500/20">
        <CardContent className="py-5 flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-amber-300 text-sm mb-1">Data Governance Notice</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              All exports are governed by DPDP Act 2023. Individual beneficiary PII is never included in case data exports.
              All records are anonymized at the case-ID level. Full bi-directional sync with SIDH/PM-AJAY Portal is Tier 2
              and requires a signed NSDC data-sharing agreement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
