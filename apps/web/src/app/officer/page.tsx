import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import { formatDateShort } from '@/lib/utils';
import {
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Star,
  ArrowRight,
  UserPlus,
  BarChart3,
  Download,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Officer Operations Dashboard — Kural Sevi',
};

const DEMO_STATS = {
  totalCases: 142,
  pendingReview: 23,
  slaBreached: 4,
  completedToday: 18,
  highConfidence: 84,
  consultantRequired: 12,
};

const DEMO_RECENT_CASES = [
  {
    id: '1',
    case_id: 'KS-2026-00142',
    district: 'Namakkal',
    trade: 'Self-Employed Tailor',
    confidence: 'high' as const,
    days_pending: 1,
  },
  {
    id: '2',
    case_id: 'KS-2026-00141',
    district: 'Salem',
    trade: 'Solar Panel Installer',
    confidence: 'high' as const,
    days_pending: 2,
  },
  {
    id: '3',
    case_id: 'KS-2026-00140',
    district: 'Tiruchirappalli',
    trade: 'Food Processing Tech',
    confidence: 'medium' as const,
    days_pending: 3,
  },
  {
    id: '4',
    case_id: 'KS-2026-00139',
    district: 'Namakkal',
    trade: 'Poultry Farm Worker',
    confidence: 'high' as const,
    days_pending: 1,
  },
];

