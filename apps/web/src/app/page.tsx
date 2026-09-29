import Link from 'next/link';
import { Metadata } from 'next';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe2,
  GraduationCap,
  Briefcase,
  Home,
  FileText,
  Phone,
  Users,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import {
  IndicEar,
  IndicChakra,
} from '@/components/icons/indic';

export const metadata: Metadata = {
  title: 'Kural Sevi — Voice-First Livelihood Intelligence (PM-AJAY GIA)',
  description:
    'Voice-first intake, multilingual AI profiling, and explainable NSQF-aligned livelihood pathway recommendations for Scheduled Caste (SC) communities under PM-AJAY GIA.',
};

const PM_AJAY_SCHEMES = [
  {
    id: 'skill-dev',
    icon: GraduationCap,
    iconBg: 'bg-[#0B3064]',
    cardBg: 'bg-[#EAF1FB] border-[#BACEEB]',
    accentColor: 'text-[#0B3064]',
    title: 'Skill Development & Training',
    subtitle: 'NSQF-Aligned Vocational Pathways',
    description:
      'Free NSQF-certified skill training in over 40 trades — from textile & tailoring to electronics and construction — mapped to QP-NOS competency standards for SC youth aged 18–45.',
    benefitTags: ['Free Training', 'Certificate on Completion', 'Job Placement Support'],
    coverage: '₹15,000 – ₹1,00,000 stipend support',
  },
  {
    id: 'livelihood',
    icon: Briefcase,
    iconBg: 'bg-[#E05A1B]',
    cardBg: 'bg-[#FFF4ED] border-[#FDD8C2]',
    accentColor: 'text-[#C24810]',
    title: 'Livelihood & Self-Employment',
    subtitle: 'GIA Grant Support for Micro-Enterprises',
    description:
      'Grant-in-Aid (GIA) for starting micro-enterprises, agricultural support, animal husbandry, and artisan livelihoods. Covers toolkits, working capital, and market linkage for SC households below poverty line.',
    benefitTags: ['Up to ₹10 Lakh Grant', 'No Collateral Required', 'SHG Linkage'],
    coverage: 'Direct benefit transfer to Jan Dhan account',
  },
  {
    id: 'infrastructure',
    icon: Home,
    iconBg: 'bg-[#0A783C]',
    cardBg: 'bg-[#EDF9F1] border-[#BBE8CB]',
    accentColor: 'text-[#0A783C]',
    title: 'Village Infrastructure & Housing',
    subtitle: 'Adarsh Gram Development Fund',
    description:
      'Development of basic amenities in Scheduled Caste dominated habitations — drinking water, pucca roads, solar streetlights, community halls, and anganwadi centers under the Adarsh Gram scheme.',
    benefitTags: ['Community Infrastructure', 'Solar & Water', 'Road Connectivity'],
    coverage: '100 highest-density SC villages per district',
  },
  {
    id: 'social-protection',
    icon: FileText,
    iconBg: 'bg-[#0B3064]',
    cardBg: 'bg-[#EAF1FB] border-[#BACEEB]',
    accentColor: 'text-[#0B3064]',
    title: 'Social Protection & Welfare',
    subtitle: 'Digital Verified Certificate & Entitlement',
    description:
      'Tamper-proof QR-verified digital certificates for caste, income, and scheme eligibility. Integrated with DigiLocker, Aadhaar e-KYC, and PM-JANMAN for last-mile grievance redressal and pension disbursement.',
    benefitTags: ['DigiLocker Integration', 'Aadhaar-Linked', 'PM-JANMAN Benefits'],
    coverage: 'Direct grievance resolution in 30 days',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Phone,
    color: 'text-[#0A783C]',
    bg: 'bg-[#EDF9F1] border-[#BBE8CB]',
    title: 'Village Panchayat Intake',
    desc: 'Beneficiary visits the Gram Panchayat Kiosk. Kiosk operator registers them with voice-based IVR intake in Tamil, Hindi, or Telugu — no literacy required.',
  },
  {
    step: '02',
    icon: Users,
    color: 'text-[#E05A1B]',
    bg: 'bg-[#FFF4ED] border-[#FDD8C2]',
    title: 'AI Profiling & Matching',
    desc: 'The AI engine transcribes the voice call, profiles the beneficiary against NSQF QP-NOS skill standards, and recommends the 3 best livelihood pathways.',
  },
  {
    step: '03',
    icon: MapPin,
    color: 'text-[#0B3064]',
    bg: 'bg-[#EAF1FB] border-[#BACEEB]',
    title: 'District Officer Review',
    desc: "The District Welfare Officer reviews the AI recommendation, verifies eligibility, and approves the beneficiary's livelihood certificate with a digital signature.",
  },
  {
    step: '04',
    icon: FileText,
    color: 'text-[#0A783C]',
    bg: 'bg-[#EDF9F1] border-[#BBE8CB]',
    title: 'Certificate & Benefits',
    desc: 'A tamper-proof QR-verified PDF certificate is issued instantly. Scheme benefits are disbursed directly to the beneficiary\'s Jan Dhan account.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-slate-800 selection:bg-[#0B3064]/10 selection:text-[#0B3064] relative overflow-hidden flex flex-col">
      {/* Universal 3px National Governance Saffron Accent Strip */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#E05A1B] z-50 shadow-xs" aria-hidden="true" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(11,48,100,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0B3064] flex items-center justify-center text-white shadow-sm shadow-[#0B3064]/20 group-hover:scale-105 transition-transform">
              <IndicEar className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#0B3064] font-display">
                  Kural Sevi
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] font-mono">
                  PM-AJAY
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                குரல் செவி · National Livelihood Intelligence Portal
              </p>
            </div>
          </Link>

          {/* Quick Nav */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF9F1] border border-[#BBE8CB] text-[#0A783C]">
              <span className="w-2 h-2 rounded-full bg-[#0A783C] animate-pulse" />
              <span className="font-mono text-[11px] font-bold">Telephony & AI Active</span>
            </div>
            <a href="#schemes" className="hover:text-[#0B3064] transition-colors">
              PM-AJAY Schemes
            </a>
            <a href="#how-it-works" className="hover:text-[#0B3064] transition-colors">
              How It Works
            </a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              id="header-login-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-14 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Ministry Badge */}
        <div className="inline-flex items-center gap-2 bg-[#EAF1FB] border border-[#BACEEB] px-4 py-1.5 rounded-full text-xs font-bold text-[#0B3064] mb-6 shadow-2xs">
          <IndicChakra className="w-4 h-4 text-[#0B3064]" strokeWidth={2.4} />
          <span>Ministry of Social Justice & Empowerment · Government of India · PM-AJAY GIA</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0B3064] font-display mb-4 max-w-5xl mx-auto leading-[1.1]">
          Voice-First Livelihood Intelligence for Rural SC Beneficiaries
        </h1>

        <p className="text-slate-600 text-base sm:text-lg mb-8 max-w-3xl mx-auto leading-relaxed font-normal font-sans">
          Bridging the digital divide for Scheduled Caste (SC) citizens across Tamil Nadu through native conversational
          telephony intake, automated NSQF QP-NOS skill matching, and tamper-proof QR-verified livelihood pathways under{' '}
          <strong className="text-[#0B3064]">PM-AJAY GIA</strong>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg"
          >
            <Lock className="w-4 h-4" />
            Access Your Portal
            <ChevronRight className="w-4 h-4" />
          </Link>
          <a
            href="#schemes"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm transition-all shadow-2xs"
          >
            Learn About PM-AJAY Schemes
          </a>
        </div>

        {/* METRICS BAR */}
        <div className="py-6 px-8 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(11,48,100,0.04)] grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-5xl mx-auto">
          <div>
            <div className="text-3xl font-bold text-[#0B3064] font-display">100%</div>
            <div className="text-xs text-slate-500 font-sans mt-0.5 font-medium">Voice-First Intake (Tamil / Hindi)</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#E05A1B] font-display">40+</div>
            <div className="text-xs text-slate-500 font-sans mt-0.5 font-medium">NSQF Certified Roles Mapped</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0A783C] font-display">38</div>
            <div className="text-xs text-slate-500 font-sans mt-0.5 font-medium">Tamil Nadu Districts Enabled</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0B3064] font-display">30-Day</div>
            <div className="text-xs text-slate-500 font-sans mt-0.5 font-medium">Grievance Resolution SLA</div>
          </div>
        </div>
      </section>

      {/* PM-AJAY SCHEMES SECTION */}
      <section id="schemes" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#EAF1FB] border border-[#BACEEB] px-4 py-1.5 rounded-full text-xs font-bold text-[#0B3064] mb-4 shadow-2xs">
            <IndicChakra className="w-3.5 h-3.5" strokeWidth={2.4} />
            <span>PM-AJAY Grant-in-Aid Programmes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0B3064] font-display mb-3 tracking-tight">
            What PM-AJAY Offers for SC Communities
          </h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto font-sans">
            PM Anudaan for Janjati and Adivasi Yojana provides comprehensive support covering skill training,
            livelihood grants, village infrastructure, and social protection for Scheduled Caste households.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PM_AJAY_SCHEMES.map((scheme) => {
            const Icon = scheme.icon;
            return (
              <div
                key={scheme.id}
                className={`p-7 rounded-2xl border ${scheme.cardBg} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-5`}
              >
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${scheme.iconBg} flex items-center justify-center shrink-0 shadow-md`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold font-display leading-tight mb-0.5 ${scheme.accentColor}`}>
                      {scheme.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                      {scheme.subtitle}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-700 leading-relaxed font-sans">
                  {scheme.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {scheme.benefitTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#0A783C]" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Coverage */}
                <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 font-sans">{scheme.coverage}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider font-mono ${scheme.accentColor}`}>
                    PM-AJAY GIA
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0B3064] font-display mb-3 tracking-tight">
            How Kural Sevi Works
          </h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto font-sans">
            A simple 4-step process from village intake to scheme benefit disbursement — entirely digitized and voice-accessible.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className={`p-6 rounded-2xl border ${step.bg} flex flex-col gap-4 hover:shadow-md transition-all duration-200 relative overflow-hidden`}
              >
                <div className="absolute top-3 right-3 text-5xl font-black font-display text-black/[0.04] leading-none select-none">
                  {step.step}
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white shadow-sm border border-black/5`}>
                  <Icon className={`w-5 h-5 ${step.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B3064] font-display text-base mb-2 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SIGN IN CTA BANNER */}
      <section className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0B3064] to-[#144282] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white/80 border border-white/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure Role-Based Access</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
              Ready to Access Your Portal?
            </h2>
            <p className="text-sm text-white/70 leading-relaxed font-sans">
              Designated officials — District Welfare Officers, Gram Panchayat Kiosk Operators, and Central
              Administrators — can sign in to their dedicated workspace.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#E05A1B] hover:bg-[#c44c14] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <Lock className="w-4 h-4" />
              Portal Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/70 py-8 px-4 sm:px-6 lg:px-8 backdrop-blur-md mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0B3064] flex items-center justify-center shadow-2xs">
              <IndicEar className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[#0B3064] font-bold text-sm font-display">Kural Sevi (குரல் செவி)</p>
              <p className="text-[11px] text-slate-500 font-sans">
                Department of Social Welfare & Women Empowerment · Government of Tamil Nadu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0B3064]" />
              DPDP Act 2023 Compliant
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0A783C]" />
              NSQF Aligned
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <Globe2 className="w-3.5 h-3.5 text-[#E05A1B]" />
              Multilingual (Tamil, Hindi, Telugu)
            </span>
          </div>

          <div className="text-slate-500 text-center md:text-right font-sans">
            <p className="font-semibold text-slate-700">PM-AJAY GIA · Problem Statement #26097</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Strict Role-Based Access Control Protected</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
