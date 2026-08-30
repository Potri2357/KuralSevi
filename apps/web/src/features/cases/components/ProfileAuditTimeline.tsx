import { Card, CardContent } from '@/components/ui/Card';

interface AuditEvent {
  time: string;
  event: string;
  detail: string;
  icon: string;
  color: string;
}

interface Props {
  caseId: string;
  district: string;
}

export function ProfileAuditTimeline({ caseId, district }: Props) {
  const events: AuditEvent[] = [
    { time: '09:12', event: 'Consent captured', detail: 'DPDP-compliant consent via IVR in Tamil', icon: '✓', color: 'emerald' },
    { time: '09:14', event: 'Field collection started', detail: '7 PS-mandated fields collected over 18 minutes', icon: '⊞', color: 'indigo' },
    { time: '09:32', event: 'Profile confirmed', detail: 'All 7 fields confirmed by beneficiary (FR-3). Completeness: 92%', icon: '◈', color: 'indigo' },
    { time: '09:32', event: 'Recommendation engine run', detail: 'Stage 1 (hard filters): 2 trades excluded. Stage 2 (pgvector): 15 candidates. Stage 3 (AHP/TOPSIS): top 3 ranked.', icon: '🧠', color: 'violet' },
    { time: '09:33', event: 'Pathways read back to beneficiary', detail: 'Top 3 read in Tamil via Sarvam Bulbul V3', icon: '🎙️', color: 'sky' },
    { time: '09:33', event: 'Officer queue entry created', detail: `Case ${caseId} added to ${district} officer queue. SLA: 3 days`, icon: '⏳', color: 'amber' },
  ];

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        {events.map((e, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="text-xs text-[var(--text-muted)] font-mono w-10 pt-0.5">{e.time}</div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-${e.color}-500/10 text-${e.color}-400 border border-${e.color}-500/20`}>
              {e.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{e.event}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{e.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
