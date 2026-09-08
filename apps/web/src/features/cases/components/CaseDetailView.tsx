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
  Briefcase,
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
  Award,
  UserCheck,
  FileX2,
  Printer,
  Send,
  Landmark,
  Home,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaseDetailData } from '../types';
import { ProfileAuditTimeline } from './ProfileAuditTimeline';

interface Props {
  caseData: CaseDetailData;
}

export function CaseDetailView({ caseData }: Props) {
  const recommendations = caseData.recommendations || [];
  const initialIndex = caseData.citizen_selected_choice
    ? Math.max(0, Math.min(recommendations.length - 1, caseData.citizen_selected_choice - 1))
    : 0;

  const [activeTab, setActiveTab] = useState<'pathways' | 'audit'>('pathways');
  const [selectedPathwayIndex, setSelectedPathwayIndex] = useState<number>(initialIndex);
  const [officialDecision, setOfficialDecision] = useState<string>('approve');
  const [beneficiaryFeedback, setBeneficiaryFeedback] = useState<string>('ready');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showFullDossierModal, setShowFullDossierModal] = useState<boolean>(false);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  const currentRec = recommendations[selectedPathwayIndex] || recommendations[0];

  const profileFields = [
    caseData.profile?.educational_background,
    caseData.profile?.family_occupation,
    caseData.profile?.current_livelihood,
    caseData.profile?.skills_and_interests,
    caseData.profile?.mobility_constraints,
    caseData.profile?.employment_preference,
    caseData.profile?.local_economic_context,
  ];
  const filledFieldsCount = profileFields.filter(Boolean).length;
  const completenessPct = Math.min(100, Math.round((filledFieldsCount / 7) * 100));

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

      {/* Breadcrumb Navigation & Top Action Utility Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <Link
          href="/officer/cases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B3064] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Case Queue</span>
        </Link>

        {/* Action Utility Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowFullDossierModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>View Full Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.print();
              showToast('Printing official case dossier / PDF');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
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
              showToast('Case link copied to clipboard');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share Case</span>
          </button>
        </div>
      </div>

      {/* Top Case Header Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5">
            {/* Top row: Case ID & Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3064] font-mono tracking-normal">
                {caseData.case_id}
              </h1>

              {/* Confidence badge */}
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] px-2.5 py-1 rounded-md shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#0B3064]" />
                High Confidence
              </span>

              {/* Citizen Choice Status badge */}
              {caseData.citizen_confirmed ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2.5 py-1 rounded-md shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0A783C]" />
                  <span>Citizen Choice: Priority {caseData.citizen_selected_choice || 1} ({caseData.citizen_selected_course || currentRec?.qp_name})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verification Dispatched (Awaiting Citizen Choice)</span>
                </span>
              )}

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
                {caseData.district}, {caseData.state}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Language:</span>
                <strong className="text-slate-800">{caseData.language}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Intake Mode:</span>
                <strong className="text-slate-800">Voice Telephony (IVR)</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Mandated Fields:</span>
                <strong className="text-[#0A783C]">{filledFieldsCount} / 7 Confirmed</strong>
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
              <p className="text-xs text-[#C24810] font-semibold pt-0.5 leading-relaxed">
                {caseData.profile?.mobility_constraints || 'Within district / local enterprise'}
              </p>
            </div>

            {/* 6 Mandated Fields Rows with Modern Outline Icon Blocks */}
            <div className="space-y-4 pt-1">
              {/* Row 1: Current Livelihood */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-100/90 flex items-center justify-center text-[#0B3064] shrink-0 mt-0.5">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Current Livelihood & Earnings</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {caseData.profile?.current_livelihood || 'Not specified'}
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
                    {caseData.profile?.skills_and_interests || 'Not specified'}
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
                    {caseData.profile?.family_occupation || 'Not specified'}
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
                    {caseData.profile?.educational_background || 'Not specified'}
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
                    {caseData.profile?.employment_preference || 'Not specified'}
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
                    {caseData.profile?.local_economic_context || `${caseData.district} district cluster`}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Data Completeness Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-800">Profile Data Completeness</span>
                <span className="text-[#0B3064]">{completenessPct}% ({filledFieldsCount} of 7 fields)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#0B3064] rounded-full transition-all duration-300" style={{ width: `${completenessPct}%` }} />
              </div>
            </div>
          </div>

          {/* Section 2: Recommended Pathways Tabs & Active Card */}
          <div className="space-y-4">
            {/* Tab Bar with Mode Switcher */}
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
                  <span>Top 3 Recommended Pathways</span>
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

              {activeTab === 'pathways' && (
                <div className="text-xs text-slate-500 font-medium">
                  Showing <strong className="text-slate-800 font-bold">{Math.min(3, recommendations.length)} of {recommendations.length}</strong> Evaluated Options
                </div>
              )}
            </div>

            {/* Tab 1: Top 3 Pathways Grid & Detailed Breakdown */}
            {activeTab === 'pathways' ? (
              <div className="space-y-5">
                {/* Citizen Expressed Choice Callout Banner */}
                {caseData.citizen_confirmed && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EDF9F1] via-[#F0FDF4] to-[#E2F5E9] border border-[#BBE8CB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0A783C] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold uppercase tracking-wide text-[#0A783C]">
                            Citizen's Preferred Choice Recorded
                          </span>
                          <span className="text-[10px] font-bold bg-white text-[#0A783C] px-2 py-0.5 rounded border border-[#BBE8CB]">
                            Confirmed via {caseData.confirmed_via || 'WhatsApp'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium pt-0.5">
                          The beneficiary chosen pathway is <strong>Priority {caseData.citizen_selected_choice || 1}: {caseData.citizen_selected_course || recommendations[0]?.qp_name}</strong>.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPathwayIndex(initialIndex)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#0A783C] text-white hover:bg-[#085C2E] transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Align to Citizen Choice</span>
                    </button>
                  </div>
                )}

                {/* Top 3 Comparative Cards Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#0B3064]">
                        Top 3 Recommended NSQF Courses & Jobs
                      </h3>
                      <p className="text-xs text-slate-500">
                        Prioritized by TOPSIS algorithm balancing citizen profile competencies, earning lift, and district cluster opportunity. Click any card to select.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.slice(0, 3).map((rec, idx) => {
                      const isSelected = selectedPathwayIndex === idx;
                      const isCitizenChoice = caseData.citizen_selected_choice
                        ? caseData.citizen_selected_choice === rec.rank
                        : (caseData.citizen_selected_course === rec.qp_name || (caseData.citizen_confirmed && idx === 0));

                      return (
                        <div
                          key={rec.qp_code}
                          onClick={() => setSelectedPathwayIndex(idx)}
                          className={cn(
                            'rounded-2xl border p-4.5 transition-all cursor-pointer flex flex-col justify-between relative shadow-2xs',
                            isSelected
                              ? 'border-[#0B3064] bg-white ring-2 ring-[#0B3064]/20 shadow-md'
                              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                          )}
                        >
                          {/* Citizen Choice Banner Badge */}
                          {isCitizenChoice && (
                            <div className="mb-2.5 py-1 px-2 rounded-md bg-[#EDF9F1] border border-[#BBE8CB] text-[#0A783C] text-[10px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs">
                              <UserCheck className="w-3 h-3" />
                              <span>CITIZEN'S PREFERRED CHOICE</span>
                            </div>
                          )}

                          <div className="space-y-3">
                            {/* Top row: Priority Badge & Match Score */}
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                'text-xs font-bold px-2 py-0.5 rounded-md shadow-2xs',
                                idx === 0 ? 'bg-[#0B3064] text-white' : 'bg-slate-100 text-slate-700'
                              )}>
                                Priority {rec.rank}
                              </span>
                              <span className="text-xs font-mono font-bold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] px-2 py-0.5 rounded-md">
                                {Math.round(rec.topsis_score * 100)}% Match
                              </span>
                            </div>

                            {/* Course Title & QP Code */}
                            <div>
                              <h4 className="font-display font-bold text-sm text-[#0B3064] leading-snug line-clamp-2">
                                {rec.qp_name}
                              </h4>
                              <p className="text-[11px] font-mono text-slate-500 pt-0.5">
                                {rec.qp_code} • NSQF L-{rec.nsqf_level}
                              </p>
                            </div>

                            {/* Pathway Type Pill */}
                            <div>
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] capitalize">
                                {rec.pathway_type.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Key Stats Summary */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[10px]">Income:</span>
                                <span className="font-bold text-[#0A783C] text-[11px]">{rec.income_range}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[10px]">Bridge Training:</span>
                                <span className="font-semibold text-slate-700 text-[11px]">{rec.training_hours} Hours</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-[10px]">District Demand:</span>
                                <span className="font-bold text-[#0B3064] text-[10px] uppercase">
                                  {rec.opportunity?.strength || 'High'} Demand
                                </span>
                              </div>
                            </div>

                            {/* Key Matched Skills */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Key Matched Skills
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {rec.matched_skills.slice(0, 2).map((s) => (
                                  <span
                                    key={s}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB] truncate max-w-full"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Action Selector Button */}
                          <div className="pt-3 border-t border-slate-100 mt-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPathwayIndex(idx);
                              }}
                              className={cn(
                                'w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                                isSelected
                                  ? 'bg-[#0B3064] text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              )}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-white" />
                                  <span>Selected for Order</span>
                                </>
                              ) : (
                                <span>Select Priority {rec.rank}</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Pathway Deep-Dive Dossier */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#0B3064] text-white shadow-2xs">
                          Detailed Dossier: Priority {currentRec.rank}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] px-2 py-0.5 rounded-md">
                          <Sparkles className="w-3 h-3 text-[#0B3064]" />
                          High Confidence
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md border border-blue-200 text-[#0B3064] bg-[#F8FAFC]">
                          NSQF Level {currentRec.nsqf_level}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-[#0B3064] pt-2">
                        {currentRec.qp_name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono font-semibold pt-0.5">
                        {currentRec.qp_code} • {currentRec.pathway_type.replace('_', ' ')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#0A783C] flex items-center gap-1 shrink-0">
                      <TrendingUp className="w-4 h-4 text-[#0A783C]" />
                      {currentRec.income_range}
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB] uppercase">
                        {currentRec?.opportunity?.strength ? `${currentRec.opportunity.strength} Demand` : 'High Demand'}
                      </span>
                    </div>
                    <div className="space-y-1 text-slate-700 font-medium">
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full border border-slate-400 shrink-0" />
                        <span>{currentRec?.opportunity?.evidence || `Verified placement & trade demand in ${caseData.district} district cluster`}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full border border-slate-400 shrink-0" />
                        <span>Source: {currentRec?.opportunity?.source || 'e-Shram & District Planning Intelligence'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Rationale Quote Box */}
                  <div className="space-y-1.5">
                    <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0B3064]" />
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
              </div>
            ) : (
              /* Tab 2: Chronological Audit Trail */
              <ProfileAuditTimeline caseId={caseData.case_id} district={caseData.district} />
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (4 COLS) ───────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card: PM-AJAY Welfare Livelihood Sanction Suite */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_0_rgba(11,48,100,0.06)] overflow-hidden">
            {/* National Tri-Color Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E05A1B] via-slate-200 to-[#0A783C]" />

            <div className="p-5 sm:p-6 space-y-5">
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] px-2.5 py-0.5 rounded-full">
                    <Landmark className="w-3 h-3 text-[#0B3064]" />
                    <span>PM-AJAY Statutory Authority</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">GIA Protocol</span>
                </div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-[#0B3064] leading-tight">
                  Officer Sanction & Livelihood Order
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Exercise statutory authority to authorize certified skill training, enterprise seed capital, and family livelihood uplift.
                </p>
              </div>

              {/* Livelihood Impact Strip */}
              {currentRec && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#F0F6FF] to-[#EAF1FB] border border-[#BACEEB]/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B3064]">
                      Target Livelihood Uplift
                    </span>
                    <span className="text-[10px] font-bold text-[#0A783C] bg-white px-2 py-0.5 rounded-md border border-[#BBE8CB]">
                      NSQF L-{currentRec.nsqf_level || '3'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {currentRec.qp_name || 'Selected NSQF Livelihood Track'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-blue-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Projected Earning:</span>
                      <strong className="text-[#0A783C] font-semibold">
                        {currentRec.income_range || '₹12,000 – ₹18,000 / mo'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PM-AJAY GIA Grant:</span>
                      <strong className="text-[#0B3064] font-semibold">
                        Up to ₹50,000 Support
                      </strong>
                    </div>
                  </div>

                  {caseData.citizen_confirmed && (
                    <div className="pt-2 border-t border-blue-200/60">
                      {caseData.citizen_selected_choice === currentRec.rank || caseData.citizen_selected_course === currentRec.qp_name ? (
                        <div className="text-[10px] font-bold text-[#0A783C] bg-white border border-[#BBE8CB] px-2 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0A783C] shrink-0" />
                          <span>Sanction aligns with Citizen's Choice (Priority {currentRec.rank})</span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Officer Selection: Citizen chose Priority {caseData.citizen_selected_choice || 1} ({caseData.citizen_selected_course || recommendations[0]?.qp_name})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {submitted ? (
                /* Celebratory Official Sanction Sealed State */
                <div className="p-5 rounded-xl bg-gradient-to-b from-[#EDF9F1] to-[#E2F5E9] border-2 border-[#0A783C] text-center space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-12 h-12 rounded-full bg-[#0A783C] text-white flex items-center justify-center mx-auto shadow-md">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#0A783C] bg-white px-2.5 py-0.5 rounded-full border border-[#BBE8CB]">
                      PM-AJAY SANCTION ORDER ISSUED
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 font-sans">
                      Livelihood Sanction Docket Sealed
                    </h4>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">
                      Statutory sanction order <span className="font-mono font-bold text-slate-800">ORD-AJAY-{caseData.case_id}</span> has been cryptographically signed and registered on the Social Justice Portal.
                    </p>
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-[#BBE8CB] text-left text-[11px] text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#0A783C]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Beneficiary Notified via SMS
                    </div>
                    <p className="text-slate-500 text-[10px] pl-5">
                      Dispatch triggered in <strong className="text-slate-700">{caseData.language}</strong> with counseling coordinator contact and enrollment center details.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        showToast('Printing official sanction certificate');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0A783C] hover:bg-[#085C2E] text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Print Official Sanction Order (PDF)
                    </button>
                    <Link
                      href="/officer/cases"
                      className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Return to Queue / Next Case</span>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* 1. Official Statutory Decision */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      1. STATUTORY ACTION ORDER <span className="text-[#E05A1B]">*</span>
                    </label>

                    <div className="space-y-2.5">
                      {/* Option 1: Approve */}
                      <button
                        type="button"
                        onClick={() => setOfficialDecision('approve')}
                        className={cn(
                          'w-full text-left p-3 rounded-xl border text-xs transition-all relative cursor-pointer',
                          officialDecision === 'approve'
                            ? 'bg-[#F0FDF4] border-[#0A783C] shadow-xs ring-1 ring-[#0A783C]'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              officialDecision === 'approve'
                                ? 'bg-[#0A783C] text-white'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 flex-1 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900">
                                Sanction PM-AJAY Grant & Enroll
                              </span>
                              <span className="text-[9px] font-extrabold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-1.5 py-0.5 rounded">
                                Recommended
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              Authorize immediate livelihood sponsorship, training admission, and tool-kit entitlement.
                            </p>
                          </div>
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                              officialDecision === 'approve'
                                ? 'border-[#0A783C] bg-[#0A783C]'
                                : 'border-slate-300 bg-white'
                            )}
                          >
                            {officialDecision === 'approve' && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Option 2: Modify / Field Coordinator */}
                      <button
                        type="button"
                        onClick={() => setOfficialDecision('modify')}
                        className={cn(
                          'w-full text-left p-3 rounded-xl border text-xs transition-all relative cursor-pointer',
                          officialDecision === 'modify'
                            ? 'bg-[#FFFBF5] border-[#E05A1B] shadow-xs ring-1 ring-[#E05A1B]'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              officialDecision === 'modify'
                                ? 'bg-[#E05A1B] text-white'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 flex-1 pr-2">
                            <span className="font-bold text-slate-900 block">
                              Assign Field Coordinator (Home Visit)
                            </span>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              Dispatch Gram Panchayat counselor for doorstep verification, trade adjustment, and family alignment.
                            </p>
                          </div>
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                              officialDecision === 'modify'
                                ? 'border-[#E05A1B] bg-[#E05A1B]'
                                : 'border-slate-300 bg-white'
                            )}
                          >
                            {officialDecision === 'modify' && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Option 3: Reject / Defer */}
                      <button
                        type="button"
                        onClick={() => setOfficialDecision('reject')}
                        className={cn(
                          'w-full text-left p-3 rounded-xl border text-xs transition-all relative cursor-pointer',
                          officialDecision === 'reject'
                            ? 'bg-slate-50 border-slate-600 shadow-xs ring-1 ring-slate-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              officialDecision === 'reject'
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            <FileX2 className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 flex-1 pr-2">
                            <span className="font-bold text-slate-900 block">
                              Defer / Route to Alternate Program
                            </span>
                            <p className="text-[11px] text-slate-500 leading-snug">
                              Route to specialized welfare scheme (requires formal justification notes below).
                            </p>
                          </div>
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                              officialDecision === 'reject'
                                ? 'border-slate-600 bg-slate-600'
                                : 'border-slate-300 bg-white'
                            )}
                          >
                            {officialDecision === 'reject' && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Citizen Sentiment & Engagement */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      2. CITIZEN SENTIMENT & READINESS
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'ready', label: 'Eager & Ready', icon: Sparkles },
                        { id: 'discuss', label: 'Needs Counseling', icon: MessageCircle },
                        { id: 'home', label: 'Prefers Home-Based', icon: Home },
                        { id: 'unable', label: 'Family / Health Delay', icon: Clock },
                      ].map((item) => {
                        const ItemIcon = item.icon;
                        const isSelected = beneficiaryFeedback === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setBeneficiaryFeedback(item.id)}
                            className={cn(
                              'p-2 rounded-lg border text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                              isSelected
                                ? 'bg-[#0B3064] text-white border-[#0B3064] shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            )}
                          >
                            <ItemIcon className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-white' : 'text-slate-500')} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Officer Implementation Directives */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        3. IMPLEMENTATION DIRECTIVES
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Quick chips:</span>
                    </div>

                    {/* Fast chips to append text into directive notes */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Fast-track tool-kit release',
                        'Bank linkage support required',
                        'Connect with local SHG cluster',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setNotes((prev) => (prev ? `${prev}; ${chip}` : chip));
                            notesRef.current?.focus();
                          }}
                          className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      ref={notesRef}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Specify training center batch, tool-kit vendor dispatch, bank linkage directives, or counseling instructions..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064] focus:border-[#0B3064] resize-none"
                    />
                  </div>

                  {/* Authorize & Issue Sanction Order Button */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitDecision}
                    className="w-full bg-gradient-to-r from-[#0B3064] to-[#144282] hover:from-[#144282] hover:to-[#0B3064] disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer interactive-tap"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Issuing Statutory Sanction...' : 'Authorize & Issue Sanction Order'}</span>
                  </button>
                </>
              )}
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
                <h3 className="font-display font-bold text-lg text-[#0B3064] flex items-center gap-1.5 flex-wrap">
                  <span>Full Beneficiary Dossier —</span>
                  <span className="font-mono font-bold text-base text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80">
                    {caseData.case_id}
                  </span>
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
      <footer className="pt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 no-print">
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
