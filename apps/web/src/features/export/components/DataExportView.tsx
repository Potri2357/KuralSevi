'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ExportCard } from './ExportCard';
import { ShieldAlert } from 'lucide-react';
import type { ExportOption } from '../types';

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'case-data',
    title: 'Anonymized Case Data Export',
    desc: 'All verified beneficiary profiles and recommended pathway assignments (anonymized per DPDP Act 2023).',
    fields: ['Case ID', 'District', 'QP Codes', 'Confidence Score', 'Officer Actions', 'Beneficiary Decisions'],
    badge: 'DPDP Anonymized',
    badgeVariant: 'green',
  },
  {
    id: 'planning-data',
    title: 'District Planning Intelligence Dataset',
    desc: 'Aggregated vocational trade demands, skill gap summaries, and mobility metrics for district collectorate review.',
    fields: ['Top 10 Trades by District', 'Employment Split', 'Recurring Skill Gaps', 'Mobility Barrier Count', 'Monthly Trend'],
    badge: 'District Aggregate',
    badgeVariant: 'chakra',
  },
  {
    id: 'recommendations',
    title: 'NSQF & SIDH Integration Export',
    desc: 'QP-NOS pathway recommendations formatted for NSDC Skill India Digital Hub (SIDH) synchronization.',
    fields: ['QP Code', 'NSQF Level', 'Matched Skills', 'Bridge Modules', 'Confidence Index', 'Explanation Factors'],
    badge: 'SIDH Schema',
    badgeVariant: 'chakra',
  },
  {
    id: 'officer-actions',
    title: 'Officer Action & Compliance Audit',
    desc: 'Comprehensive log of all sanction orders, modification notes, and SLA compliance metrics.',
    fields: ['Officer ID', 'Case ID', 'Action Taken', 'Timestamp', 'SLA Status', 'Administrative Notes'],
    badge: 'Audit Log',
    badgeVariant: 'saffron',
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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B3064] tracking-tight">
          Inter-Department Data Export & Coordination
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
          Export verified case datasets and district planning aggregates for ITI coordinators, NSDC portals, and State welfare dashboards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EXPORT_OPTIONS.map((opt) => (
          <ExportCard
            key={opt.id}
            option={opt}
            isExporting={exportingId === `${opt.id}-json` || exportingId === `${opt.id}-csv`}
            onExport={handleExport}
          />
        ))}
      </div>

      <Card className="border-[#FDD8C2] bg-[#FFF4ED]/70 shadow-2xs">
        <CardContent className="py-5 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-[#FFF4ED] text-[#E05A1B] border border-[#FDD8C2] shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#C24810] text-sm">
              Statutory Data Governance Notice (DPDP Act 2023)
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              All exported records are governed under the Digital Personal Data Protection Act 2023. Individual beneficiary Aadhaar numbers, phone numbers, and identifying biometric tokens are strictly excluded from external data exports. All records are anonymized at the docket ID level. Full bilateral data sync with SIDH/PM-AJAY Portal requires NSDC administrative authorization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
