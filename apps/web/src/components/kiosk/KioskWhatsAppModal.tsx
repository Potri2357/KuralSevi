'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  X,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface KioskWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPhone?: string;
  defaultCaseId?: string;
}

export function KioskWhatsAppModal({
  isOpen,
  onClose,
  defaultPhone = '',
  defaultCaseId = '',
}: KioskWhatsAppModalProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [caseId, setCaseId] = useState(defaultCaseId);
  const [serviceType, setServiceType] = useState<'intake' | 'status' | 'sanction'>('intake');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState('');

  // Generate WhatsApp message preview based on selected service
  const getMessageContent = () => {
    const cleanPhone = phone.trim();
    if (serviceType === 'intake') {
      return `*नमस्ते / Greetings from Kural Sevi (PM-AJAY)*\n\nसामाजिक न्याय एवं अधिकारिता विभाग के तत्वावधान में प्रधानमंत्री अनुसचित जाति अभ्युदय योजना (PM-AJAY GIA) के तहत निःशुल्क कौशल प्रशिक्षण एवं ₹50,000 तक की अनुदान सहायता उपलब्ध है।\n\nग्राम पंचायत कियोस्क (Panchayat Kiosk) द्वारा आपका पंजीकरण दर्ज कर लिया गया है।\n\n📞 टोल-फ्री सहायता केंद्र: 1800-11-2001\nआधिकारिक पोर्टल: http://localhost:3000`;
    } else if (serviceType === 'status') {
      return `*Kural Sevi — आवेदन स्थिति / Application Update*\n\nआपका PM-AJAY आवेदन (${caseId || 'REG-CASE'}) जिला कल्याण अधिकारी के सत्यापन हेतु प्रक्रियाधीन है।\n\nआवेदन स्थिति देखें: http://localhost:3000/kiosk\nटोल-फ्री हेल्पलाइन: 1800-11-2001`;
    } else {
      return `*सत्यापित स्वीकृति आदेश / Verified PM-AJAY Sanction Order*\n\nआपका PM-AJAY कौशल प्रशिक्षण एवं आजीविका अनुदान आदेश स्वीकृत कर दिया गया है।\n\nआदेश संख्या: ORD-AJAY-${caseId || '2026'}\nसत्यापन लिंक: http://localhost:3000/verify/${caseId || 'ORD-AJAY-2026'}\n\nसामाजिक न्याय एवं अधिकारिता मंत्रालय · भारत सरकार`;
    }
  };

  const handleOpenDirectWhatsApp = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    const fullPhone = digits.length === 10 ? `91${digits}` : digits;
    const msg = encodeURIComponent(getMessageContent());
    window.open(`https://wa.me/${fullPhone}?text=${msg}`, '_blank');
  };

  const handleSendViaBot = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/calls/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: digits,
          language: 'ta',
          mode: serviceType,
          caseId: caseId || undefined,
          customNote: 'Dispatched from Panchayat Kiosk Terminal',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'WhatsApp message successfully dispatched!');
      } else {
        // Offer fallback to 1-click WhatsApp
        setErrorMsg(data.error || 'Server delivery could not complete. Please use "Open in WhatsApp" below.');
      }
    } catch {
      setErrorMsg('Network error. Click "Open in WhatsApp" to deliver directly.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#075E54] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs flex items-center justify-center shrink-0 border border-white/20 bg-white/10">
              <img
                src="/icons/kural-sevi-logo.svg"
                alt="Kural Sevi"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg font-display tracking-tight">
                  WhatsApp Citizen Outreach
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white font-mono">
                  व्हाट्सएप सेवा
                </span>
              </div>
              <p className="text-xs text-white/80">
                Send scheme registration, tracking receipts & sanction orders to citizen WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Service Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select WhatsApp Service Type <span className="text-[#E05A1B]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setServiceType('intake')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  serviceType === 'intake'
                    ? 'bg-[#E7F8EE] border-[#25D366] text-[#075E54] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Intake Receipt
              </button>
              <button
                type="button"
                onClick={() => setServiceType('status')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  serviceType === 'status'
                    ? 'bg-[#E7F8EE] border-[#25D366] text-[#075E54] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Track Status
              </button>
              <button
                type="button"
                onClick={() => setServiceType('sanction')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  serviceType === 'sanction'
                    ? 'bg-[#E7F8EE] border-[#25D366] text-[#075E54] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Sanction Order
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSendViaBot} className="space-y-3.5">
            <div>
              <label
                htmlFor="wa-phone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Citizen Mobile Number (10 Digits) <span className="text-[#E05A1B]">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="wa-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="1234567890"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {(serviceType === 'status' || serviceType === 'sanction') && (
              <div>
                <label
                  htmlFor="wa-case-id"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Case ID or Sanction Order Reference
                </label>
                <input
                  id="wa-case-id"
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="e.g. KS-2026-00108"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 focus:border-[#075E54] focus:bg-white transition-all shadow-2xs"
                />
              </div>
            )}

            {/* Message Preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#075E54]" />
                <span>Message Preview</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-[11px]">
                {getMessageContent()}
              </pre>
            </div>

            {/* Success / Error Banners */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-[#EDF9F1] border border-[#BBE8CB] text-[#0A783C] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Dispatch Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in WhatsApp (1-Click)</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#075E54] hover:bg-[#064e46] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send via Kiosk Bot</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 px-6 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A783C]" />
            <span>End-to-End Encrypted Delivery · DPDP Compliant</span>
          </span>
          <button onClick={onClose} className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
