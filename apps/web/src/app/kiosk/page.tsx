import type { Metadata } from 'next';
import Link from 'next/link';
import { UserPlus, Search, PhoneCall, Mic2, CheckCircle2, ClipboardList } from 'lucide-react';

export const metadata: Metadata = { title: 'Panchayat Kiosk Dashboard — Kural Sevi' };

const KIOSK_ACTIONS = [
  {
    id: 'new-beneficiary',
    title: 'New Beneficiary Registration',
    desc: 'Enrol a new SC beneficiary and capture their livelihood profile for PM-AJAY GIA skilling support.',
    icon: UserPlus,
    href: '/kiosk/intake',
    color: 'bg-[#EAF1FB] border-[#BACEEB] text-[#0B3064]',
    iconBg: 'bg-[#0B3064]',
    highlight: true,
    badge: 'PRIMARY',
  },
  {
    id: 'initiate-call',
    title: 'Voice Intake Call',
    desc: "Start an IVR call to a beneficiary's mobile for voice-based data capture in Tamil or Hindi.",
    icon: PhoneCall,
    href: '/officer/calls',
    color: 'bg-[#EDF9F1] border-[#BBE8CB] text-[#0A783C]',
    iconBg: 'bg-[#0A783C]',
  },
  {
    id: 'search-beneficiary',
    title: 'Search / Update Record',
    desc: 'Look up an existing beneficiary by name or case ID and update their profile details.',
    icon: Search,
    href: '/officer/cases',
    color: 'bg-[#FFF4ED] border-[#FDD8C2] text-[#C24810]',
    iconBg: 'bg-[#C24810]',
  },
  {
    id: 'case-queue',
    title: 'Pending Case Review',
    desc: 'View cases from this Gram Panchayat that are awaiting District Officer approval.',
    icon: ClipboardList,
    href: '/officer/cases?filter=pending',
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
            Enrol SC beneficiaries for PM-AJAY GIA skilling and livelihood support. All records are
            encrypted and synced to the District Planning Office in real time.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] rounded-full px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> DPDP Act 2023 Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] rounded-full px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Multilingual Support
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C24810] bg-[#FFF4ED] border border-[#FDD8C2] rounded-full px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> PM-AJAY GIA
            </span>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <Link
        href="/kiosk/intake"
        id="kiosk-primary-intake"
        className="group flex items-center justify-between w-full p-7 rounded-2xl bg-gradient-to-r from-[#0B3064] to-[#144282] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-white/60 mb-1 font-mono">Primary Action</div>
            <h2 className="text-xl font-bold font-display leading-tight">New Beneficiary Intake</h2>
            <p className="text-sm text-white/75 font-sans mt-0.5">
              Register a new village citizen for PM-AJAY GIA livelihood support
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
          <span className="text-lg font-bold">→</span>
        </div>
      </Link>

      {/* Action grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 font-mono">Other Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {KIOSK_ACTIONS.filter((a) => a.id !== 'new-beneficiary').map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.id}
                href={action.href}
                id={`kiosk-action-${action.id}`}
                className={`group flex items-start gap-4 p-5 rounded-2xl border ${action.color} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer no-underline`}
              >
                <div className={`w-10 h-10 rounded-xl ${action.iconBg} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 leading-tight">{action.title}</h3>
                  <p className="text-xs opacity-75 font-medium leading-relaxed">{action.desc}</p>
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
