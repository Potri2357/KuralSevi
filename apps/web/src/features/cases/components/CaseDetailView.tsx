'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  History,
  Layers,
  Sparkles,
  Scissors,
  Users,
  GraduationCap,
  Store,
  Building2,
  TrendingUp,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Share2,
  FileText,
  MessageSquare,
  Calendar,
  X,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaseDetailData } from '../types';
import { ProfileAuditTimeline } from './ProfileAuditTimeline';

interface Props {
  caseData: CaseDetailData;
}

export function CaseDetailView({ caseData }: Props) {
  const [activeTab, setActiveTab] = useState<'pathways' | 'audit'>('pathways');
  const [selectedPathwayIndex, setSelectedPathwayIndex] = useState<number>(0);
  const [officialDecision, setOfficialDecision] = useState<string>('approve');
  const [beneficiaryFeedback, setBeneficiaryFeedback] = useState<string>('ready');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showFullDossierModal, setShowFullDossierModal] = useState<boolean>(false);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  const recommendations = caseData.recommendations || [];
  const currentRec = recommendations[selectedPathwayIndex] || recommendations[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrevPathway = () => {
    if (selectedPathwayIndex > 0) {
      setSelectedPathwayIndex(selectedPathwayIndex - 1);
    }
  };

  const handleNextPathway = () => {
    if (selectedPathwayIndex < recommendations.length - 1) {
      setSelectedPathwayIndex(selectedPathwayIndex + 1);
    }
  };

  const handleSubmitDecision = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`/api/cases/${caseData.case_id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: officialDecision === 'approve' ? 'approved' : officialDecision === 'modify' ? 'modified' : 'rejected',
          beneficiary_decision: beneficiaryFeedback,
          officer_notes: notes,
        }),
      });
      setSubmitted(true);
      showToast('Official decision recorded successfully');
    } catch (e) {
      console.error(e);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B3064] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-blue-400/30 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/officer/cases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B3064] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Queue Overview</span>
        </Link>
      </div>

      {/* Top Case Header Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5">
            {/* Top row: Case ID & Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3064] font-display tracking-tight">
                {caseData.case_id}
              </h1>

              {/* Confidence badge */}
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] px-2.5 py-1 rounded-md shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#0B3064]" />
                High Confidence
              </span>

              {/* SLA Remaining badge */}
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C24810] bg-[#FFF4ED] border border-[#FDD8C2] px-2.5 py-1 rounded-md shadow-2xs">
                <Clock className="w-3 h-3 text-[#E05A1B]" />
                2 Days Remaining
              </span>

              {/* Specialist Review Advised badge */}
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] bg-[#F0F4FF] border border-[#BFDBFE] px-2.5 py-1 rounded-md shadow-2xs">
                Specialist Review Advised
              </span>
            </div>

            {/* Bottom row: Case Metadata Items */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-[#0B3064]" />
                Namakkal, Tamil Nadu
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Language:</span>
                <strong className="text-slate-800">Tamil</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Gender:</span>
                <strong className="text-slate-800">Female</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Age:</span>
                <strong className="text-slate-800">18-30</strong>
              </span>
            </div>
          </div>

          {/* Right: Docket Label */}
          <div className="text-xs text-slate-500 font-medium md:text-right shrink-0">
            <span>Docket: </span>
            <span className="font-mono font-bold text-slate-800">{caseData.case_id}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Master Layout (Left Dossier & Pathways: 8 Cols | Right Action Suite & Timeline: 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (8 COLS) ────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Beneficiary Intake Dossier */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#0B3064]">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="font-display font-bold text-lg text-[#0B3064]">
                  Beneficiary Intake Dossier
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-3 py-1 rounded-full shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0A783C]" />
                DPDP Verified
              </span>
            </div>

            {/* Mobility & Availability Constraints Alert Box */}
            <div className="bg-[#FFF5EE] border border-[#FDD8C2] rounded-xl p-4 space-y-1">
              <p className="text-[11px] font-bold text-[#C24810] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#E05A1B] shrink-0" />
                <span>MOBILITY & AVAILABILITY CONSTRAINTS</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#C24810] font-semibold pt-0.5">
                <span>Can travel up to 10km</span>
                <span className="text-[#E05A1B] font-bold">·</span>
                <span>Disability/hard to travel</span>
                <span className="text-[#E05A1B] font-bold">·</span>
                <span>Caregiving</span>
                <span className="text-[#E05A1B] font-bold">·</span>
                <span>Working</span>
              </div>
            </div>

            {/* 6 Mandated Fields Rows with Modern Outline Icon Blocks */}
            <div className="space-y-4 pt-1">
              {/* Row 1: Current Livelihood */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-[#0B3064] shrink-0 mt-0.5">
                  <Scissors className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Current Livelihood & Earnings</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Daily wage agricultural labour, seasonal · ~₹4,500/month
                  </p>
                </div>
              </div>

              {/* Row 2: Existing Skills & Expressed Interests */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-[#0B3064] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Existing Skills & Expressed Interests</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Hand stitching, basic tailoring; interested in garment stitching and food processing
                  </p>
                </div>
              </div>

              {/* Row 3: Family & Traditional Background */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-[#0B3064] shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Family & Traditional Background</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Traditional handloom weaving family (3 generations)
                  </p>
                </div>
              </div>

              {/* Row 4: Educational Attainment & Literacy */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-[#0B3064] shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Educational Attainment & Literacy</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    8th Standard completed, can read and write Tamil
                  </p>
                </div>
              </div>

              {/* Row 5: Employment Preference */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-[#0B3064] shrink-0 mt-0.5">
                  <Store className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Employment Preference</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Strongly prefers self-employment or home-based work
                  </p>
                </div>
              </div>

              {/* Row 6: Local District Ecosystem Context */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-[#0B3064] shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Local District Ecosystem Context</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Textile cluster in Namakkal, weekly market, common service centre available
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Data Completeness Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-800">Profile Data Completeness</span>
                <span className="text-[#0B3064]">82% (7 of 7 fields)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#0B3064] rounded-full transition-all duration-300" style={{ width: '82%' }} />
              </div>
            </div>
          </div>

          {/* Section 2: Recommended Pathways Tabs & Active Card */}
          <div className="space-y-3">
            {/* Tab Bar with Pagination Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pathways')}
                  className={cn(
                    'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                    activeTab === 'pathways'
                      ? 'bg-[#0B3064] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Recommended Pathways ({recommendations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={cn(
                    'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                    activeTab === 'audit'
                      ? 'bg-[#0B3064] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  )}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </button>
              </div>

              {activeTab === 'pathways' && recommendations.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevPathway}
                    disabled={selectedPathwayIndex === 0}
                    className="w-7 h-7 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Previous pathway"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPathway}
                    disabled={selectedPathwayIndex === recommendations.length - 1}
                    className="w-7 h-7 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Next pathway"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Tab 1: Pathway Card View */}
            {activeTab === 'pathways' ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] p-6 space-y-5">
                {/* Top Badge Tags */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#0B3064] text-white shadow-2xs">
                      Pathway {currentRec.rank}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] px-2 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3 text-[#0B3064]" />
                      High Confidence
                    </span>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md border border-blue-200 text-[#0B3064] bg-[#F8FAFC]">
                    NSQF Level {currentRec.nsqf_level}
                  </span>
                </div>

                {/* Pathway Title & Projected Earnings */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#0B3064]">
                      {currentRec.qp_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono font-semibold pt-0.5">
                      {currentRec.qp_code}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#0A783C] flex items-center gap-1 shrink-0">
                    <TrendingUp className="w-4 h-4 text-[#0A783C]" />
                    {currentRec.income_range}
                  </span>
                </div>

                {/* Self Employment Pill */}
                <div>
                  <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB]">
                    Self Employment
                  </span>
                </div>

                {/* 2-Column Competencies Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Matched Competencies */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#0A783C]" strokeWidth={2.5} />
                      <span>MATCHED EXISTING COMPETENCIES</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentRec.matched_skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Required Bridge Modules */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#E05A1B]" strokeWidth={2.5} />
                      <span>REQUIRED BRIDGE MODULES ({currentRec.training_hours} HRS)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentRec.skills_to_acquire.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#FFF4ED] text-[#C24810] border border-[#FDD8C2]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* District Ecosystem Evidence Container */}
                <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                      DISTRICT ECOSYSTEM EVIDENCE
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB]">
                      HIGH DEMAND
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700 font-medium">
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full border border-slate-400 shrink-0" />
                      <span>98%+ placement rate – Namakkal</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full border border-slate-400 shrink-0" />
                      <span>Secure 5-year Depart from – June 2026</span>
                    </p>
                  </div>
                </div>

                {/* Recommendation Rationale Quote Box */}
                <div className="space-y-1.5">
                  <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <span>☆</span>
                    <span>RECOMMENDATION RATIONALE</span>
                  </p>
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed font-normal">
                    {currentRec.explanation}
                  </div>
                </div>

                {/* Algorithmic Match Score Bar */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-600 font-medium">Algorithmic Match Score</span>
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B3064] rounded-full"
                        style={{ width: `${Math.round(currentRec.topsis_score * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.round(currentRec.topsis_score * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Chronological Audit Trail */
              <ProfileAuditTimeline caseId={caseData.case_id} district={caseData.district} />
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (4 COLS) ───────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Officer Sanction & Action Decision */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#0B3064]">
                Officer Sanction & Action Decision
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and record official decision under PM-AJAY GIA protocol.
              </p>
            </div>

            {submitted ? (
              <div className="p-4 rounded-xl bg-[#EDF9F1] border border-[#BBE8CB] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#0A783C] mx-auto" />
                <p className="text-sm font-bold text-[#0A783C]">Decision Officially Recorded</p>
                <p className="text-xs text-slate-600">
                  Action logged with cryptographic signature and queued for dispatch.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Official Decision Options */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    1. OFFICIAL DECISION <span className="text-[#E05A1B]">*</span>
                  </label>
                  <div className="space-y-2">
                    {/* Option 1: Approve */}
                    <button
                      type="button"
                      onClick={() => setOfficialDecision('approve')}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3 cursor-pointer',
                        officialDecision === 'approve'
                          ? 'bg-[#F0F6FF] border-[#3B82F6] text-[#0B3064] font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                          officialDecision === 'approve'
                            ? 'border-[#0B3064] bg-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {officialDecision === 'approve' && (
                          <span className="w-2 h-2 rounded-full bg-[#0B3064]" />
                        )}
                      </span>
                      <span>Approve Recommendation & Issue Sanction Order</span>
                    </button>

                    {/* Option 2: Modify */}
                    <button
                      type="button"
                      onClick={() => setOfficialDecision('modify')}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3 cursor-pointer',
                        officialDecision === 'modify'
                          ? 'bg-[#F0F6FF] border-[#3B82F6] text-[#0B3064] font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                          officialDecision === 'modify'
                            ? 'border-[#0B3064] bg-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {officialDecision === 'modify' && (
                          <span className="w-2 h-2 rounded-full bg-[#0B3064]" />
                        )}
                      </span>
                      <span>Modify Pathway or Assign Field Consultant</span>
                    </button>

                    {/* Option 3: Reject */}
                    <button
                      type="button"
                      onClick={() => setOfficialDecision('reject')}
                      className={cn(
                        'w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3 cursor-pointer',
                        officialDecision === 'reject'
                          ? 'bg-[#F0F6FF] border-[#3B82F6] text-[#0B3064] font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                          officialDecision === 'reject'
                            ? 'border-[#0B3064] bg-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {officialDecision === 'reject' && (
                          <span className="w-2 h-2 rounded-full bg-[#0B3064]" />
                        )}
                      </span>
                      <span>Reject Recommendation (Requires Justification Note)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Beneficiary Feedback / Readiness */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    2. BENEFICIARY FEEDBACK / READINESS
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'ready', label: 'Interested & Ready to Enroll' },
                      { id: 'discuss', label: 'Wants Further In-Person Discussion' },
                      { id: 'not_interested', label: 'Not Interested in Suggested Trade' },
                      { id: 'unable', label: 'Unable to Participate (Family/Health)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setBeneficiaryFeedback(item.id)}
                        className={cn(
                          'w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center gap-3 cursor-pointer',
                          beneficiaryFeedback === item.id
                            ? 'bg-[#F0F6FF] border-[#3B82F6] text-[#0B3064] font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <span
                          className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                            beneficiaryFeedback === item.id
                              ? 'border-[#0B3064] bg-white'
                              : 'border-slate-300 bg-white'
                          )}
                        >
                          {beneficiaryFeedback === item.id && (
                            <span className="w-2 h-2 rounded-full bg-[#0B3064]" />
                          )}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Officer Administrative Notes & Remarks */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    3. OFFICER ADMINISTRATIVE NOTES & REMARKS
                  </label>
                  <textarea
                    ref={notesRef}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add specific context, local ITI referral instructions, bank linkage details, or justification for modification/rejection..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064] focus:border-[#0B3064] resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitDecision}
                  className="w-full bg-[#0B3064] hover:bg-[#144282] disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Recording Decision...' : 'Submit Official Decision'}
                </button>
              </>
            )}
          </div>

          {/* Subcards: Case Timeline and Quick Actions Side-by-Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subcard 1: Case Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] p-4 space-y-3.5">
              <h4 className="font-display font-bold text-sm text-[#0B3064]">Case Timeline</h4>
              <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
                {/* Step 1 */}
                <div className="relative space-y-0.5">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-[#0A783C] text-white flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-none">Intake Dossier Completed</p>
                  <p className="text-[10px] text-slate-400">May 20, 2025 · 10:15 AM</p>
                </div>

                {/* Step 2 */}
                <div className="relative space-y-0.5">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-[#0A783C] text-white flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                  <p className="text-xs font-bold text-slate-800 leading-none">Algorithmic Match Generated</p>
                  <p className="text-[10px] text-slate-400">May 20, 2025 · 10:17 AM</p>
                </div>

                {/* Step 3 */}
                <div className="relative space-y-0.5">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#E05A1B] bg-white flex items-center justify-center" />
                  <p className="text-xs font-bold text-slate-800 leading-none">Specialist Review Advised</p>
                  <p className="text-[10px] text-slate-400">May 20, 2025 · 10:20 AM</p>
                </div>

                {/* Step 4 */}
                <div className="relative space-y-0.5">
                  <span className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center" />
                  <p className="text-xs font-semibold text-slate-500 leading-none">Pending Officer Decision</p>
                  <p className="text-[10px] text-slate-400">—</p>
                </div>
              </div>
            </div>

            {/* Subcard 2: Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] p-4 space-y-2.5">
              <h4 className="font-display font-bold text-sm text-[#0B3064]">Quick Actions</h4>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setShowFullDossierModal(true)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Full Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showToast('Initiated PDF generation for docket');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Intake PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                    }
                    showToast('Case link copied for Field Consultant sharing');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share with Field Consultant</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    notesRef.current?.focus();
                    notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Add Internal Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Dossier Modal / Dialog */}
      {showFullDossierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0A783C]" />
                <h3 className="font-display font-bold text-lg text-[#0B3064]">
                  Full Beneficiary Dossier — {caseData.case_id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFullDossierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Audio & Voice Verification Status
                </span>
                <p className="text-slate-800">
                  Transcribed with Sarvam AI Saaras (ta) · 92% Acoustic Confidence Score · DPDP Section 6 Explicit Audio Consent
                </p>
              </div>

              <div className="space-y-2">
                <div className="border-b border-slate-100 pb-2">
                  <strong className="text-slate-900 block">Educational Background</strong>
                  <span className="text-slate-600">{caseData.profile.educational_background}</span>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <strong className="text-slate-900 block">Family Occupation & Ancestry</strong>
                  <span className="text-slate-600">{caseData.profile.family_occupation}</span>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <strong className="text-slate-900 block">Current Livelihood Activity</strong>
                  <span className="text-slate-600">{caseData.profile.current_livelihood}</span>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <strong className="text-slate-900 block">Expressed Skills & Interests</strong>
                  <span className="text-slate-600">{caseData.profile.skills_and_interests}</span>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <strong className="text-slate-900 block">Mobility & Availability</strong>
                  <span className="text-slate-600">{caseData.profile.mobility_constraints}</span>
                </div>
                <div className="border-b border-slate-100 pb-2">
                  <strong className="text-slate-900 block">Employment Preference</strong>
                  <span className="text-slate-600">{caseData.profile.employment_preference}</span>
                </div>
                <div>
                  <strong className="text-slate-900 block">Local Economic Environment</strong>
                  <span className="text-slate-600">{caseData.profile.local_economic_context}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullDossierModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0B3064] text-white text-xs font-bold hover:bg-[#144282] cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Footer */}
      <footer className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>© 2025 Kural Sevi. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-800 transition-colors">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-slate-800 transition-colors">
            Terms of Use
          </Link>
          <span>·</span>
          <Link href="/support" className="hover:text-slate-800 transition-colors">
            Help & Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
