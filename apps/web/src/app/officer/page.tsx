import { Metadata } from 'next';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { formatDateShort } from '@/lib/utils';

export const metadata: Metadata = { title: 'Overview — Officer Dashboard' };

// Demo data — replace with Supabase fetch in production
const DEMO_STATS = {
  totalCases: 142, pendingReview: 23, slaBreached: 4,
  completedToday: 8, highConfidence: 67, consultantRequired: 12,
};

const DEMO_RECENT_CASES = [
  { id: '1', case_id: 'KS-2026-00142', district: 'Namakkal', confidence: 'high', days_pending: 1, trade: 'Tailoring (APP/Q0301)', created_at: new Date().toISOString() },
  { id: '2', case_id: 'KS-2026-00141', district: 'Tiruppur', confidence: 'medium', days_pending: 2, trade: 'Food Processing (FIC/Q0601)', created_at: new Date().toISOString() },
  { id: '3', case_id: 'KS-2026-00140', district: 'Salem', confidence: 'needs_officer_review', days_pending: 3, trade: 'Weaving (TEX/Q4101)', created_at: new Date().toISOString() },
];

export default function OfficerOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Officer Overview</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            District-level case management and livelihood pathway review
          </p>
        </div>
        <div className="text-right text-xs text-[var(--text-muted)]">
          <p>Last aggregation: {formatDateShort(new Date().toISOString())}</p>
          <p className="text-amber-400/80">Batch mode — updated daily</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard id="stat-total" label="Total Cases" value={DEMO_STATS.totalCases} accent="indigo"
          icon={<span className="text-lg">⊞</span>} />
        <StatCard id="stat-pending" label="Pending Review" value={DEMO_STATS.pendingReview} accent="amber"
          icon={<span className="text-lg">⏳</span>}
          trend={{ value: -12, label: 'vs yesterday' }} />
        <StatCard id="stat-sla" label="SLA Breached" value={DEMO_STATS.slaBreached} accent="rose"
          icon={<span className="text-lg">⚠</span>} />
        <StatCard id="stat-done" label="Actioned Today" value={DEMO_STATS.completedToday} accent="emerald"
          icon={<span className="text-lg">✓</span>} />
        <StatCard id="stat-confidence" label="High Confidence" value={`${DEMO_STATS.highConfidence}%`} accent="sky"
          icon={<span className="text-lg">◈</span>} />
        <StatCard id="stat-consultant" label="Consultant Needed" value={DEMO_STATS.consultantRequired} accent="violet"
          icon={<span className="text-lg">★</span>} />
      </div>

      {/* Recent cases + SLA alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent cases */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">Recent Cases</h3>
              <Link href="/officer/cases" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  {['Case ID', 'District', 'Top Recommendation', 'Confidence', 'Days Pending'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_RECENT_CASES.map((c) => (
                  <tr key={c.id} className="border-b border-white/4 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link href={`/officer/cases/${c.id}`} className="font-mono text-indigo-300 hover:text-indigo-200 text-xs">{c.case_id}</Link>
                    </td>
                    <td className="px-6 py-3.5 text-[var(--text-secondary)] text-xs">{c.district}</td>
                    <td className="px-6 py-3.5 text-xs text-[var(--text-primary)]">{c.trade}</td>
                    <td className="px-6 py-3.5"><ConfidenceBadge label={c.confidence} size="sm" /></td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-semibold ${c.days_pending > 2 ? 'text-rose-400' : c.days_pending > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {c.days_pending}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Action required panel */}
        <div className="space-y-4">
          <Card className="border-rose-500/20">
            <CardHeader className="border-rose-500/10">
              <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                SLA Breached
              </h3>
            </CardHeader>
            <CardContent className="py-3 space-y-2">
              {[
                { case_id: 'KS-2026-00138', days: 4 },
                { case_id: 'KS-2026-00135', days: 5 },
                { case_id: 'KS-2026-00131', days: 6 },
                { case_id: 'KS-2026-00128', days: 7 },
              ].map(c => (
                <div key={c.case_id} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-rose-300">{c.case_id}</span>
                  <Badge variant="rose">{c.days}d overdue</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardHeader className="border-amber-500/10">
              <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                <span>★</span> Consultant Referrals Pending
              </h3>
            </CardHeader>
            <CardContent className="py-3">
              <p className="text-2xl font-bold text-amber-300">{DEMO_STATS.consultantRequired}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Self-employment pathways awaiting financial consultant assignment</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3">
            <Link href="/officer/cases?filter=pending" id="action-pending"
              className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-sm hover:bg-white/8 transition-colors border border-white/8 text-[var(--text-primary)]">
              ⏳ Review Pending Cases
            </Link>
            <Link href="/officer/planning" id="action-planning"
              className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-sm hover:bg-white/8 transition-colors border border-white/8 text-[var(--text-primary)]">
              ⬡ District Planning View
            </Link>
            <Link href="/officer/beneficiary/new" id="action-enroll"
              className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-sm hover:bg-white/8 transition-colors border border-white/8 text-[var(--text-primary)]">
              ⊕ Enroll New Beneficiary
            </Link>
            <Link href="/officer/export" id="action-export"
              className="flex items-center gap-2 glass px-4 py-2 rounded-lg text-sm hover:bg-white/8 transition-colors border border-white/8 text-[var(--text-primary)]">
              ⤴ Export Case Data
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
