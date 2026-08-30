import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import {
  CheckCircle2,
  ListChecks,
  UserCheck,
  Cpu,
  Volume2,
  Clock,
  type LucideIcon,
} from 'lucide-react';

interface AuditEvent {
  time: string;
  event: string;
  detail: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

interface Props {
  caseId: string;
  district: string;
}

export function ProfileAuditTimeline({ caseId, district }: Props) {
  const events: AuditEvent[] = [
    {
      time: '09:12',
      event: 'Informed Consent Captured',
      detail: 'DPDP Act 2023 compliant consent recorded via voice IVR in Tamil',
      icon: CheckCircle2,
      iconBg: 'bg-[#EDF9F1] border-[#BBE8CB]',
      iconColor: 'text-[#0A783C]',
    },
    {
      time: '09:14',
      event: 'Voice Profiling Intake Started',
      detail: '7 PM-AJAY mandated fields elicited and transcribed across 18-minute session',
      icon: ListChecks,
      iconBg: 'bg-[#EAF1FB] border-[#BACEEB]',
      iconColor: 'text-[#0B3064]',
    },
    {
      time: '09:32',
      event: 'Profile Readback Confirmed',
      detail: 'All 7 mandatory profile fields confirmed by beneficiary with 92% completeness score',
      icon: UserCheck,
      iconBg: 'bg-[#EAF1FB] border-[#BACEEB]',
      iconColor: 'text-[#0B3064]',
    },
    {
      time: '09:32',
      event: 'NSQF Match Engine Evaluated',
      detail: 'Stage 1: Hard filters excluded 2 ineligible trades; Stage 2: Semantic vector match shortlisted 15 QP-NOS candidates; Stage 3: Multi-criteria AHP ranked top 3',
      icon: Cpu,
      iconBg: 'bg-[#EAF1FB] border-[#BACEEB]',
      iconColor: 'text-[#0B3064]',
    },
    {
      time: '09:33',
      event: 'Recommendations Spoken in Tamil',
      detail: 'Top 3 ranked pathways read aloud to beneficiary via Sarvam Bulbul V3 Tamil TTS',
      icon: Volume2,
      iconBg: 'bg-[#EAF1FB] border-[#BACEEB]',
      iconColor: 'text-[#0B3064]',
    },
    {
      time: '09:33',
      event: 'Queued for District Officer Review',
      detail: `Case ${caseId} placed in ${district} Welfare Officer docket with 3-day SLA window`,
      icon: Clock,
      iconBg: 'bg-[#FFF4ED] border-[#FDD8C2]',
      iconColor: 'text-[#C24810]',
    },
  ];

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-2xs">
      <CardHeader>
        <h3 className="font-bold text-sm text-[#0B3064]">
          Chronological Intake & Verification Audit Trail
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Immutable event log generated during voice interaction and algorithmic scoring
        </p>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        {events.map((e, i) => {
          const Icon = e.icon;
          return (
            <div key={i} className="flex items-start gap-3.5">
              <div className="text-xs text-[var(--text-muted)] font-mono w-12 pt-1 font-bold shrink-0">
                {e.time}
              </div>
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${e.iconBg}`}
              >
                <Icon className={`w-4 h-4 ${e.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{e.event}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{e.detail}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
