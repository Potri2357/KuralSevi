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
  CheckCircle,
  Banknote,
  Smartphone,
  Building,
  Award,
  ArrowRight,
  Zap,
  Scissors,
  SunMedium,
  HeartPulse,
  Wrench,
  Cpu,
  Store,
} from 'lucide-react';
import { KuralSeviLogo } from '@/components/common/KuralSeviLogo';

export const metadata: Metadata = {
  title: 'Kural Sevi — Voice-First Livelihood Intelligence (PM-AJAY)',
  description:
    'Kural Sevi (குரல் செவி) provides voice-first citizen intake, AI-driven NSQF skill profiling, and PM-AJAY scheme linkages for rural Scheduled Caste (SC) communities.',
};

const HERO_FEATURE_CHIPS = [
  { label: 'Tamil Voice ASR (குரல்)', icon: Mic, variant: 'chip-saffron' },
  { label: 'AI NSQF Skill Profiling', icon: Sparkles, variant: 'chip-chakra' },
  { label: 'DPDP Act 2023 Encrypted', icon: ShieldCheck, variant: 'chip-green' },
  { label: '₹1,500/Month Stipend', icon: Banknote, variant: 'chip-amber' },
  { label: 'Gram Panchayat Kiosks', icon: Building, variant: 'chip-purple' },
  { label: 'Direct DBT Bank Transfer', icon: CheckCircle, variant: 'chip-chakra' },
  { label: 'WhatsApp & QR Docket', icon: Smartphone, variant: 'chip-saffron' },
  { label: '40+ Certified QP-NOS Trades', icon: Award, variant: 'chip-green' },
];

const VOCATIONAL_SECTOR_CHIPS = [
  { name: 'Apparel & Handloom', icon: Scissors, code: 'AMH/Q0301', sample: 'Sewing Machine Operator', variant: 'chip-saffron', color: '#E05A1B' },
  { name: 'Solar PV & Clean Energy', icon: SunMedium, code: 'SGJ/Q0101', sample: 'Solar PV Rooftop Installer', variant: 'chip-amber', color: '#D97706' },
  { name: 'Healthcare & Nursing', icon: HeartPulse, code: 'HSS/Q5101', sample: 'General Duty Assistant', variant: 'chip-green', color: '#0A783C' },
  { name: 'Automotive & EV Tech', icon: Wrench, code: 'ASC/Q1402', sample: 'Automotive Service Tech', variant: 'chip-chakra', color: '#0B3064' },
  { name: 'Electronics & IT', icon: Cpu, code: 'ELE/Q4601', sample: 'Field Tech - Computing', variant: 'chip-purple', color: '#7C3AED' },
  { name: 'Micro-Enterprise & SHGs', icon: Store, code: 'MGT/Q0102', sample: 'SHG Micro-Business Lead', variant: 'chip-saffron', color: '#C24810' },
];

