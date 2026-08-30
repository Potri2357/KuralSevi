import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kural Sevi — Voice-First Livelihood Intelligence',
};

export default function HomePage() {
  return (
    <main className="min-h-screen grid-bg flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs text-indigo-300 mb-8 border border-indigo-500/20">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          PM-AJAY GIA · Problem Statement #26097
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
          <span className="text-gradient">Kural Sevi</span>
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-3 font-medium">குரல் செவி · कुरल सेवी · కురల్ సేవి</p>
        <p className="text-[var(--text-secondary)] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Voice-first intake, AI profiling, and explainable NSQF-aligned livelihood pathway recommendations
          for SC communities — feeding officer review and district planning intelligence.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/officer"
            id="officer-dashboard-btn"
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            Officer Dashboard →
          </Link>
          <Link
            href="/officer/planning"
            id="planning-btn"
            className="px-8 py-3.5 glass hover:bg-white/8 text-[var(--text-primary)] rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
          >
            District Planning
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            {
              icon: '🎙️',
              title: 'Voice-First Intake',
              desc: 'IVR + WhatsApp voice-note channels in Tamil, Hindi, Telugu. No literacy barrier.',
              accent: 'border-indigo-500/20',
            },
            {
              icon: '🧠',
              title: 'NSQF-Aligned AI',
              desc: 'Hard filters + pgvector similarity + AHP/TOPSIS ranking. Top 3 pathways with QP-NOS codes.',
              accent: 'border-violet-500/20',
            },
            {
              icon: '📊',
              title: 'District Intelligence',
              desc: 'Batch-aggregated demand data. Officers get planning visibility without manual compilation.',
              accent: 'border-amber-500/20',
            },
          ].map((card) => (
            <div key={card.title} className={`glass card-hover rounded-xl p-5 border ${card.accent}`}>
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{card.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* System info */}
        <div className="mt-12 flex flex-wrap gap-6 justify-center text-xs text-[var(--text-muted)]">
          <span>Sarvam AI · Bulbul V3 · Saaras STT</span>
          <span>·</span>
          <span>Gemini 2.5 · pgvector · Supabase</span>
          <span>·</span>
          <span>Twilio IVR · WhatsApp Business API</span>
          <span>·</span>
          <span>DPDP Act 2023 compliant</span>
        </div>
      </div>
    </main>
  );
}
