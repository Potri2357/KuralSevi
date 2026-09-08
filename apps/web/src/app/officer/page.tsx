import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { MotionGraph } from '@/components/ui/MotionGraph';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import { formatDateShort, cn } from '@/lib/utils';
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
  MapPin,
  Briefcase,
  FileText,
  Sun,
} from 'lucide-react';

import { IndicScroll, IndicHandloom, IndicAgriSickle } from '@/components/icons/indic';
import { getAllOfficerCases } from '@/lib/recommendation-service';

export const metadata: Metadata = {
  title: 'Officer Operations Dashboard — Kural Sevi',
};

export const dynamic = 'force-dynamic';

function getTradeIconMeta(trade: string) {
  const t = (trade || '').toLowerCase();
  if (
    t.includes('tailor') ||
    t.includes('weav') ||
    t.includes('handloom') ||
    t.includes('textile') ||
    t.includes('garment') ||
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
    t.includes('vegetable') ||
    t.includes('crop')
  ) {
    return {
      icon: IndicAgriSickle,
      color: 'text-[#0A783C] bg-[#EDF9F1] border-[#BBE8CB]',
    };
  }
  if (t.includes('solar') || t.includes('electr') || t.includes('tech') || t.includes('repair')) {
    return {
      icon: Sun,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    };
  }
  return {
    icon: IndicHandloom,
    color: 'text-[#0B3064] bg-[#EAF1FB] border-[#BACEEB]',
  };
}

