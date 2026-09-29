'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mic,
  QrCode,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building,
  Phone,
  FileCheck,
  ChevronRight,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { IndicEar } from '@/components/icons/indic';
import { KioskQRScanner } from '@/components/kiosk/KioskQRScanner';
import { KioskStatusModal } from '@/components/kiosk/KioskStatusModal';
import { KioskWhatsAppPlatform } from '@/components/kiosk/KioskWhatsAppPlatform';
import type { SanctionVerificationRecord } from '@/lib/sanction-verification';

export default function KioskDashboardPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [verifiedRecord, setVerifiedRecord] = useState<SanctionVerificationRecord | null>(null);

  return (
    <div className="space-y-6">

      {/* 2. DIRECT PRIMARY TOUCH ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TILE 1: VOICE INTAKE REGISTRATION (Primary Action) */}
        <Link
          href="/kiosk/intake"
          id="kiosk-primary-intake"
          className="group relative p-8 rounded-3xl bg-gradient-to-br from-[#0B3064] via-[#0D3B7A] to-[#144282] text-white shadow-[0_16px_40px_-8px_rgba(11,48,100,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_22px_50px_-6px_rgba(11,48,100,0.45)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer no-underline border border-white/20"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-12 -mt-12 pointer-events-none group-hover:scale-125 transition-transform duration-500 blur-xl" />

          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-[#FF9933] text-slate-900 font-mono shadow-xs">
                Primary Kiosk Service
              </span>
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-colors border border-white/20">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex items-start gap-4 mb-3">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] group-hover:scale-110 transition-transform duration-200">
                <Mic className="w-9 h-9 text-[#FF9933] drop-shadow-xs" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display leading-tight">
                  New Citizen Voice Intake
                </h2>
                <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                  आवाज द्वारा नया नागरिक पंजीकरण (Voice Intake)
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans mt-3">
              Register village citizens for PM-AJAY GIA skill training, enterprise grants, and livelihood support using simple voice conversation. Zero paperwork or typing required.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white/95">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF9933]" />
              <span>Voice Intake in हिन्दी & English</span>
            </span>
            <span className="underline group-hover:no-underline">Start Intake →</span>
          </div>
        </Link>

        {/* TILE 2: QR SANCTION ORDER VERIFICATION (Interactive Scanner) */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          id="kiosk-action-qr-scan"
          className="group relative p-8 rounded-3xl bg-gradient-to-br from-[#0A783C] via-[#0B8543] to-[#0E9B4F] text-white shadow-[0_16px_40px_-8px_rgba(10,120,60,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_22px_50px_-6px_rgba(10,120,60,0.45)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer text-left border border-white/20"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-12 -mt-12 pointer-events-none group-hover:scale-125 transition-transform duration-500 blur-xl" />

          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-white text-[#0A783C] font-mono shadow-xs">
                Instant Verification
              </span>
              <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-colors border border-white/20">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex items-start gap-4 mb-3">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] group-hover:scale-110 transition-transform duration-200">
                <QrCode className="w-9 h-9 text-white drop-shadow-xs" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display leading-tight">
                  Scan & Verify QR Code
                </h2>
                <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                  प्रमाणपत्र सत्यापन (क्यूआर स्कैन)
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans mt-3">
              Scan the QR code printed on the official PM-AJAY Sanction Order using the kiosk camera or upload an image to authenticate validity, beneficiary eligibility, and DBT status.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white/95">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>National Registry Verified</span>
            </span>
            <span className="underline group-hover:no-underline">Open Camera Scanner →</span>
          </div>
        </button>
      </div>

      {/* 3. SECONDARY KIOSK UTILITIES (WhatsApp Conversational Intake & Track Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* TILE 3: CONVERSATIONAL WHATSAPP PLATFORM & SIMULATOR */}
        <button
          type="button"
          onClick={() => setIsWhatsAppOpen(true)}
          id="kiosk-action-whatsapp-platform"
          className="p-6 rounded-3xl neuro-glass border border-[#25D366]/40 hover:border-[#25D366] card-hover flex items-start gap-4 cursor-pointer text-left group"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#E7F8EE] text-[#075E54] flex items-center justify-center shrink-0 neuro-icon group-hover:bg-[#25D366] group-hover:text-white transition-all">
            <MessageCircle className="w-7 h-7 text-[#25D366] group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="chip chip-green text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5">
                  Conversational Intake
                </span>
                <span className="text-[10px] text-slate-400 font-mono">व्हाट्सएप बातचीत</span>
              </div>
              <span className="text-xs font-bold text-[#075E54] group-hover:translate-x-1 transition-transform">
                Open Chat →
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-display mt-1.5">
              WhatsApp Platform & Simulator
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-1 leading-relaxed">
              Interactive Q&A intake: questions sent and answers captured in real-time, matching NSQF trades and enrolling case directly.
            </p>
          </div>
        </button>

        {/* TILE 4: TRACK APPLICATION STATUS */}
        <button
          type="button"
          onClick={() => setIsStatusOpen(true)}
          id="kiosk-action-track-status"
          className="p-6 rounded-3xl neuro-glass border border-[#BACEEB]/60 hover:border-[#0B3064] card-hover flex items-start gap-4 cursor-pointer text-left group"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EAF1FB] text-[#0B3064] flex items-center justify-center shrink-0 neuro-icon group-hover:bg-[#0B3064] group-hover:text-white transition-all">
            <Search className="w-7 h-7 text-[#0B3064] group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="chip chip-chakra text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5">
                  Citizen Inquiry
                </span>
                <span className="text-[10px] text-slate-400 font-mono">आवेदन स्थिति</span>
              </div>
              <span className="text-xs font-bold text-[#0B3064] group-hover:translate-x-1 transition-transform">
                Check Status →
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-display mt-1.5">
              Track Application Docket Status
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-1 leading-relaxed">
              Real-time DBT verification by docket number or phone number with officer approval timeline.
            </p>
          </div>
        </button>
      </div>

      {/* 4. CITIZEN NOTICE & KIOSK GUIDELINES */}
      <div className="neuro-glass rounded-2xl p-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3.5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB] flex items-center justify-center neuro-icon">
            <FileCheck className="w-3.5 h-3.5 text-[#0A783C]" />
          </div>
          <span>Documents Required for Kiosk Citizen Registration (पंजीकरण के लिए आवश्यक दस्तावेज)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-slate-700 font-semibold">
          <div className="p-3.5 rounded-xl neuro-inset flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
            <span>Aadhaar Card / आधार कार्ड</span>
          </div>
          <div className="p-3.5 rounded-xl neuro-inset flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
            <span>SC Community Certificate / जाति प्रमाण पत्र</span>
          </div>
          <div className="p-3.5 rounded-xl neuro-inset flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
            <span>Jan Dhan / Bank Passbook / बैंक पासबुक</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: QR CODE LIVE SCANNER & VERIFICATION */}
      <KioskQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onVerified={(rec) => setVerifiedRecord(rec)}
      />

      {/* MODAL 2: APPLICATION STATUS INQUIRY */}
      <KioskStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        onOpenVerify={(sanctionId) => {
          setIsScannerOpen(true);
        }}
      />

      {/* MODAL 3: CONVERSATIONAL WHATSAPP INTAKE PLATFORM & SIMULATOR */}
      <KioskWhatsAppPlatform
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        onOpenVerify={(caseId) => {
          setIsScannerOpen(true);
        }}
      />
    </div>
  );
}
