import Link from 'next/link';
import { Metadata } from 'next';
import {
  Mic,
  Cpu,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  QrCode,
  Building2,
  Users,
  Compass,
  FileCheck,
  Sparkles,
  Lock,
  Globe2,
} from 'lucide-react';
import {
  IndicEar,
  IndicVoiceWave,
  IndicCertificate,
  IndicGramSabha,
  IndicChakra,
} from '@/components/icons/indic';

export const metadata: Metadata = {
  title: 'Kural Sevi — Voice-First Livelihood Intelligence (PM-AJAY GIA)',
  description:
    'Voice-first intake, multilingual AI profiling, and explainable NSQF-aligned livelihood pathway recommendations for Scheduled Caste (SC) communities under PM-AJAY GIA.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#071328] text-slate-100 selection:bg-[#E05A1B] selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* 3-color National Governance Accent Ribbon */}
      <div className="fixed top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#E05A1B] via-white to-[#0A783C] z-50 shadow-md" />

      {/* Ambient background decorative glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#0B3064]/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-[#E05A1B]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-[#0A783C]/20 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP NAVIGATION BAR */}
      <header className="relative z-40 w-full border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B3064] to-[#144282] border border-white/20 flex items-center justify-center text-white shadow-md shadow-[#0B3064]/50 group-hover:scale-105 transition-transform">
              <IndicEar className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-display">
                  Kural Sevi
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#E05A1B]/20 text-[#E05A1B] border border-[#E05A1B]/30 font-mono">
                  PM-AJAY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                குரல் செவி · National Livelihood Intelligence Portal
              </p>
            </div>
          </Link>

          {/* Quick Nav & Telemetry */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">IVR & LLM Active</span>
            </div>
            <a href="#portals" className="hover:text-white transition-colors">
              Role Portals
            </a>
            <a href="#workflows" className="hover:text-white transition-colors">
              How It Works
            </a>
            <Link href="/verify" className="flex items-center gap-1.5 hover:text-[#E05A1B] transition-colors">
              <QrCode className="w-3.5 h-3.5" />
              <span>Verify QR</span>
            </Link>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>Public Verify</span>
            </Link>
            <Link
              href="/login"
              id="header-login-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E05A1B] to-[#C24810] hover:from-[#eb6729] hover:to-[#d45014] text-white text-xs font-bold transition-all shadow-md shadow-[#E05A1B]/25 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Ministry Badge */}
        <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/15 px-4 py-1.5 rounded-full text-xs font-bold text-slate-200 mb-8 backdrop-blur-md shadow-sm">
          <IndicChakra className="w-4 h-4 text-[#E05A1B]" strokeWidth={2.4} />
          <span>Ministry of Social Justice & Empowerment · Government of India · PM-AJAY GIA</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display mb-4 max-w-5xl mx-auto leading-[1.1]">
          Voice-First Livelihood Intelligence for Rural Beneficiaries
        </h1>

        <p className="text-lg sm:text-2xl text-slate-300 font-semibold tracking-wide mb-6 font-sans">
          குரல் செவி · <span className="text-[#E05A1B]">कुरल सेवी</span> · Zero-Literacy AI Empowerment
        </p>

        <p className="text-slate-300 text-base sm:text-lg mb-12 max-w-3xl mx-auto leading-relaxed font-normal">
          Empowering Scheduled Caste (SC) citizens across Tamil Nadu with multilingual conversational intake
          via telephony, automated NSQF QP-NOS skill matching, and tamper-proof QR verified livelihood pathways.
        </p>

        {/* ROLE PORTAL SELECTOR CARDS (STRICT RESTRICTION CARDS) */}
        <div id="portals" className="pt-4 pb-12">
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest font-mono text-slate-400">
              Select Your Designated Authority Portal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            {/* Card 1: Central Admin */}
            <Link
              href="/login?role=admin"
              className="group p-6 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-[#0B3064]/80 hover:bg-[#0B3064]/20 transition-all duration-300 flex flex-col justify-between shadow-lg backdrop-blur-xl hover:shadow-[0_15px_35px_-5px_rgba(11,48,100,0.5)]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B3064] border border-blue-400/30 flex items-center justify-center text-white shadow-md">
                    <ShieldCheck className="w-6 h-6 text-blue-200" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                    Admin Portal
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white font-display mb-1 group-hover:text-blue-300 transition-colors">
                  Central Administrator
                </h2>
                <p className="text-xs text-slate-400 font-sans mb-3">
                  மத்திய நிர்வாகி · Master Governance
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Manage user profiles, calibrate AHP matching engine weights, monitor system telemetry, and export scheme analytics.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-blue-300 group-hover:translate-x-1 transition-transform">
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Card 2: District Welfare Officer */}
            <Link
              href="/login?role=district_officer"
              className="group p-6 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-[#E05A1B]/80 hover:bg-[#E05A1B]/15 transition-all duration-300 flex flex-col justify-between shadow-lg backdrop-blur-xl hover:shadow-[0_15px_35px_-5px_rgba(224,90,27,0.3)] relative overflow-hidden"
            >
              {/* Highlight badge */}
              <div className="absolute top-0 right-0 bg-[#E05A1B] text-white text-[9px] uppercase font-bold px-3 py-1 rounded-bl-xl font-mono">
                Primary Ops
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#C24810] border border-saffron-400/30 flex items-center justify-center text-white shadow-md">
                    <Building2 className="w-6 h-6 text-saffron-100" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#E05A1B]/20 text-[#E05A1B] border border-[#E05A1B]/30 font-mono">
                    District Level
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white font-display mb-1 group-hover:text-saffron-300 transition-colors">
                  District Welfare Officer
                </h2>
                <p className="text-xs text-slate-400 font-sans mb-3">
                  மாவட்ட நல அலுவலர் · Case Assessment
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Inspect incoming voice notes, listen to beneficiary audio calls, verify NSQF course recommendations, and issue signed PDF pathways.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#E05A1B] group-hover:translate-x-1 transition-transform">
                <span>Open Officer Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Card 3: Gram Panchayat Kiosk */}
            <Link
              href="/login?role=panchayat_kiosk"
              className="group p-6 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-[#0A783C]/80 hover:bg-[#0A783C]/20 transition-all duration-300 flex flex-col justify-between shadow-lg backdrop-blur-xl hover:shadow-[0_15px_35px_-5px_rgba(10,120,60,0.4)]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0A783C] border border-emerald-400/30 flex items-center justify-center text-white shadow-md">
                    <Users className="w-6 h-6 text-emerald-100" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Village Kiosk
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white font-display mb-1 group-hover:text-emerald-300 transition-colors">
                  Gram Panchayat Kiosk
                </h2>
                <p className="text-xs text-slate-400 font-sans mb-3">
                  கிராம பஞ்சாயத்து கியோஸ்க் · Direct Intake
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Touchscreen kiosk mode for village centers: initiate citizen IVR call-backs, record speech audio, and submit on-the-spot registrations.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-emerald-300 group-hover:translate-x-1 transition-transform">
                <span>Launch Kiosk Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>

        {/* METRICS TELEMETRY BAR */}
        <div className="mt-6 py-6 px-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-5xl mx-auto">
          <div>
            <div className="text-3xl font-extrabold text-white font-display">100%</div>
            <div className="text-xs text-slate-400 font-sans mt-0.5">Voice-First Intake (Tamil / Hindi)</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#E05A1B] font-display">40+</div>
            <div className="text-xs text-slate-400 font-sans mt-0.5">NSQF Certified Roles Mapped</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400 font-display">38</div>
            <div className="text-xs text-slate-400 font-sans mt-0.5">Tamil Nadu Districts Enabled</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-blue-400 font-display">0-Sec</div>
            <div className="text-xs text-slate-400 font-sans mt-0.5">Instant Tamper-Proof QR Verify</div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES ARCHITECTURE SECTION */}
      <section id="workflows" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-slate-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#E05A1B]" />
            <span>End-to-End Governance Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            How Kural Sevi Operates
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto mt-2">
            Automating the bridge between unorganized rural beneficiaries and government skill development programs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Multilingual Ingestion',
              desc: 'Beneficiaries dial an IVR hotline or send a WhatsApp voice note. Sarvam AI models transcribe colloquial Tamil into clean structured records.',
              icon: IndicVoiceWave,
              badge: 'Telephony & WhatsApp',
              accent: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
            },
            {
              step: '02',
              title: 'AI Livelihood Profiling',
              desc: 'Google Gemini 2.5 extracts 7 key demographic criteria: education level, physical mobility, migration preference, and existing skills.',
              icon: Cpu,
              badge: 'Gemini 2.5 Flash',
              accent: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
            },
            {
              step: '03',
              title: 'NSQF Match Engine',
              desc: 'Hard-constraint filtering plus vector similarity ranks the top 3 National Skills Qualifications Framework (NSQF) courses with salary benchmarks.',
              icon: IndicCertificate,
              badge: 'AHP Multi-Criteria',
              accent: 'border-saffron-500/30 bg-saffron-500/10 text-saffron-300',
            },
            {
              step: '04',
              title: 'QR Verified Dispatch',
              desc: 'District Officer reviews and approves. System generates a bilingual PDF with a cryptographically signed QR code for instant field validation.',
              icon: QrCode,
              badge: 'Tamper-Proof Verify',
              accent: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-600 font-mono">
                      {item.step}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.accent} font-mono`}>
                      {item.badge}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-4">
                    <Icon className="w-5 h-5 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-display mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PUBLIC VERIFICATION SHOWCASE */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0B3064]/60 via-slate-900 to-[#0A783C]/30 border border-white/15 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-slate-200">
              <QrCode className="w-3.5 h-3.5 text-[#E05A1B]" />
              <span>Public Verification Gateway</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Scan & Verify Any Issued Livelihood Certificate
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every beneficiary approval generates an official PDF containing a tamper-proof QR code.
              Employers, ITI centers, and panchayat leaders can scan the QR code to instantly verify authenticity without requiring a login.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/verify"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              <QrCode className="w-4 h-4 text-[#0B3064]" />
              <span>Launch QR Scanner</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Officer Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* COMPLIANCE & GOVERNANCE BANNER */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <IndicChakra className="w-4 h-4 text-[#E05A1B]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Kural Sevi (குரல் செவி)</p>
              <p className="text-[11px] text-slate-400">
                Department of Social Welfare & Women Empowerment · Government of Tamil Nadu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              DPDP Act 2023 Compliant
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              NSQF Aligned
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Globe2 className="w-3.5 h-3.5 text-saffron-400" />
              Multilingual (Tamil / Hindi)
            </span>
          </div>

          <div className="text-slate-400 text-center md:text-right">
            <p>PM-AJAY GIA · Problem Statement #26097</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Strict Role-Based Access Control Protected</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
