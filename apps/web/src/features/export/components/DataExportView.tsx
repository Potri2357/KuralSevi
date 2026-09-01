'use client';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ExportCard } from './ExportCard';
import {
  ShieldAlert,
  ShieldCheck,
  DownloadCloud,
  FileSpreadsheet,
  FileJson,
  Code2,
  Lock,
  Share2,
  Users,
  BarChart3,
  Cpu,
  History,
  Hash,
  MapPin,
  Tag,
  Sparkles,
  CheckCircle2,
  UserCheck,
  TrendingUp,
  PieChart,
  AlertCircle,
  Compass,
  Calendar,
  Award,
  Check,
  Plus,
  FileText,
  Clock,
  Timer,
  Building2,
  Database,
  ArrowDownToLine,
  Layers,
} from 'lucide-react';
import type { ExportOption } from '../types';

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'case-data',
    title: 'Anonymized Case Data Export',
    desc: 'All verified beneficiary profiles and recommended pathway assignments (anonymized per DPDP Act 2023).',
    icon: Users,
    iconBg: 'bg-blue-50/80 border-blue-100',
    iconColor: 'text-[#0B3064]',
    badge: 'DPDP Anonymized',
    badgeIcon: ShieldCheck,
    badgeVariant: 'green',
    recordCount: '1,420 Cases',
    lastUpdated: 'Live Sync',
    fields: [
      { name: 'Case ID', icon: Hash },
      { name: 'District', icon: MapPin },
      { name: 'QP Codes', icon: Tag },
      { name: 'Confidence Score', icon: Sparkles },
      { name: 'Officer Actions', icon: CheckCircle2 },
      { name: 'Beneficiary Decisions', icon: UserCheck },
    ],
  },
  {
    id: 'planning-data',
    title: 'District Planning Intelligence Dataset',
    desc: 'Aggregated vocational trade demands, skill gap summaries, and mobility metrics for district collectorate review.',
    icon: BarChart3,
    iconBg: 'bg-indigo-50/80 border-indigo-100',
    iconColor: 'text-[#0B3064]',
    badge: 'District Aggregate',
    badgeIcon: Building2,
    badgeVariant: 'chakra',
    recordCount: '38 Districts',
    lastUpdated: 'Updated Today',
    fields: [
      { name: 'Top 10 Trades by District', icon: TrendingUp },
      { name: 'Employment Split', icon: PieChart },
      { name: 'Recurring Skill Gaps', icon: AlertCircle },
      { name: 'Mobility Barrier Count', icon: Compass },
      { name: 'Monthly Trend', icon: Calendar },
    ],
  },
  {
    id: 'recommendations',
    title: 'NSQF & SIDH Integration Export',
    desc: 'QP-NOS pathway recommendations formatted for NSDC Skill India Digital Hub (SIDH) synchronization.',
    icon: Cpu,
    iconBg: 'bg-emerald-50/80 border-emerald-100',
    iconColor: 'text-[#0A783C]',
    badge: 'SIDH Schema',
    badgeIcon: Award,
    badgeVariant: 'chakra',
    recordCount: '5,120 Recommendations',
    lastUpdated: 'NSQF V2 Aligned',
    fields: [
      { name: 'QP Code', icon: Hash },
      { name: 'NSQF Level', icon: Award },
      { name: 'Matched Skills', icon: Check },
      { name: 'Bridge Modules', icon: Plus },
      { name: 'Confidence Index', icon: Sparkles },
      { name: 'Explanation Factors', icon: FileText },
    ],
  },
  {
    id: 'officer-actions',
    title: 'Officer Action & Compliance Audit',
    desc: 'Comprehensive log of all sanction orders, modification notes, and SLA compliance metrics.',
    icon: History,
    iconBg: 'bg-orange-50/80 border-orange-100',
    iconColor: 'text-[#C24810]',
    badge: 'Audit Log',
    badgeIcon: Clock,
    badgeVariant: 'saffron',
    recordCount: '890 Actions Logged',
    lastUpdated: 'Immutable Hash',
    fields: [
      { name: 'Officer ID', icon: UserCheck },
      { name: 'Case ID', icon: Hash },
      { name: 'Action Taken', icon: CheckCircle2 },
      { name: 'Timestamp', icon: Clock },
      { name: 'SLA Status', icon: Timer },
      { name: 'Administrative Notes', icon: FileText },
    ],
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
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Banner with Icon & Metadata */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0B3064] shrink-0 shadow-2xs">
              <DownloadCloud className="w-6 h-6 text-[#0B3064]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B3064] font-display tracking-tight">
                  Inter-Department Data Export & Coordination
                </h1>
                <span className="text-[11px] font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-[#0A783C]" />
                  DPDP 2023
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Export verified case datasets and district planning aggregates for ITI coordinators, NSDC portals, and State welfare dashboards
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 p-2.5 rounded-xl shrink-0">
            <div className="flex items-center gap-1 px-2 border-r border-slate-200">
              <Database className="w-3.5 h-3.5 text-[#0B3064]" />
              <span>4 Data Feeds</span>
            </div>
            <div className="flex items-center gap-1 px-2 border-r border-slate-200">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A783C]" />
              <FileJson className="w-3.5 h-3.5 text-[#0B3064]" />
              <span>CSV & JSON</span>
            </div>
            <div className="flex items-center gap-1 px-2">
              <Code2 className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>REST API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Cards Grid */}
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

      {/* Statutory Data Governance Notice Card with Rich Icons */}
      <Card className="border-[#FDD8C2] bg-[#FFF5EE] rounded-2xl shadow-2xs">
        <CardContent className="py-5 px-6 space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-white text-[#E05A1B] border border-[#FDD8C2] shrink-0 shadow-2xs mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#C24810] text-sm flex items-center gap-2">
                <span>Statutory Data Governance Notice (DPDP Act 2023)</span>
                <span className="text-[10px] font-bold bg-[#FFF0E6] text-[#C24810] px-2 py-0.5 rounded border border-[#FDD8C2]">
                  Mandatory Compliance
                </span>
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                All exported records are governed under the Digital Personal Data Protection Act 2023. Individual beneficiary Aadhaar numbers, phone numbers, and identifying biometric tokens are strictly excluded from external data exports. All records are anonymized at the docket ID level. Full bilateral data sync with SIDH/PM-AJAY Portal requires NSDC administrative authorization.
              </p>
            </div>
          </div>

          {/* Compliance Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#FDD8C2]/60">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C24810] bg-white border border-[#FDD8C2] px-3 py-1 rounded-lg shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>Zero Raw PII / Aadhaar Stored</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B3064] bg-white border border-[#BACEEB] px-3 py-1 rounded-lg shadow-2xs">
              <Hash className="w-3.5 h-3.5 text-[#0B3064]" />
              <span>Docket-Level SHA-256 Pseudonymization</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A783C] bg-white border border-[#BBE8CB] px-3 py-1 rounded-lg shadow-2xs">
              <Share2 className="w-3.5 h-3.5 text-[#0A783C]" />
              <span>NSDC SIDH Integration Ready</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
