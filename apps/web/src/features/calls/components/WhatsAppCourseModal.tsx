'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  ExternalLink,
  Check,
  Copy,
  Sparkles,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { CallRecordItem } from '../types';

interface WhatsAppCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCall?: CallRecordItem | null;
  allCalls: CallRecordItem[];
  onDispatched?: () => void;
}

export function WhatsAppCourseModal({
  isOpen,
  onClose,
  initialCall,
  allCalls,
  onDispatched,
}: WhatsAppCourseModalProps) {
  const [selectedCallId, setSelectedCallId] = useState<string>('');
  const [phone, setPhone] = useState<string>('+91');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Beneficiary');
  const [language, setLanguage] = useState<'ta' | 'hi' | 'te' | 'en'>('ta');
  const [customNote, setCustomNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    message?: string;
    wa_link?: string;
    error?: string;
  } | null>(null);

  // Sync state when initialCall changes or modal opens
  useEffect(() => {
    if (initialCall) {
      setSelectedCallId(initialCall.case_id);
      setPhone(initialCall.phone || '+91');
      setLanguage((initialCall.language as any) || 'ta');
      setBeneficiaryName(
        (initialCall as any).beneficiary_name ||
          (initialCall.case_id ? `Citizen (${initialCall.case_id})` : 'Beneficiary')
      );
    } else if (allCalls.length > 0 && !selectedCallId) {
      const first = allCalls[0];
      setSelectedCallId(first.case_id);
      setPhone(first.phone || '+91');
      setLanguage((first.language as any) || 'ta');
      setBeneficiaryName((first as any).beneficiary_name || 'Beneficiary');
    }
    setDispatchResult(null);
  }, [initialCall, isOpen]);

  // Handle selecting an existing beneficiary call record
  const handleSelectCall = (caseId: string) => {
    setSelectedCallId(caseId);
    setDispatchResult(null);
    const found = allCalls.find((c) => c.case_id === caseId);
    if (found) {
      setPhone(found.phone || '+91');
      setLanguage((found.language as any) || 'ta');
      setBeneficiaryName((found as any).beneficiary_name || `Citizen (${found.case_id})`);
    }
  };

  // Clean, official message without emojis
  const cleanMessage = useMemo(() => {
    const caseId = selectedCallId || 'WA-' + phone.replace(/\D/g, '').slice(-4);

    if (language === 'ta') {
      return [
        '*அரசு PM-AJAY வாழ்வாதார மற்றும் திறன் பயிற்சி பதிவு (Kural Sevi Intake)*',
        '--------------------------------------------------',
        `மனு எண் (Case ID): ${caseId}`,
        `பயனாளி: ${beneficiaryName}`,
        `தொலைபேசி: ${phone}`,
        '',
        'வணக்கம்! தமிழ்நாடு அரசு PM-AJAY திட்டத்தின் கீழ் இலவச தொழில் திறன் பயிற்சி பாடநெறிகள், மாதாந்திர உதவித்தொகை (ரூ. 1,500/மாதம்) மற்றும் வாழ்வாதார மானியங்களைப் பெற உங்களை வரவேற்கிறோம்.',
        '',
        'பதிவை தொடங்க:',
        '1. உங்கள் கல்வி தகுதி, தற்போதைய வேலை மற்றும் விருப்பமான தொழில் பயிற்சி பற்றி ஒரு குரல் பதிவு (Voice Note) அல்லது செய்தியை உடனே இங்கு அனுப்பவும்.',
        '2. அல்லது "START" அல்லது "சரி" என்று உடனே பதில் அனுப்பவும்.',
        customNote ? `\nகுறிப்பு: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - தமிழ்நாடு அரசு PM-AJAY தொலைபேசி மற்றும் வாட்ஸ்அப் பதிவு சேவை_',
      ]
        .filter(Boolean)
        .join('\n');
    } else if (language === 'hi') {
      return [
        '*सरकारी पीएम-अजय (PM-AJAY) आजीविका एवं कौशल प्रशिक्षण पंजीकरण (Kural Sevi)*',
        '--------------------------------------------------',
        `केस आईडी (Case ID): ${caseId}`,
        `लाभार्थी: ${beneficiaryName}`,
        `फोन: ${phone}`,
        '',
        'नमस्ते! केंद्र एवं राज्य सरकार की पीएम-अजय योजना के तहत मुफ़्त कौशल प्रशिक्षण पाठ्यक्रम, मासिक वजीफा (रु. 1,500/माह) और आजीविका सहायता हेतु आपका स्वागत है।',
        '',
        'पंजीकरण शुरू करने के लिए:',
        '1. अपनी शिक्षा, वर्तमान कार्य और पसंदीदा कौशल पाठ्यक्रम के बारे में वॉइस नोट (Voice Note) या संदेश भेजें।',
        '2. या तुरंत "START" या "हाँ" लिखकर उत्तर दें।',
        customNote ? `\nनोट: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - पीएम-अजय टेलीफोनी एवं व्हाट्सएप पंजीकरण सेवा_',
      ]
        .filter(Boolean)
        .join('\n');
    } else if (language === 'te') {
      return [
        '*ప్రభుత్వ PM-AJAY జీవనోపాధి మరియు నైపుణ్య శిక్షణ నమోదు (Kural Sevi)*',
        '--------------------------------------------------',
        `కేస్ ఐడీ (Case ID): ${caseId}`,
        `లబ్ధిదారు: ${beneficiaryName}`,
        `ఫోన్: ${phone}`,
        '',
        'నమస్కారం! ప్రభుత్వ PM-AJAY పథకం కింద ఉచిత వృత్తి నైపుణ్య కోర్సులు, నెలవారీ స్టైపెండ్ (రూ. 1,500/నెలకు) మరియు ఉపాధి మార్గదర్శకత్వం కొరకు ఆహ్వానిస్తున్నాము.',
        '',
        'నమోదు ప్రారంభించడానికి:',
        '1. మీ విద్యార్హత, ప్రస్తుత పని మరియు ఆసక్తి ఉన్న వృత్తి కోర్సు గురించి వాయిస్ నోట్ (Voice Note) లేదా సందేశం పంపండి.',
        '2. లేదా వెంటనే "START" అని రిప్లై ఇవ్వండి.',
        customNote ? `\nగమనిక: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - PM-AJAY టెలిఫోనీ & వాట్సాప్ నమోదు వేదిక_',
      ]
        .filter(Boolean)
        .join('\n');
    } else {
      return [
        '*Government PM-AJAY Livelihood & Skill Course Intake (Kural Sevi)*',
        '--------------------------------------------------',
        `Case ID: ${caseId}`,
        `Beneficiary: ${beneficiaryName}`,
        `Phone: ${phone}`,
        '',
        'Greetings! Welcome to the government PM-AJAY initiative for free vocational skill training courses, monthly DBT stipend (Rs. 1,500/month), and livelihood support.',
        '',
        'To begin your enrollment:',
        '1. Reply with a Voice Note or message sharing your education, current occupation, and desired vocational training trade.',
        '2. Or simply reply "START" or "YES" to this message.',
        customNote ? `\nOfficer Note: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - Government PM-AJAY Telephony & WhatsApp Automated Intake Platform_',
      ]
        .filter(Boolean)
        .join('\n');
    }
  }, [selectedCallId, phone, beneficiaryName, language, customNote]);

  // Web direct link
  const directWaLink = useMemo(() => {
    const digits = phone.replace(/\D/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(cleanMessage)}`;
  }, [phone, cleanMessage]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(cleanMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatch = async () => {
    setIsSubmitting(true);
    setDispatchResult(null);

    try {
      const res = await fetch('/api/calls/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          language,
          mode: 'intake',
          caseId: selectedCallId,
          beneficiaryName,
          customNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult({
          success: true,
          message: data.message,
          wa_link: data.wa_link,
        });
        if (onDispatched) {
          onDispatched();
        }
      } else {
        setDispatchResult({
          success: false,
          error: data.error || 'Failed to dispatch WhatsApp message.',
        });
      }
    } catch (err: any) {
      setDispatchResult({
        success: false,
        error: err.message || 'Network error while dispatching message.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in-50 duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-[#075E54] to-[#128C7E] p-5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                Initialise Call Record / Voice Intake
              </h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Dispatch PM-AJAY voice intake & course notification to citizen via WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Select Existing Call Record */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Select Beneficiary Call Record:
            </label>
            <select
              value={selectedCallId}
              onChange={(e) => handleSelectCall(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#075E54] min-h-[42px] cursor-pointer"
            >
              <option value="">-- Enter New / Custom Citizen Phone --</option>
              {allCalls.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.phone} — Case {c.case_id} ({c.channel?.toUpperCase() || 'IVR'})
                </option>
              ))}
            </select>
          </div>

          {/* Citizen Phone & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Citizen Phone Number:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] min-h-[42px]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Intake Language:
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] min-h-[42px] cursor-pointer"
                >
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="en">English (Official)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Beneficiary Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Beneficiary Name (Optional):
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="e.g. Priya S"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] min-h-[42px]"
              />
            </div>
          </div>

          {/* Optional Officer Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Additional Officer Note (Optional):
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please bring Aadhaar card to the block office on Monday."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] resize-none"
              />
            </div>
          </div>

          {/* Result / Status Banner */}
          {dispatchResult && (
            <div
              className={cn(
                'p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200',
                dispatchResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              )}
            >
              {dispatchResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">
                  {dispatchResult.success
                    ? 'Call Record Initialized & Dispatched!'
                    : 'Dispatch Notice'}
                </p>
                <p className="text-[11px] mt-0.5">
                  {dispatchResult.message || dispatchResult.error}
                </p>
                {dispatchResult.wa_link && (
                  <a
                    href={dispatchResult.wa_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#075E54] hover:underline mt-1.5 text-[11px]"
                  >
                    <span>Open directly in WhatsApp Web / App</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#0A783C]" />
                <span className="text-[#0A783C]">Copied Message!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Open in WhatsApp Web */}
            <a
              href={directWaLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <span>Open in WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* Send via WhatsApp API */}
            <Button
              size="sm"
              onClick={handleDispatch}
              disabled={isSubmitting || !phone || phone.length < 10}
              className="flex-1 sm:flex-none text-xs font-bold gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Initialising...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Initialise Call Record</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
