import Link from 'next/link';
import { Metadata } from 'next';
import {
  Mic,
  Sparkles,
  ShieldCheck,
  Lock,
  GraduationCap,
  Briefcase,
  Home,
  FileText,
  ChevronRight,
  Users,
} from 'lucide-react';
import { IndicEar } from '@/components/icons/indic';
import { KuralSeviLogo } from '@/components/common/KuralSeviLogo';

export const metadata: Metadata = {
  title: 'Kural Sevi — Voice-First Livelihood Intelligence (PM-AJAY)',
  description:
    'Kural Sevi (குரல் செவி) provides voice-first citizen intake, AI-driven NSQF skill profiling, and PM-AJAY scheme linkages for rural Scheduled Caste (SC) communities.',
};

const KURAL_SEVI_PILLARS = [
  {
    icon: Mic,
    color: 'text-[#E05A1B]',
    bg: 'bg-[#FFF4ED] border-[#FDD8C2]',
    title: 'Voice-First Citizen Intake',
    desc: 'Citizens simply speak in their mother tongue (Tamil or Hindi) at the Gram Panchayat Kiosk. No digital literacy, paperwork, or typing required.',
  },
  {
    icon: Sparkles,
    color: 'text-[#0B3064]',
    bg: 'bg-[#EAF1FB] border-[#BACEEB]',
    title: 'AI NSQF Skill Profiling',
    desc: 'Intelligent AI transcribes voice responses, extracts skills and aspirations, and instantly recommends the 3 best NSQF QP-NOS certified vocational trades.',
  },
  {
    icon: ShieldCheck,
    color: 'text-[#0A783C]',
    bg: 'bg-[#EDF9F1] border-[#BBE8CB]',
    title: 'Direct Welfare Officer Approval',
    desc: 'District Welfare Officers review verified profiles and approve entitlements with tamper-proof digital verification and direct DBT disbursement.',
  },
];

const SCHEME_COMPONENTS = [
  {
    id: 'skills',
    icon: GraduationCap,
    badge: 'Jobs & Employment',
    title: 'Skill Development & Training',
    desc: 'Free NSQF-certified vocational training in 40+ trades (apparel, solar, automotive, electronics, healthcare) with ₹1,500/month stipend and job placement linkages.',
    amount: '100% Free · Monthly Stipend',
  },
  {
    id: 'livelihood',
    icon: Briefcase,
    badge: 'Self-Employment',
    title: 'Livelihood & Enterprise Grants',
    desc: 'Direct capital subsidies up to ₹50,000 for individual micro-enterprises and up to ₹10 Lakhs for Women Self-Help Groups (SHGs) with zero collateral.',
    amount: 'Grants up to ₹10 Lakhs',
  },
  {
    id: 'adarsh-gram',
    icon: Home,
    badge: 'Civic Infrastructure',
    title: 'Adarsh Gram (Model Village)',
    desc: 'Comprehensive infrastructure funding for drinking water, solar lighting, concrete roads, and digital Anganwadis in villages with >50% SC population.',
    amount: '₹21 Lakhs per Village',
  },
  {
    id: 'hostels',
    icon: FileText,
    badge: 'Education Support',
    title: 'Babu Jagjivan Ram Hostels',
    desc: 'Quality residential hostels and academic aid for SC boys and girls pursuing secondary, higher secondary, and technical vocational courses.',
    amount: 'Central Lodging & Support',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#0B3064]/10 selection:text-[#0B3064] flex flex-col">
      {/* 1. HEADER (Only Kural Sevi branding and Sign In button) */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Kural Sevi Logo & Subtitle */}
          <KuralSeviLogo
            href="/"
            size="lg"
            badge="PM-AJAY GIA"
            badgeVariant="green"
            subtitle="Voice-First Livelihood Intelligence Portal · Government of Tamil Nadu"
          />

          {/* Portal Access Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              id="header-login-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION: ALL ABOUT KURAL SEVI */}
      <section className="bg-gradient-to-b from-white to-slate-100/60 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 text-center">
          <div className="inline-flex items-center gap-2 bg-[#EAF1FB] border border-[#BACEEB] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0B3064] mb-5">
            <Mic className="w-3.5 h-3.5 text-[#E05A1B]" />
            <span>Voice-First Inclusive Governance · PM-AJAY GIA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#0B3064] font-display leading-[1.15] tracking-tight max-w-4xl mx-auto">
            Empowering Rural SC Communities Through Voice Intelligence
          </h1>

          <p className="text-base sm:text-xl text-slate-700 font-medium mt-4 max-w-3xl mx-auto">
            Kural Sevi (குரல் செவி) bridges the digital divide for Scheduled Caste citizens by turning voice into verified livelihood opportunities under PM-AJAY.
          </p>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal mt-3">
            Operating directly at Gram Panchayat kiosks, Kural Sevi eliminates complex paperwork and literacy barriers. Citizens simply speak in their native tongue — whether Tamil or Hindi — to register, explore certified NSQF vocational trades, and receive direct scheme benefits.
          </p>

          {/* Action Button: Centered & Aligned Prominently */}
          <div className="flex justify-center mt-8">
            <Link
              href="/login"
              id="hero-portal-btn"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white text-base font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Access Official Portal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3 Kural Sevi Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14 text-left">
            {KURAL_SEVI_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border ${pillar.bg} bg-white shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-3.5">
                      <Icon className={`w-5 h-5 ${pillar.color}`} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-display mb-1.5">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. PM-AJAY SCHEME SECTION: CONCISE & STRUCTURED */}
      <section id="pmajay-schemes" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B3064] bg-[#EAF1FB] px-3 py-1 rounded-full border border-[#BACEEB]">
              National Scheme Integration
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B3064] font-display mt-3 mb-2">
              Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kural Sevi directly connects beneficiaries to PM-AJAY, the flagship Centrally Sponsored Scheme by the
              Ministry of Social Justice and Empowerment, Government of India. The scheme provides three core components:
            </p>
          </div>

          {/* 4 Clean Scheme Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SCHEME_COMPONENTS.map((comp) => {
              const Icon = comp.icon;
              return (
                <div
                  key={comp.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#0B3064]/30 hover:bg-white transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B3064] shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {comp.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1.5 font-display">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {comp.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0A783C]">{comp.amount}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Beneficiary Eligibility & Intake Summary */}
          <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0B3064]" />
                <span>Eligibility & Application Process</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Open to Scheduled Caste (SC) citizens with annual family income up to ₹2.5 Lakh. Visit your nearest
                <strong> Village Panchayat Kiosk</strong> with your Aadhaar and Community Certificate. Assistance is voice-guided and 100% free of charge.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-slate-500 font-bold uppercase">National Helpline</div>
                <div className="text-sm font-bold text-slate-900 font-mono">1800-11-2001</div>
              </div>
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] text-white text-xs font-bold transition-all shadow-xs"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KuralSeviLogo
              href="/"
              size="xs"
              badge="PM-AJAY GIA"
              badgeVariant="green"
            />
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-500">
              Department of Social Welfare & Women Empowerment, Government of Tamil Nadu
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0A783C]" />
              DPDP Act 2023 Compliant
            </span>
            <span className="text-slate-300">·</span>
            <Link href="/login" className="font-bold text-[#0B3064] hover:underline">
              Portal Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
