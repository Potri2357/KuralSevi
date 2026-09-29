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
      {/* 1. TOP KIOSK STATUS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A783C] text-white flex items-center justify-center shrink-0 shadow-xs">
            <IndicEar className="w-5 h-5 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0B3064] font-display">
                Panchayat Kiosk Terminal
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A783C] animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Melpadi Gram Panchayat · Salem District · PM-AJAY GIA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A783C]" />
            DPDP Act 2023 Compliant
          </span>
        </div>
      </div>

      {/* 2. DIRECT PRIMARY TOUCH ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* TILE 1: VOICE INTAKE REGISTRATION (Primary Action) */}
        <Link
          href="/kiosk/intake"
          id="kiosk-primary-intake"
          className="group relative p-7 rounded-3xl bg-gradient-to-br from-[#0B3064] via-[#0D3B7A] to-[#144282] text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer no-underline border border-white/10"
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none group-hover:scale-110 transition-transform" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-[#FF9933] text-slate-900 font-mono">
                Primary Kiosk Service
              </span>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex items-start gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
                <Mic className="w-8 h-8 text-[#FF9933]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display leading-tight">
                  New Citizen Voice Intake
                </h2>
                <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                  குரல் வழி புதிய பயனாளிகள் பதிவு
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-sans mt-2">
              Register village citizens for PM-AJAY GIA skill training, enterprise grants, and livelihood support using simple voice conversation. Zero paperwork or typing required.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs font-bold text-white/90">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF9933]" />
              <span>Voice Intake in தமிழ் & English</span>
            </span>
            <span className="underline group-hover:no-underline">Start Intake →</span>
          </div>
        </Link>

        {/* TILE 2: QR SANCTION ORDER VERIFICATION (Interactive Scanner) */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          id="kiosk-action-qr-scan"
          className="group relative p-7 rounded-3xl bg-gradient-to-br from-[#0A783C] via-[#0B8543] to-[#0E9B4F] text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer text-left border border-white/10"
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none group-hover:scale-110 transition-transform" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-white text-[#0A783C] font-mono">
                Instant Verification
              </span>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex items-start gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20 shadow-inner group-hover:scale-105 transition-transform">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display leading-tight">
                  Scan & Verify QR Code
                </h2>
                <p className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">
                  சான்றிதழ் சரிபார்ப்பு (கேமரா ஸ்கேன்)
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-sans mt-2">
              Scan the QR code printed on the official PM-AJAY Sanction Order using the kiosk camera or upload an image to authenticate validity, beneficiary eligibility, and DBT status.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs font-bold text-white/90">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>National Registry Verified</span>
            </span>
            <span className="underline group-hover:no-underline">Open Camera Scanner →</span>
          </div>
        </button>
      </div>

      {/* 3. SECONDARY KIOSK UTILITIES (WhatsApp Conversational Intake & Track Status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* TILE 3: CONVERSATIONAL WHATSAPP PLATFORM & SIMULATOR */}
        <button
          type="button"
          onClick={() => setIsWhatsAppOpen(true)}
          id="kiosk-action-whatsapp-platform"
          className="p-5 rounded-3xl bg-white border border-[#25D366]/40 hover:border-[#25D366] hover:shadow-lg transition-all duration-200 flex items-start gap-4 cursor-pointer text-left group"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#E7F8EE] text-[#075E54] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#25D366] group-hover:text-white transition-colors">
            <MessageCircle className="w-7 h-7 text-[#25D366] group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#075E54] bg-[#E7F8EE] px-2 py-0.5 rounded-full">
                  Conversational Intake
                </span>
                <span className="text-[10px] text-slate-400 font-mono">வாட்ஸ்அப் உரையாடல்</span>
              </div>
              <span className="text-xs font-bold text-[#075E54] group-hover:translate-x-0.5 transition-transform">
                Open Chat →
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-display mt-1">
              WhatsApp Platform & Simulator
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
              Interactive Q&A intake: questions sent and answers captured in real-time, matching NSQF trades and enrolling case directly.
            </p>
          </div>
        </button>

        {/* TILE 4: TRACK APPLICATION STATUS */}
        <button
          type="button"
          onClick={() => setIsStatusOpen(true)}
          id="kiosk-action-track-status"
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#0B3064]/40 hover:shadow-lg transition-all duration-200 flex items-start gap-4 cursor-pointer text-left group"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#EAF1FB] text-[#0B3064] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#0B3064] group-hover:text-white transition-colors">
            <Search className="w-7 h-7 text-[#0B3064] group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3064] bg-[#EAF1FB] px-2 py-0.5 rounded-full">
                  Citizen Inquiry
                </span>
                <span className="text-[10px] text-slate-400 font-mono">நிலை அறிதல்</span>
              </div>
              <span className="text-xs font-bold text-[#0B3064] group-hover:translate-x-0.5 transition-transform">
                Search →
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-display mt-1">
              Track Application Status
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
              Check application progress by entering the beneficiary’s 10-digit mobile number or Case Reference ID.
            </p>
          </div>
        </button>
      </div>

      {/* 4. CITIZEN NOTICE & KIOSK GUIDELINES */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#0A783C]" />
          <span>Documents Required for Kiosk Citizen Registration (தேவையான ஆவணங்கள்)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 font-medium">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
            <span>Aadhaar Card / ஆதார் அட்டை</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
            <span>SC Community Certificate / சாதி சான்றிதழ்</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
            <span>Jan Dhan / Bank Passbook / வங்கிக் கணக்கு</span>
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