const KURAL_SEVI_PILLARS = [
  {
    icon: Mic,
    color: 'text-[#E05A1B]',
    borderTop: 'bg-gradient-to-r from-[#E05A1B] to-[#F59E0B]',
    bgLight: 'bg-[#FFF4ED]',
    borderLight: 'border-[#FDD8C2]',
    title: 'Voice-First Citizen Intake',
    desc: 'Citizens simply speak in their mother tongue (Tamil or Hindi) at the Gram Panchayat Kiosk. No digital literacy, paperwork, or typing required.',
    chips: [
      { label: 'Tamil & Hindi Dialects', variant: 'chip-saffron' },
      { label: 'Hands-Free Speech', variant: 'chip-slate' },
      { label: 'Zero Paperwork', variant: 'chip-saffron' },
    ],
  },
  {
    icon: Sparkles,
    color: 'text-[#0B3064]',
    borderTop: 'bg-gradient-to-r from-[#0B3064] to-[#1D4ED8]',
    bgLight: 'bg-[#EAF1FB]',
    borderLight: 'border-[#BACEEB]',
    title: 'AI NSQF Skill Profiling',
    desc: 'Intelligent AI transcribes voice responses, extracts skills and aspirations, and instantly recommends the 3 best NSQF QP-NOS certified vocational trades.',
    chips: [
      { label: 'AI QP-NOS Matching', variant: 'chip-chakra' },
      { label: 'NSQF Levels 3–5', variant: 'chip-slate' },
      { label: 'Instant Gap Analysis', variant: 'chip-chakra' },
    ],
  },
  {
    icon: ShieldCheck,
    color: 'text-[#0A783C]',
    borderTop: 'bg-gradient-to-r from-[#0A783C] to-[#10B981]',
    bgLight: 'bg-[#EDF9F1]',
    borderLight: 'border-[#BBE8CB]',
    title: 'Direct Welfare Officer Approval',
    desc: 'District Welfare Officers review verified profiles and approve entitlements with tamper-proof digital verification and direct DBT disbursement.',
    chips: [
      { label: 'Direct DBT Bank Pay', variant: 'chip-green' },
      { label: 'DPDP Act 2023', variant: 'chip-slate' },
      { label: 'Officer Sanction', variant: 'chip-green' },
    ],
  },
];

const SCHEME_COMPONENTS = [
  {
    id: 'skills',
    icon: GraduationCap,
    badge: 'Jobs & Employment',
    badgeVariant: 'chip-chakra',
    accentBorder: 'border-t-4 border-t-[#0B3064]',
    iconBg: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
    title: 'Skill Development & Training',
    desc: 'Free NSQF-certified vocational training in 40+ trades (apparel, solar, automotive, electronics, healthcare) with ₹1,500/month stipend and job placement linkages.',
    amount: '100% Free · Monthly Stipend',
    chips: ['₹1,500/Mo Stipend', 'Free Boarding', 'Job Placement'],
  },
  {
    id: 'livelihood',
    icon: Briefcase,
    badge: 'Self-Employment',
    badgeVariant: 'chip-saffron',
    accentBorder: 'border-t-4 border-t-[#E05A1B]',
    iconBg: 'bg-[#FFF4ED] text-[#E05A1B] border-[#FDD8C2]',
    title: 'Livelihood & Enterprise Grants',
    desc: 'Direct capital subsidies up to ₹50,000 for individual micro-enterprises and up to ₹10 Lakhs for Women Self-Help Groups (SHGs) with zero collateral.',
    amount: 'Grants up to ₹10 Lakhs',
    chips: ['Up to ₹50,000 Individual', '₹10L Women SHG', 'Zero Collateral'],
  },
  {
    id: 'adarsh-gram',
    icon: Home,
    badge: 'Civic Infrastructure',
    badgeVariant: 'chip-green',
    accentBorder: 'border-t-4 border-t-[#0A783C]',
    iconBg: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]',
    title: 'Adarsh Gram (Model Village)',
    desc: 'Comprehensive infrastructure funding for drinking water, solar lighting, concrete roads, and digital Anganwadis in villages with >50% SC population.',
    amount: '₹21 Lakhs per Village',
    chips: ['₹21 Lakhs Grant', 'Solar Lighting', 'RO Water & Roads'],
  },
  {
    id: 'hostels',
    icon: FileText,
    badge: 'Education Support',
    badgeVariant: 'chip-purple',
    accentBorder: 'border-t-4 border-t-[#7C3AED]',
    iconBg: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
    title: 'Babu Jagjivan Ram Hostels',
    desc: 'Quality residential hostels and academic aid for SC boys and girls pursuing secondary, higher secondary, and technical vocational courses.',
    amount: 'Central Lodging & Support',
    chips: ['Free Accommodation', 'Secondary & College', 'Modern Amenities'],
  },
];

