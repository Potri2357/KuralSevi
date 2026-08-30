import { Metadata } from 'next';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = { title: 'Admin' };

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Administration</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">NSQF catalog, data ingestion, system configuration.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {([
          ['NSQF Catalog', '40+ QP-NOS codes seeded. Manage trades, update eligibility.', '40 Trades', 'indigo'],
          ['Data Ingestion', 'Track 1 (e-Shram, Udyam) and Track 2 (NSDC, SIDH) ingestion status.', 'Weekly Cron', 'emerald'],
          ['AHP Weight Tuning', 'Adjust AHP weights for the 7 ranking criteria (Tier 2).', 'Tier 2', 'amber'],
          ['System Health', 'Voice API, Supabase, Sarvam, Gemini, pgvector health.', 'All OK', 'emerald'],
        ] as [string,string,string,'indigo'|'emerald'|'amber'][]).map(([title, desc, badge, bv]) => (
          <Card key={title} className="card-hover cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">{title}</h3>
                <Badge variant={bv}>{badge}</Badge>
              </div>
            </CardHeader>
            <CardContent><p className="text-xs text-[var(--text-secondary)]">{desc}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
