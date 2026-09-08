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
  BookOpen,
  GraduationCap,
  Briefcase,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { CallRecordItem } from '../types';
import { buildRealDataWhatsAppMessage } from '@/lib/notification-formatter';

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
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(true);
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
        initialCall.beneficiary_name ||
          (initialCall.case_id ? `Citizen (${initialCall.case_id})` : 'Beneficiary')
      );
      setSelectedCourse(initialCall.citizen_selected_course || '');
    } else if (allCalls.length > 0 && !selectedCallId) {
      const first = allCalls[0];
      setSelectedCallId(first.case_id);
      setPhone(first.phone || '+91');
      setLanguage((first.language as any) || 'ta');
      setBeneficiaryName(first.beneficiary_name || 'Beneficiary');
      setSelectedCourse(first.citizen_selected_course || '');
    }
    setDispatchResult(null);
  }, [initialCall, isOpen]);

  // Current selected call item with real confirmed fields & recommendations
  const currentCall = useMemo(() => {
    return allCalls.find((c) => c.case_id === selectedCallId) || initialCall || null;
  }, [allCalls, selectedCallId, initialCall]);

  // Handle selecting an existing beneficiary call record
  const handleSelectCall = (caseId: string) => {
    setSelectedCallId(caseId);
    setDispatchResult(null);
    const found = allCalls.find((c) => c.case_id === caseId);
    if (found) {
      setPhone(found.phone || '+91');
      setLanguage((found.language as any) || 'ta');
      setBeneficiaryName(found.beneficiary_name || `Citizen (${found.case_id})`);
      setSelectedCourse(found.citizen_selected_course || '');
    } else {
      setSelectedCourse('');
    }
  };

  // Determine if this call has real intake data
  const hasRealIntakeData = useMemo(() => {
    if (!currentCall?.confirmed_fields) return false;
    return Object.values(currentCall.confirmed_fields).some(
      (v) => v && !['none', 'n/a'].includes(String(v).toLowerCase().trim())
    );
  }, [currentCall]);

  // Clean, official message generated from real data
  const cleanMessage = useMemo(() => {
    const caseId = selectedCallId || 'WA-' + phone.replace(/\D/g, '').slice(-4);
    return buildRealDataWhatsAppMessage({
      phone,
      language,
      caseId,
      beneficiaryName,
      confirmedFields: currentCall?.confirmed_fields,
      recommendedCourses: currentCall?.recommended_courses,
      selectedCourse: selectedCourse || currentCall?.citizen_selected_course,
      customNote,
      isConfirmedStatus:
        currentCall?.citizen_confirmed || currentCall?.status === 'BENEFICIARY_CONFIRMED',
    });
  }, [selectedCallId, phone, language, beneficiaryName, currentCall, selectedCourse, customNote]);

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
          confirmed_fields: currentCall?.confirmed_fields,
          recommended_courses: currentCall?.recommended_courses,
          selected_course: selectedCourse || currentCall?.citizen_selected_course,
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
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-[#075E54] to-[#128C7E] p-5 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                Dispatch Real PM-AJAY Confirmation
              </h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Bilingual WhatsApp receipt with real verified beneficiary profile & course choices
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

        {/* Modal Form Content (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
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
                  {c.citizen_selected_course ? ` [Selected: ${c.citizen_selected_course.slice(0, 20)}...]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Real Confirmed Data Highlight Banner */}
          {hasRealIntakeData && currentCall && (
            <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-800 text-[11px] uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Voice Intake Data Connected
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
                  {currentCall.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/60">
                <div>
                  <span className="text-emerald-700 font-medium">Education: </span>
                  <span className="font-bold text-emerald-900">
                    {currentCall.confirmed_fields?.educational_background || 'Recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-700 font-medium">Current Work: </span>
                  <span className="font-bold text-emerald-900">
                    {currentCall.confirmed_fields?.current_livelihood || currentCall.confirmed_fields?.family_occupation || 'Recorded'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-emerald-700 font-medium">Skills / Trade: </span>
                  <span className="font-bold text-emerald-900">
                    {currentCall.confirmed_fields?.skills_and_interests || 'General'}
                  </span>
                </div>
              </div>

              {/* Citizen Voice Selection Callout */}
              {currentCall.citizen_selected_course && (
                <div className="p-2 bg-white/80 rounded-lg border border-emerald-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="text-[11px]">
                    <span className="text-slate-600">Citizen Voice Call Selection: </span>
                    <strong className="text-emerald-950 font-bold">{currentCall.citizen_selected_course}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

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
                Receipt Language:
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
                  <option value="en">English (Official Administrative)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Beneficiary Name & Course Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Beneficiary Name:
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

            {/* Course Selector (if recommendations exist) */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Course Notification Focus:
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] min-h-[42px] cursor-pointer"
                >
                  {currentCall?.citizen_selected_course && (
                    <option value={currentCall.citizen_selected_course}>
                      🎯 Citizen Choice: {currentCall.citizen_selected_course}
                    </option>
                  )}
                  <option value="">-- All Top 3 Recommended Courses --</option>
                  {currentCall?.recommended_courses?.map((rc: any) => (
                    <option key={rc.qp_code} value={rc.qp_name}>
                      {rc.qp_name} (NSQF {rc.nsqf_level})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Optional Officer Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Officer Directive / Additional Note (Optional):
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please bring Aadhaar card and bank passbook to the block office on Monday."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#075E54] resize-none"
              />
            </div>
          </div>

          {/* Live Message Preview Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-700 uppercase tracking-wider py-1 hover:text-[#075E54] cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#075E54]" />
                Live WhatsApp Message Preview (Real Data)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </span>
            </button>

            {showPreview && (
              <div className="mt-2 bg-[#EFEAE2] p-3 rounded-xl border border-slate-300/80 shadow-inner">
                <div className="bg-white rounded-lg p-3 shadow-xs border border-slate-200/80 text-[11px] text-slate-900 leading-relaxed font-sans whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {cleanMessage}
                </div>
              </div>
            )}
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
                    ? 'Receipt Successfully Dispatched!'
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
                    <span>Open directly in WhatsApp Web / Mobile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#0A783C]" />
                <span className="text-[#0A783C]">Copied Real Receipt!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Message Text</span>
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
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Real Receipt</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