export default function OfficerOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3064] tracking-tight">
            Officer Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            District-level case adjudication, NSQF skilling reviews, and PM-AJAY GIA sanction tracking
          </p>
        </div>
        <div className="text-left sm:text-right text-xs text-[var(--text-muted)] font-medium">
          <p>Last batch sync: {formatDateShort(new Date().toISOString())}</p>
          <p className="text-[#0B3064] font-bold flex items-center sm:justify-end gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#0A783C] animate-pulse" />
            <span>Namakkal District Docket · Active</span>
          </p>
        </div>
      </div>

      {/* Stats grid: Glassmorphic interactive StatCards with hover transitions */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          id="stat-total"
          label="Total Cases"
          value={DEMO_STATS.totalCases}
          accent="chakra"
          icon={<Inbox className="w-5 h-5 text-[#0B3064]" />}
        />
        <StatCard
          id="stat-pending"
          label="Pending Review"
          value={DEMO_STATS.pendingReview}
          accent="saffron"
          icon={<Clock className="w-5 h-5 text-[#E05A1B]" />}
          trend={{ value: -12, label: 'vs yesterday' }}
        />
        <StatCard
          id="stat-sla"
          label="SLA Breached"
          value={DEMO_STATS.slaBreached}
          accent="rose"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          id="stat-done"
          label="Actioned Today"
          value={DEMO_STATS.completedToday}
          accent="green"
          icon={<CheckCircle2 className="w-5 h-5 text-[#0A783C]" />}
        />
        <StatCard
          id="stat-confidence"
          label="High Confidence"
          value={`${DEMO_STATS.highConfidence}%`}
          accent="chakra"
          icon={<Sparkles className="w-5 h-5 text-[#0B3064]" />}
        />
        <StatCard
          id="stat-consultant"
          label="Specialist Needed"
          value={DEMO_STATS.consultantRequired}
          accent="saffron"
          icon={<Star className="w-5 h-5 text-[#E05A1B]" />}
        />
      </div>

      {/* Main Grid: Recent cases & SLA urgency panel (No horizontal scroll inside cards) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent cases card: Formatted without horizontal overflow */}
        <Card className="xl:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base text-[#0B3064]">
                    Incoming Cases Awaiting Action
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Latest voice-intake cases requiring DSWO sanction review
                  </p>
                </div>
                <Link
                  href="/officer/cases"
                  className="text-xs font-bold text-[#0B3064] hover:text-[#144282] transition-all flex items-center gap-1.5 group px-2.5 py-1 rounded-lg hover:bg-[#EAF1FB]"
                >
                  <span>View Full Queue</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Header row */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50/70 text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                <div className="col-span-3">Case ID</div>
                <div className="col-span-2">District</div>
                <div className="col-span-3">Top Recommended Trade</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-2 text-right">Status</div>
              </div>

              {/* Interactive Case Rows without horizontal scroll */}
              <div className="divide-y divide-slate-100">
                {DEMO_RECENT_CASES.map((c) => (
                  <Link
                    key={c.id}
                    href={`/officer/cases/${c.id}`}
                    className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 px-6 py-3.5 items-start sm:items-center hover:bg-[#EAF1FB]/40 transition-all duration-150 group cursor-pointer"
                  >
                    <div className="col-span-3 font-mono text-xs font-bold text-[#0B3064] group-hover:text-[#144282] group-hover:underline underline-offset-4 flex items-center gap-1.5">
                      <span>{c.case_id}</span>
                      <ArrowRight className="w-3 h-3 text-[#0B3064] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all hidden sm:inline" />
                    </div>
                    <div className="col-span-2 text-xs text-[var(--text-secondary)] font-medium">
                      {c.district}
                    </div>
                    <div className="col-span-3 text-xs text-slate-800 font-semibold truncate w-full">
                      {c.trade}
                    </div>
                    <div className="col-span-2">
                      <ConfidenceBadge label={c.confidence} size="sm" />
                    </div>
                    <div className="col-span-2 sm:flex sm:justify-end w-full">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-2xs leading-none whitespace-nowrap ${
                          c.days_pending > 2
                            ? 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]'
                            : c.days_pending > 1
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]'
                        }`}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{c.days_pending}d pending</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Action required alerts panel: Subtle glassmorphism and interactive list items */}
        <div className="space-y-4">
          <Card className="border-[#FDD8C2] bg-white/90 shadow-2xs">
            <CardHeader className="border-b border-[#FDD8C2]/60 pb-3">
              <div className="flex items-center gap-2 text-[#C24810]">
                <AlertTriangle className="w-4 h-4 text-[#E05A1B] shrink-0 animate-pulse" />
                <h2 className="text-sm font-bold">SLA Escalation Alert (4 Cases)</h2>
              </div>
            </CardHeader>
            <CardContent className="py-3 space-y-2">
              {[
                { case_id: 'KS-2026-00138', days: 4 },
                { case_id: 'KS-2026-00135', days: 5 },
                { case_id: 'KS-2026-00131', days: 6 },
                { case_id: 'KS-2026-00128', days: 7 },
              ].map((c) => (
                <Link
                  key={c.case_id}
                  href="/officer/cases/5"
                  className="flex items-center justify-between text-xs bg-white/95 hover:bg-[#FFF4ED] p-2.5 rounded-xl border border-[#FDD8C2] hover:border-[#E05A1B] shadow-2xs transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] group"
                >
                  <span className="font-mono text-xs font-bold text-[#0B3064] group-hover:text-[#144282]">
                    {c.case_id}
                  </span>
                  <Badge variant="saffron">{c.days}d overdue</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#FDD8C2] bg-white/90 shadow-2xs">
            <CardHeader className="border-b border-[#FDD8C2]/60 pb-3">
              <div className="flex items-center gap-2 text-[#C24810]">
                <Star className="w-4 h-4 text-[#E05A1B] shrink-0" />
                <h2 className="text-sm font-bold">Specialist / Bank Linkage Referrals</h2>
              </div>
            </CardHeader>
            <CardContent className="py-3">
              <p className="text-2xl font-extrabold text-[#0B3064] tracking-tight font-mono">
                {DEMO_STATS.consultantRequired} Cases
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed font-medium">
                Self-employment & micro-enterprise pathways awaiting district financial consultant or SHG credit linkage assignment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation Action Grid: Interactive glass cards with hover lift */}
      <Card className="shadow-2xs">
        <CardHeader>
          <h2 className="font-bold text-sm text-[#0B3064]">
            Primary Officer Action Shortcuts
          </h2>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Link
              href="/officer/cases?filter=pending"
              id="action-pending"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/90 hover:bg-slate-50 border border-slate-200/90 hover:border-[#FDD8C2] text-slate-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] font-bold text-xs min-h-[48px] shadow-2xs group"
            >
              <div className="p-2 rounded-lg bg-[#FFF4ED] text-[#E05A1B] border border-[#FDD8C2] group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4 shrink-0" />
              </div>
              <span>Review Pending Cases ({DEMO_STATS.pendingReview})</span>
            </Link>

            <Link
              href="/officer/planning"
              id="action-planning"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/90 hover:bg-slate-50 border border-slate-200/90 hover:border-[#BACEEB] text-slate-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] font-bold text-xs min-h-[48px] shadow-2xs group"
            >
              <div className="p-2 rounded-lg bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] group-hover:scale-110 transition-transform">
                <BarChart3 className="w-4 h-4 shrink-0" />
              </div>
              <span>District Planning View</span>
            </Link>

            <Link
              href="/officer/beneficiary/new"
              id="action-enroll"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/90 hover:bg-slate-50 border border-slate-200/90 hover:border-[#BBE8CB] text-slate-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] font-bold text-xs min-h-[48px] shadow-2xs group"
            >
              <div className="p-2 rounded-lg bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB] group-hover:scale-110 transition-transform">
                <UserPlus className="w-4 h-4 shrink-0" />
              </div>
              <span>Assisted Field Enrollment</span>
            </Link>

            <Link
              href="/officer/export"
              id="action-export"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/90 hover:bg-slate-50 border border-slate-200/90 hover:border-[#BACEEB] text-slate-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] font-bold text-xs min-h-[48px] shadow-2xs group"
            >
              <div className="p-2 rounded-lg bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] group-hover:scale-110 transition-transform">
                <Download className="w-4 h-4 shrink-0" />
              </div>
              <span>Export Case Datasets</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