const IMPACT_STATS = [
  { value: '40+', label: 'Certified NSQF Trades', chipVariant: 'chip-chakra', subtext: 'In 12 high-growth sectors' },
  { value: '100%', label: 'Voice-First & Paperless', chipVariant: 'chip-saffron', subtext: 'Native Tamil & Hindi speech' },
  { value: '₹10L', label: 'Max Scheme Subsidy', chipVariant: 'chip-green', subtext: 'PM-AJAY GIA grant linkage' },
  { value: '38', label: 'Districts of Tamil Nadu', chipVariant: 'chip-purple', subtext: 'Gram Panchayat kiosks' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-slate-800 font-sans selection:bg-[#0B3064]/10 selection:text-[#0B3064] flex flex-col relative overflow-x-clip">
      {/* Universal National Governance Tri-Color Accent Strip (Saffron -> White/Blue -> Green) */}
      <div
        className="fixed top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-[#E05A1B] via-[#0B3064] to-[#0A783C] z-50 shadow-xs"
        aria-hidden="true"
      />

      {/* Ambient background glow orbs for glass refraction (Isolated in overflow-hidden to prevent sticky breaks) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute -top-10 left-1/4 w-[36rem] h-[36rem] bg-gradient-to-br from-[#0B3064]/8 to-[#1D4ED8]/4 rounded-full blur-3xl" />
        <div className="absolute top-72 -right-10 w-[32rem] h-[32rem] bg-gradient-to-br from-[#E05A1B]/10 to-[#F59E0B]/5 rounded-full blur-3xl" />
        <div className="absolute top-[48rem] -left-20 w-[30rem] h-[30rem] bg-gradient-to-br from-[#0A783C]/8 to-[#10B981]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/4 w-[28rem] h-[28rem] bg-gradient-to-br from-[#7C3AED]/6 to-[#6366F1]/4 rounded-full blur-3xl" />
      </div>

      {/* 1. HEADER (Glassmorphic Navigation Bar) */}
      <header className="sticky top-0 z-40 w-full glass-nav backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Kural Sevi Logo & Subtitle */}
          <KuralSeviLogo
            href="/"
            size="lg"
            badge="PM-AJAY GIA"
            badgeVariant="green"
            subtitle="Voice-First Livelihood Intelligence Portal · Government of Tamil Nadu"
          />

          {/* Header Action Buttons & Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex chip chip-green text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A783C] animate-pulse" />
              <span>GIA System Live</span>
            </div>
            <Link
              href="/login"
              id="header-login-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white text-xs font-bold transition-all neuro-btn cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION: ALL ABOUT KURAL SEVI */}
      <section className="relative border-b border-slate-200/60 py-14 sm:py-20 text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Flagship Pill Chip */}
          <div className="inline-flex items-center gap-2.5 chip chip-chakra py-1.5 px-4 text-xs font-bold mb-6">
            <Mic className="w-3.5 h-3.5 text-[#E05A1B]" />
            <span>Voice-First Inclusive Governance · PM-AJAY GIA</span>
            <span className="w-2 h-2 rounded-full bg-[#0A783C] shadow-xs animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0B3064] font-display leading-[1.12] tracking-tight max-w-4xl mx-auto drop-shadow-xs">
            Empowering Rural SC Communities Through Voice Intelligence
          </h1>

          <p className="text-base sm:text-xl text-slate-700 font-medium mt-5 max-w-3xl mx-auto leading-relaxed">
            Kural Sevi (குரல் செவி) bridges the digital divide for Scheduled Caste citizens by turning natural speech into verified livelihood opportunities under PM-AJAY.
          </p>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal mt-3">
            Operating directly at Gram Panchayat kiosks, Kural Sevi eliminates paperwork and literacy hurdles. Citizens speak naturally in their native tongue to explore certified NSQF vocational trades and receive direct scheme benefits.
          </p>

          {/* Action Buttons: Tactile Neumorphic & Translucent Glass CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link
              href="/login"
              id="hero-portal-btn"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white text-base font-bold transition-all neuro-btn cursor-pointer shadow-[0_8px_20px_-4px_rgba(11,48,100,0.3)]"
            >
              <Lock className="w-4 h-4" />
              <span>Access Official Portal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login?role=panchayat_kiosk"
              id="hero-kiosk-btn"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-sm font-bold transition-all border border-[#BACEEB] shadow-[0_4px_16px_rgba(11,48,100,0.06)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              <Mic className="w-4 h-4 text-[#E05A1B]" />
              <span>Panchayat Kiosk Terminal</span>
            </Link>
          </div>

          {/* Feature Chips Ribbon: Color-coded Tactile Chips */}
          <div className="mt-10 pt-8 border-t border-slate-200/60">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3.5">
              Core Capabilities & Citizen Protections
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
              {HERO_FEATURE_CHIPS.map((chip, idx) => {
                const Icon = chip.icon;
                return (
                  <div
                    key={idx}
                    className={`chip ${chip.variant} chip-interactive py-1.5 px-3 text-xs font-semibold`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{chip.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 Kural Sevi Pillars: Hybrid Glass-Neumorphic Cards with Colored Headers & Tag Chips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 text-left">
            {KURAL_SEVI_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl neuro-glass card-hover flex flex-col justify-between relative overflow-hidden group border border-white/90 shadow-[6px_6px_20px_-2px_rgba(11,48,100,0.05),-6px_-6px_20px_0_rgba(255,255,255,0.95)]"
                >
                  {/* Top Color Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] ${pillar.borderTop}`} />

                  <div>
                    {/* Glowing Icon Well */}
                    <div
                      className={`w-12 h-12 rounded-xl ${pillar.bgLight} border ${pillar.borderLight} flex items-center justify-center mb-4 neuro-icon group-hover:scale-108 transition-all`}
                    >
                      <Icon className={`w-6 h-6 ${pillar.color}`} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 font-display mb-2 group-hover:text-[#0B3064] transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans mb-4">
                      {pillar.desc}
                    </p>
                  </div>

                  {/* Pillar Feature Chips */}
                  <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                    {pillar.chips.map((c, cIdx) => (
                      <span key={cIdx} className={`chip ${c.variant} text-[10px] py-0.5 px-2`}>
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. VOCATIONAL SECTORS & NSQF TRADE PATHWAYS (Interactive Chip UI Showcase) */}
      <section className="py-14 sm:py-16 border-b border-slate-200/60 bg-gradient-to-b from-transparent via-[#F0F6FE]/40 to-transparent relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 chip chip-saffron py-1 px-3.5 text-xs font-bold mb-3">
              <Zap className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>NSQF QP-NOS Certified Pathways</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B3064] font-display tracking-tight">
              Direct Linkage to High-Demand Vocational Sectors
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl mx-auto">
              Kural Sevi translates citizen voice responses into QP-NOS aligned vocational qualifications with monthly stipends and placement guarantees under PM-AJAY GIA.
            </p>
          </div>

          {/* Sector Cards with Integrated Chip UI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VOCATIONAL_SECTOR_CHIPS.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl neuro-glass card-hover border border-white/90 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center neuro-icon"
                          style={{ color: sec.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B3064] transition-colors leading-tight">
                            {sec.name}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono font-medium">
                            QP Code: {sec.code}
                          </span>
                        </div>
                      </div>
                      <span className={`chip ${sec.variant} text-[10px] py-0.5 px-2`}>
                        Level 3–4
                      </span>
                    </div>

                    <div className="p-3 rounded-xl neuro-inset mt-2 bg-slate-50/70">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        Featured Trade Pathway
                      </div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#0A783C] shrink-0" />
                        <span>{sec.sample}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="chip chip-green text-[10px] py-0.5 px-2">
                      ₹1,500/Mo Stipend Included
                    </span>
                    <Link
                      href="/login"
                      className="font-bold text-[#0B3064] hover:text-[#E05A1B] inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. PM-AJAY SCHEME SECTION: CONCISE & STRUCTURED */}
      <section id="pmajay-schemes" className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="chip chip-chakra text-xs font-bold uppercase tracking-wider mb-3">
              National Scheme Integration
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B3064] font-display mt-2 mb-2 tracking-tight">
              Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kural Sevi directly connects beneficiaries to PM-AJAY, the flagship Centrally Sponsored Scheme by the
              Ministry of Social Justice and Empowerment, Government of India. The scheme provides three core components:
            </p>
          </div>

          {/* 4 Clean Scheme Cards: Neumorphic Glass Cards with Color Accents & Chips */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SCHEME_COMPONENTS.map((comp) => {
              const Icon = comp.icon;
              return (
                <div
                  key={comp.id}
                  className={`p-5 rounded-2xl neuro-glass card-hover flex flex-col justify-between relative group ${comp.accentBorder} shadow-[6px_6px_20px_-2px_rgba(11,48,100,0.05),-6px_-6px_20px_0_rgba(255,255,255,0.95)]`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center neuro-icon group-hover:scale-108 transition-all ${comp.iconBg}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`chip ${comp.badgeVariant} text-[10px] py-0.5 px-2`}>
                        {comp.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mb-1.5 font-display group-hover:text-[#0B3064] transition-colors">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {comp.desc}
                    </p>
                  </div>

                  <div>
                    {/* Component Sub-Chips */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {comp.chips.map((tag, tIdx) => (
                        <span key={tIdx} className="chip chip-slate text-[9.5px] py-0.5 px-1.5">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0A783C] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A783C] animate-pulse" />
                        {comp.amount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Metrics Impact Chips Ribbon */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {IMPACT_STATS.map((stat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl neuro-glass text-center border border-white/90 shadow-[4px_4px_16px_-2px_rgba(11,48,100,0.04),-4px_-4px_16px_0_rgba(255,255,255,0.95)]"
              >
                <div className={`chip ${stat.chipVariant} text-base font-extrabold px-3 py-1 mb-1.5`}>
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-slate-800">{stat.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{stat.subtext}</div>
              </div>
            ))}
          </div>

          {/* Beneficiary Eligibility & Intake Summary: Glass-Neumorphic Box */}
          <div className="mt-10 p-6 sm:p-7 rounded-2xl neuro-glass border border-white/90 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-[8px_8px_24px_-4px_rgba(11,48,100,0.06),-8px_-8px_24px_0_rgba(255,255,255,0.95)]">
            {/* Top Tri-Color Strip */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#E05A1B] via-[#0B3064] to-[#0A783C]" />

            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="chip chip-saffron text-[10px] py-0.5 px-2 font-bold">
                  Village Level Assistance
                </span>
                <span className="chip chip-green text-[10px] py-0.5 px-2 font-bold">
                  100% Free
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EAF1FB] flex items-center justify-center text-[#0B3064] border border-[#BACEEB] neuro-icon">
                  <Users className="w-4 h-4 text-[#0B3064]" />
                </div>
                <span>Eligibility & Application Process</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Open to Scheduled Caste (SC) citizens with annual family income up to ₹2.5 Lakh. Visit your nearest
                <strong> Village Panchayat Kiosk</strong> with your Aadhaar and Community Certificate. Assistance is voice-guided in Tamil/Hindi and 100% free of charge.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-4">
              <div className="text-right hidden sm:block p-3 rounded-xl neuro-inset">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">National Helpline</div>
                <div className="text-sm font-bold text-[#0B3064] font-mono">1800-11-2001</div>
              </div>
              <Link
                href="/login"
                className="px-5 py-3 rounded-xl bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white text-xs font-bold transition-all neuro-btn whitespace-nowrap shadow-[0_6px_16px_-2px_rgba(11,48,100,0.3)]"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto glass-nav py-6 text-xs text-slate-500 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
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

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="chip chip-green text-[10.5px] py-0.5 px-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0A783C]" />
              <span>DPDP Act 2023 Compliant</span>
            </span>
            <span className="text-slate-300">·</span>
            <Link href="/login" className="font-bold text-[#0B3064] hover:text-[#E05A1B] transition-colors">
              Portal Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
