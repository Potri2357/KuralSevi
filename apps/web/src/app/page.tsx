import Link from 'next/link';
import { Metadata } from 'next';
import {
  Mic,
  Cpu,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

import {
  IndicEar,
  IndicVoiceWave,
  IndicCertificate,
  IndicGramSabha,
  IndicChakra,
  IndicIconGallery,
} from '@/components/icons/indic';

export const metadata: Metadata = {
  title: 'Kural Sevi — Voice-First Livelihood Intelligence (PM-AJAY GIA)',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* 3px Top Saffron Governance Accent Strip */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#E05A1B] z-50" aria-hidden="true" />

      <div className="max-w-5xl mx-auto text-center z-10 py-12">
        {/* Ministry / Scheme Badge */}
        <div className="inline-flex items-center gap-2 bg-[#EAF1FB] border border-[#BACEEB] px-4 py-1.5 rounded-full text-xs font-bold text-[#0B3064] mb-8 shadow-2xs">
          <IndicChakra className="w-4 h-4 text-[#0B3064]" strokeWidth={2.2} />
          <span>PM-AJAY GIA · Problem Statement #26097</span>
        </div>

        {/* Display Heading with Cormorant Garamond */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0B3064] flex items-center justify-center text-white shadow-sm">
            <IndicEar className="w-7 h-7 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#0B3064] font-display">
            Kural Sevi
          </h1>
        </div>

        <p className="text-base sm:text-lg text-slate-700 mb-4 font-semibold tracking-wide font-sans">
          குரல் செவி · <span className="text-[#E05A1B]">कुरल सेवी</span> · కుரல் సేవి
        </p>

        <p className="text-[var(--text-secondary)] text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-normal font-sans">
          Voice-first intake, multilingual AI profiling, and explainable NSQF-aligned livelihood pathway
          recommendations for Scheduled Caste (SC) communities — empowering district welfare officers with verified planning intelligence.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/officer"
            id="officer-dashboard-btn"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white rounded-xl font-bold transition-all duration-150 shadow-xs min-h-[48px] font-sans"
          >
            <span>Officer Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/officer/planning"
            id="planning-btn"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl font-bold transition-all duration-150 shadow-2xs min-h-[48px] font-sans"
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span>District Planning</span>
          </Link>
        </div>

        {/* Section Heading with Cormorant Garamond */}
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-6 text-center tracking-tight font-display">
          Core Capabilities
        </h2>

        {/* Feature cards pairing Indic & Lucide icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mb-16">
          {[
            {
              icon: IndicVoiceWave,
              secondaryIcon: Mic,
              title: 'Multilingual Voice Intake',
              desc: 'IVR and WhatsApp voice note channels in Tamil, Hindi, and Telugu. Zero literacy barrier for rural beneficiaries.',
              accent: 'border-[#BACEEB]/70',
              iconColor: 'text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB]',
            },
            {
              icon: IndicCertificate,
              secondaryIcon: Cpu,
              title: 'NSQF-Aligned Match Engine',
              desc: 'Hard constraint filtering + semantic vector search + multi-criteria ranking. Top 3 explainable QP-NOS job roles.',
              accent: 'border-[#FDD8C2]/80',
              iconColor: 'text-[#C24810] bg-[#FFF4ED] border border-[#FDD8C2]',
            },
            {
              icon: IndicGramSabha,
              secondaryIcon: BarChart3,
              title: 'District Planning Intelligence',
              desc: 'Batch-aggregated demand data and recurring skill gap heatmaps for District Collectors and ITI administrators.',
              accent: 'border-[#BBE8CB]/80',
              iconColor: 'text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB]',
            },
          ].map((card) => {
            const Icon = card.icon;
            const SecIcon = card.secondaryIcon;
            return (
              <div
                key={card.title}
                className={`bg-white rounded-2xl p-6 border ${card.accent} shadow-[0_1px_3px_0_rgba(11,48,100,0.04)] ring-1 ring-black/[0.015] hover:shadow-[0_10px_25px_-5px_rgba(11,48,100,0.08)] transition-all duration-200 card-hover flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-2xs ${card.iconColor}`}>
                      <Icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                      <SecIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xl font-display text-[#0B3064] mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans font-medium">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Indic Icon Set Showcase */}
        <div className="mb-16 text-left">
          <IndicIconGallery />
        </div>

        {/* System info & compliance */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap gap-4 sm:gap-6 justify-center text-xs text-[var(--text-muted)] font-medium font-sans">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0A783C]" />
            Sarvam AI (Bulbul V3 & Saaras)
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0B3064]" />
            DPDP Act 2023 Compliant
          </span>
          <span>·</span>
          <span>Twilio IVR & WhatsApp Business</span>
          <span>·</span>
          <span>NSQF / QP-NOS Standard</span>
        </div>
      </div>
    </main>
  );
}