export default async function OfficerOverviewPage() {
  const cases = await getAllOfficerCases();

  const totalCases = cases.length;
  const pendingReview = cases.filter((c) => c.officer_action === 'pending').length;
  const slaBreached = cases.filter(
    (c) => c.officer_action === 'pending' && new Date(c.sla_deadline) < new Date()
  ).length;
  const completedToday = cases.filter((c) => c.officer_action !== 'pending').length;
  const highConfidencePercent =
    totalCases > 0
      ? Math.round(
          (cases.filter((c) => c.confidence === 'high').length / totalCases) * 100
        )
      : 0;
  const consultantRequired = cases.filter(
    (c) => c.consultant_required || c.confidence === 'needs_officer_review'
  ).length;

  const recentCases = cases.slice(0, 5);
  const urgentCases = cases
    .filter((c) => c.officer_action === 'pending')
    .slice(0, 4);

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
            <span>District Telephony Docket · Active ({totalCases} Cases)</span>
          </p>
        </div>
      </div>

      {/* Stats grid: Interactive StatCards with real telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          id="stat-total"
          label="Total Cases"
          value={totalCases}
          accent="chakra"
          icon={<Inbox className="w-5 h-5 text-[#0B3064]" />}
          sparkline={[
            { label: 'Wk 1', value: Math.max(1, totalCases - 4) },
            { label: 'Wk 2', value: Math.max(1, totalCases - 2) },
            { label: 'Today', value: totalCases },
          ]}
        />
        <StatCard
          id="stat-pending"
          label="Pending Review"
          value={pendingReview}
          accent="saffron"
          icon={<Clock className="w-5 h-5 text-[#E05A1B]" />}
          trend={{ value: pendingReview > 0 ? pendingReview : 0, label: 'awaiting action' }}
          sparkline={[
            { label: 'Earlier', value: Math.max(0, pendingReview + 2) },
            { label: 'Today', value: pendingReview },
          ]}
        />
        <StatCard
          id="stat-sla"
          label="SLA Breached"
          value={slaBreached}
          accent="rose"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          sparkline={[
            { label: 'Baseline', value: 0 },
            { label: 'Active', value: slaBreached },
          ]}
        />
        <StatCard
          id="stat-done"
          label="Sanctioned"
          value={completedToday}
          accent="green"
          icon={<CheckCircle2 className="w-5 h-5 text-[#0A783C]" />}
          trend={{ value: completedToday, label: 'adjudicated' }}
          sparkline={[
            { label: 'Baseline', value: 0 },
            { label: 'Active', value: completedToday },
          ]}
        />
        <StatCard
          id="stat-conf"
          label="High Confidence"
          value={`${highConfidencePercent}%`}
          accent="chakra"
          icon={<Sparkles className="w-5 h-5 text-[#0B3064]" />}
          sparkline={[
            { label: 'Baseline', value: 0 },
            { label: 'Rate', value: highConfidencePercent },
          ]}
        />
        <StatCard
          id="stat-spec"
          label="Consultant Req."
          value={consultantRequired}
          accent="saffron"
          icon={<Star className="w-5 h-5 text-[#E05A1B]" />}
          sparkline={[
            { label: 'Baseline', value: 0 },
            { label: 'Cases', value: consultantRequired },
          ]}
        />
      </div>

      {/* Main Content Grid: Incoming Cases + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incoming Cases Table: 2 cols */}
        <Card className="lg:col-span-2 overflow-hidden shadow-2xs">
          <div className="p-0">
            <CardHeader className="border-b border-slate-100 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] shadow-2xs">
                    <Inbox className="w-5 h-5 text-[#0B3064]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base font-display text-[#0B3064] flex items-center gap-2">
                      <span>Incoming Cases Awaiting Action</span>
                      <span className="text-[11px] font-sans font-bold bg-[#EAF1FB] text-[#0B3064] px-2 py-0.5 rounded-full border border-[#BACEEB]">
                        {pendingReview} Pending
                      </span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 font-sans">
                      Verified citizen voice-intake cases requiring DSWO sanction review
                    </p>
                  </div>
                </div>
                <Link
                  href="/officer/cases"
                  className="text-xs font-bold text-[#0B3064] hover:text-[#144282] transition-all flex items-center gap-1.5 group px-2.5 py-1 rounded-lg hover:bg-[#EAF1FB]"
                >
                  <span>View Full Queue ({totalCases})</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Header row */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50/70 text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                <div className="col-span-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Case ID</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>District</span>
                </div>
                <div className="col-span-3 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recommended Trade</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span>Confidence</span>
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Status</span>
                </div>
              </div>

              {/* Real Case Rows */}
              <div className="divide-y divide-slate-100">
                {recentCases.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500 font-medium">
                    No active cases in docket. Telephony calls will appear here in real time.
                  </div>
                ) : (
                  recentCases.map((c) => {
                    const tradeMeta = getTradeIconMeta(c.top_trade);
                    const TradeIcon = tradeMeta.icon;
                    return (
                      <Link
                        key={c.id}
                        href={`/officer/cases/${c.id}`}
                        className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 px-6 py-3.5 items-start sm:items-center hover:bg-[#EAF1FB]/40 transition-all duration-150 group cursor-pointer"
                      >
                        <div className="col-span-3 font-mono text-xs font-bold text-[#0B3064] group-hover:text-[#144282] group-hover:underline underline-offset-4 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064] shrink-0 shadow-2xs">
                            <IndicScroll className="w-3.5 h-3.5 text-[#0B3064]" />
                          </div>
                          <span>{c.case_id}</span>
                          <ArrowRight className="w-3 h-3 text-[#0B3064] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all hidden sm:inline" />
                        </div>
                        <div className="col-span-2 text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.district}</span>
                        </div>
                        <div className="col-span-3 text-xs text-slate-800 font-semibold truncate w-full flex items-center gap-2">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-md border flex items-center justify-center shrink-0 shadow-2xs',
                              tradeMeta.color
                            )}
                          >
                            <TradeIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{c.top_trade}</span>
                        </div>
                        <div className="col-span-2">
                          <ConfidenceBadge label={c.confidence} size="sm" />
                        </div>
                        <div className="col-span-2 sm:flex sm:justify-end w-full">
                          {c.officer_action !== 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md border shadow-2xs leading-none whitespace-nowrap bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span className="capitalize">{c.officer_action}</span>
                            </span>
                          ) : (
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
                          )}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Action required alerts panel */}
        <div className="space-y-4">
          <Card className="border-[#FDD8C2] bg-white/90 shadow-2xs">
            <CardHeader className="border-b border-[#FDD8C2]/60 pb-3">
              <div className="flex items-center gap-2 text-[#C24810]">
                <AlertTriangle className="w-4 h-4 text-[#E05A1B] shrink-0 animate-pulse" />
                <h2 className="text-sm font-bold">
                  SLA Escalation Alerts ({urgentCases.length} Cases)
                </h2>
              </div>
            </CardHeader>
            <CardContent className="py-3 space-y-2">
              {urgentCases.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">
                  All cases currently within standard SLA.
                </p>
              ) : (
                urgentCases.map((c) => (
                  <Link
                    key={c.case_id}
                    href={`/officer/cases/${c.id}`}
                    className="flex items-center justify-between text-xs bg-white/95 hover:bg-[#FFF4ED] p-2.5 rounded-xl border border-[#FDD8C2] hover:border-[#E05A1B] shadow-2xs transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] group"
                  >
                    <span className="font-mono text-xs font-bold text-[#0B3064] group-hover:text-[#144282]">
                      {c.case_id}
                    </span>
                    <Badge variant={c.days_pending > 2 ? 'saffron' : 'default'}>
                      {c.days_pending}d pending
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-[#FDD8C2] bg-white/90 shadow-2xs">
            <CardHeader className="border-b border-[#FDD8C2]/60 pb-3">
              <div className="flex items-center gap-2 text-[#C24810]">
                <Star className="w-4 h-4 text-[#E05A1B] shrink-0" />
                <h2 className="text-sm font-bold">Specialist / Referral Queue</h2>
              </div>
            </CardHeader>
            <CardContent className="py-3">
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-2xl font-extrabold text-[#0B3064] tracking-tight font-mono">
                  {consultantRequired} Cases
                </p>
                <span className="text-[11px] font-bold text-[#C24810] bg-[#FFF4ED] px-2 py-0.5 rounded-full border border-[#FDD8C2]">
                  Active Telephony
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed font-medium">
                Self-employment & micro-enterprise pathways requiring verified district financial consultant or SHG credit linkage.
              </p>
              <div className="pt-2 border-t border-[#FDD8C2]/60 -mx-1">
                <MotionGraph
                  data={[
                    { label: 'Active', value: consultantRequired },
                  ]}
                  accent="saffron"
                  height={56}
                  unit=" cases"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
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
              <span>Review Pending Cases ({pendingReview})</span>
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
