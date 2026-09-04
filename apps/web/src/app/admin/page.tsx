import { Metadata } from 'next';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookOpen, Database, Sliders, Activity, PhoneCall } from 'lucide-react';

export const metadata: Metadata = { title: 'System Administration — Kural Sevi' };

export default function AdminPage() {
  const adminModules = [
    {
      title: 'Call Records & Voice Transcripts',
      desc: 'Real-time turn-by-turn telephony transcripts, extracted 7-field livelihood profiles, and live audio logs.',
      badge: 'Live Dashboard',
      badgeVariant: 'chakra' as const,
      icon: PhoneCall,
      iconColor: 'text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB]',
      href: 'http://localhost:8000/call-records',
      external: true,
    },
    {
      title: 'NSQF Qualification Packs Catalog',
      desc: '40+ QP-NOS job roles seeded with sector skill council codes, minimum education criteria, and training hours.',
      badge: '40 Active Trades',
      badgeVariant: 'chakra' as const,
      icon: BookOpen,
      iconColor: 'text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB]',
    },
    {
      title: 'Ecosystem Data Ingestion',
      desc: 'Scheduled cron connectors for e-Shram unorganized worker registry, Udyam MSME cluster data, and SIDH vacancy tracking.',
      badge: 'Weekly Sync OK',
      badgeVariant: 'green' as const,
      icon: Database,
      iconColor: 'text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB]',
    },
    {
      title: 'Multi-Criteria Weight Tuning',
      desc: 'Calibrate Analytic Hierarchy Process (AHP) criteria weights (mobility radius, income potential, skill bridge duration).',
      badge: 'Tier 2 Config',
      badgeVariant: 'saffron' as const,
      icon: Sliders,
      iconColor: 'text-[#C24810] bg-[#FFF4ED] border border-[#FDD8C2]',
    },
    {
      title: 'Infrastructure & Engine Health',
      desc: 'Telemetry monitors for Sarvam AI Voice APIs, Gemini 2.5 embeddings, Supabase pgvector index, and Twilio IVR gateway.',
      badge: 'All Systems Nominal',
      badgeVariant: 'green' as const,
      icon: Activity,
      iconColor: 'text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB]',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B3064] tracking-tight">
          System Administration & Governance
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
          NSQF national qualification catalog management, AI matching engine weights, and data ingestion pipeline controls
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminModules.map((mod) => {
          const Icon = mod.icon;
          const cardContent = (
            <Card key={mod.title} className="bg-[var(--bg-card)] border-[var(--border)] card-hover cursor-pointer shadow-2xs h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg shadow-2xs ${mod.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-sm sm:text-base text-[#0B3064] leading-tight">
                      {mod.title}
                    </h2>
                  </div>
                  <Badge variant={mod.badgeVariant}>{mod.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{mod.desc}</p>
              </CardContent>
            </Card>
          );

          if (mod.href) {
            return (
              <a
                key={mod.title}
                href={mod.href}
                target={mod.external ? '_blank' : undefined}
                rel={mod.external ? 'noreferrer' : undefined}
                className="block no-underline"
              >
                {cardContent}
              </a>
            );
          }

          return cardContent;
        })}
      </div>
    </div>
  );
}
