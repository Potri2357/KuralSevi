import type { Metadata } from 'next';
import Link from 'next/link';
import { UserPlus, Search, ClipboardList, PhoneCall, Mic2, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Panchayat Kiosk Dashboard — Kural Sevi' };

const KIOSK_ACTIONS = [
  {
    id: 'new-beneficiary',
    title: 'New Beneficiary Registration',
    desc: 'Enrol a new SC beneficiary and capture their livelihood profile for NSQF-aligned skilling.',
    icon: UserPlus,
    href: '/officer/beneficiary/new',
    color: 'bg-[#EAF1FB] border-[#BACEEB] text-[#0B3064]',
    iconBg: 'bg-[#0B3064]',
    highlight: true,
  },
  {
    id: 'search-beneficiary',
    title: 'Search / Update Record',
    desc: 'Look up an existing beneficiary by name or case ID and update their profile.',
    icon: Search,
    href: '/officer/cases',
    color: 'bg-[#EDF9F1] border-[#BBE8CB] text-[#0A783C]',
    iconBg: 'bg-[#0A783C]',
  },
  {
    id: 'case-queue',
    title: 'Pending Case Review',
    desc: 'View cases awaiting officer approval from this Gram Panchayat.',
    icon: ClipboardList,
    href: '/officer/cases?filter=pending',
    color: 'bg-[#FFF4ED] border-[#FDD8C2] text-[#C24810]',
    iconBg: 'bg-[#C24810]',
  },
  {
    id: 'initiate-call',
    title: 'Initiate Voice Intake',
    desc: "Start an IVR call to a beneficiary's mobile for voice-based data capture.",
    icon: PhoneCall,
    href: '/officer/calls',
    color: 'bg-[#EAF1FB] border-[#BACEEB] text-[#0B3064]',
    iconBg: 'bg-[#0B3064]',
  },
];

export default function KioskDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome hero */}
      <div className="bg-white rounded-3xl border border-[#BBE8CB] shadow-[0_2px_20px_-4px_rgba(10,120,60,0.08)] p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="w-16 h-16 rounded-2xl bg-[#0A783C] flex items-center justify-center shrink-0 shadow-lg">
          <Mic2 className="w-9 h-9 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#0A783C] font-display mb-2 tracking-tight">
            Gram Panchayat Intake Portal
          </h1>
          <p className="text-slate-600 font-sans text-base leading-relaxed max-w-xl">
            Enrol SC beneficiaries for PM-AJAY GIA skilling support. All records are encrypted
            and synced to the District Planning Office in real time.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] rounded-full px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> DPDP Act 2023 Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] rounded-full px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Multilingual Support
            </span>
          </div>
        </div>
      </div>

      {/* Action grid */}
      <div>
        <h2 className="text-lg font-bold text-[#0B3064] mb-4 font-sans">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {KIOSK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                href={action.href}
                id={`kiosk-action-${action.id}`}
                className={`group flex items-start gap-5 p-6 rounded-2xl border ${action.color} transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer no-underline ${action.highlight ? 'ring-2 ring-[#0B3064]/10' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1 leading-tight">{action.title}</h3>
                  <p className="text-sm opacity-80 font-medium leading-relaxed">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Info footer */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center text-sm text-slate-500">
        <p className="font-medium">
          Need help? Contact your Block Development Officer or District Welfare Office.
        </p>
        <p className="mt-1 text-xs text-slate-400">Kiosk sessions are automatically logged for audit compliance.</p>
      </div>
    </div>
  );
}
