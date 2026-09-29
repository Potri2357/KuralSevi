import Link from 'next/link';
import { Metadata } from 'next';
import {
  Mic,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Building2,
  Users,
  Sparkles,
  Lock,
  Globe2,
} from 'lucide-react';
import {
  IndicEar,
  IndicVoiceWave,
  IndicCertificate,
  IndicChakra,
} from '@/components/icons/indic';

export const metadata: Metadata = {
  title: 'Kural Sevi — Voice-First Livelihood Intelligence (PM-AJAY GIA)',
  description:
    'Voice-first intake, multilingual AI profiling, and explainable NSQF-aligned livelihood pathway recommendations for Scheduled Caste (SC) communities under PM-AJAY GIA.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-slate-800 selection:bg-[#0B3064]/10 selection:text-[#0B3064] relative overflow-hidden flex flex-col justify-between">
      {/* Universal 3px National Governance Saffron Accent Strip */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#E05A1B] z-50 shadow-xs" aria-hidden="true" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(11,48,100,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
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

          {/* Quick Nav & Telemetry */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDF9F1] border border-[#BBE8CB] text-[#0A783C]">
              <span className="w-2 h-2 rounded-full bg-[#0A783C] animate-pulse" />
              <span className="font-mono text-[11px] font-bold">Telephony & AI Active</span>
            </div>
            <a href="#portals" className="hover:text-[#0B3064] transition-colors">
              Role Portals
            </a>
            <a href="#workflows" className="hover:text-[#0B3064] transition-colors">
              Core Engine
            </a>
            <Link href="/verify" className="flex items-center gap-1.5 hover:text-[#E05A1B] transition-colors">
              <QrCode className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>Verify QR</span>
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 transition-all shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-[#0B3064]" />
              <span>Public Verify</span>
            </Link>
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
      <section className="relative z-10 pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Ministry Badge */}
        <div className="inline-flex items-center gap-2 bg-[#EAF1FB] border border-[#BACEEB] px-4 py-1.5 rounded-full text-xs font-bold text-[#0B3064] mb-6 shadow-2xs">
          <IndicChakra className="w-4 h-4 text-[#0B3064]" strokeWidth={2.4} />
          <span>Ministry of Social Justice & Empowerment · Government of India · PM-AJAY GIA</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0B3064] font-display mb-3 max-w-5xl mx-auto leading-[1.12]">
          Voice-First Livelihood Intelligence for Rural Beneficiaries
        </h1>

        <p className="text-lg sm:text-xl text-slate-700 font-semibold tracking-wide mb-4 font-sans">
          குரல் செவி · <span className="text-[#E05A1B]">कुरल सेवी</span> · Zero-Literacy AI Empowerment
        </p>

        <p className="text-slate-600 text-base sm:text-lg mb-10 max-w-3xl mx-auto leading-relaxed font-normal font-sans">
          Bridging the digital divide for Scheduled Caste (SC) citizens across Tamil Nadu through native conversational
          telephony intake, automated NSQF QP-NOS skill matching, and tamper-proof QR verified livelihood pathways.
        </p>

        {/* ROLE PORTAL SELECTOR CARDS (STRICT RESTRICTION GATEWAYS) */}
        <div id="portals" className="pt-2 pb-10">
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest font-mono text-slate-500 font-bold">
              Designated Authority Workspaces
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            {/* Card 1: Central Admin */}
            <Link
              href="/login?role=admin"
              className="group p-6 rounded-2xl bg-white border border-[#BACEEB]/80 hover:border-[#0B3064] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064] shadow-2xs">
                    <ShieldCheck className="w-6 h-6 text-[#0B3064]" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] font-mono">
                    Admin Portal
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#0B3064] font-display mb-1 group-hover:text-[#144282] transition-colors">
                  Central Administrator
                </h2>
                <p className="text-xs text-slate-500 font-sans mb-3">
                  மத்திய நிர்வாகி · Master Governance
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-normal font-sans">
                  Manage user profiles, calibrate AHP matching engine weights, monitor system telemetry, and export scheme analytics.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0B3064] group-hover:translate-x-1 transition-transform">
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Card 2: District Welfare Officer */}
            <Link
              href="/login?role=district_officer"
              className="group p-6 rounded-2xl bg-white border border-[#FDD8C2]/90 hover:border-[#E05A1B] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Highlight badge */}
              <div className="absolute top-0 right-0 bg-[#E05A1B] text-white text-[9px] uppercase font-bold px-3 py-1 rounded-bl-xl font-mono">
                Primary Ops
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF4ED] border border-[#FDD8C2] flex items-center justify-center text-[#C24810] shadow-2xs">
                    <Building2 className="w-6 h-6 text-[#C24810]" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#FFF4ED] text-[#C24810] border border-[#FDD8C2] font-mono">
                    District Level
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#0B3064] font-display mb-1 group-hover:text-[#E05A1B] transition-colors">
                  District Welfare Officer
                </h2>
                <p className="text-xs text-slate-500 font-sans mb-3">
                  மாவட்ட நல அலுவலர் · Case Assessment
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-normal font-sans">
                  Inspect incoming voice notes, listen to beneficiary audio calls, verify NSQF course recommendations, and issue signed PDF pathways.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#C24810] group-hover:translate-x-1 transition-transform">
                <span>Open Officer Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Card 3: Gram Panchayat Kiosk */}
            <Link
              href="/login?role=panchayat_kiosk"
              className="group p-6 rounded-2xl bg-white border border-[#BBE8CB]/90 hover:border-[#0A783C] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EDF9F1] border border-[#BBE8CB] flex items-center justify-center text-[#0A783C] shadow-2xs">
                    <Users className="w-6 h-6 text-[#0A783C]" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB] font-mono">
                    Village Kiosk
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#0B3064] font-display mb-1 group-hover:text-[#0A783C] transition-colors">
                  Gram Panchayat Kiosk
                </h2>
                <p className="text-xs text-slate-500 font-sans mb-3">
                  கிராம பஞ்சாயத்து கியோஸ்க் · Direct Intake
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-normal font-sans">
                  Touchscreen kiosk mode for village centers: initiate citizen IVR call-backs, record speech audio, and submit on-the-spot registrations.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0A783C] group-hover:translate-x-1 transition-transform">
                <span>Launch Kiosk Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>

        {/* METRICS TELEMETRY BAR (MATCHING UNIVERSAL GLASS-CARD) */}
        <div className="mt-4 py-6 px-8 rounded-2xl bg-white border border-slate-200/90 shadow-[0_4px_20px_-2px_rgba(11,48,100,0.04)] grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-5xl mx-auto">
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
            <div className="text-3xl font-bold text-[#0B3064] font-display">0-Sec</div>
            <div className="text-xs text-slate-500 font-sans mt-0.5 font-medium">Instant Tamper-Proof QR Verify</div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES ARCHITECTURE SECTION */}
      <section id="workflows" className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF1FB] text-xs font-bold text-[#0B3064] border border-[#BACEEB] mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0B3064]" />
            <span>End-to-End Governance Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0B3064] font-display tracking-tight">
            How Kural Sevi Operates
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-1 font-sans">
            Automating the bridge between unorganized rural beneficiaries and government skill development programs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              title: 'Multilingual Ingestion',
              desc: 'Beneficiaries dial an IVR hotline or send a WhatsApp voice note. Sarvam AI models transcribe colloquial Tamil into clean structured records.',
              icon: IndicVoiceWave,
              secondaryIcon: Mic,
              badge: 'Telephony & WhatsApp',
              accent: 'border-[#BACEEB]/80',
              iconContainer: 'text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB]',
            },
            {
              step: '02',
              title: 'AI Livelihood Profiling',
              desc: 'Google Gemini extracts 7 key demographic criteria: education level, physical mobility, migration preference, and existing skills.',
              icon: IndicEar,
              secondaryIcon: Cpu,
              badge: 'Gemini 2.5 Flash',
              accent: 'border-[#FDD8C2]/80',
              iconContainer: 'text-[#C24810] bg-[#FFF4ED] border border-[#FDD8C2]',
            },
            {
              step: '03',
              title: 'NSQF Match Engine',
              desc: 'Hard-constraint filtering plus vector similarity ranks the top 3 National Skills Qualifications Framework (NSQF) courses with salary benchmarks.',
              icon: IndicCertificate,
              secondaryIcon: CheckCircle2,
              badge: 'AHP Multi-Criteria',
              accent: 'border-[#BBE8CB]/80',
              iconContainer: 'text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB]',
            },
            {
              step: '04',
              title: 'QR Verified Dispatch',
              desc: 'District Officer reviews and approves. System generates a bilingual PDF with a cryptographically signed QR code for instant field validation.',
              icon: IndicCertificate,
              secondaryIcon: QrCode,
              badge: 'Tamper-Proof Verify',
              accent: 'border-[#BACEEB]/80',
              iconContainer: 'text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB]',
            },
          ].map((item) => {
            const Icon = item.icon;
            const SecIcon = item.secondaryIcon;
            return (
              <div
                key={item.step}
                className={`p-6 rounded-2xl bg-white border ${item.accent} shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300 font-mono">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                      {item.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs ${item.iconContainer}`}>
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                      <SecIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#0B3064] font-display mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PUBLIC VERIFICATION DOSSIER CALLOUT BANNER */}
      <section className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#EAF1FB] via-white to-[#EDF9F1] border border-[#BACEEB] flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_4px_25px_-2px_rgba(11,48,100,0.06)]">
          <div className="space-y-2.5 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#BACEEB] text-xs font-bold text-[#0B3064] shadow-2xs">
              <QrCode className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>Public Verification Gateway</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B3064] font-display">
              Scan & Verify Any Issued Livelihood Certificate
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Every beneficiary approval generates an official PDF containing a tamper-proof QR code.
              Employers, ITI centers, and panchayat leaders can scan the QR code to instantly verify authenticity without requiring a login.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/verify"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] text-white font-bold text-xs transition-all shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch QR Scanner</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs transition-all shadow-2xs"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Officer Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* COMPLIANCE & GOVERNANCE FOOTER */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/70 py-8 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
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
