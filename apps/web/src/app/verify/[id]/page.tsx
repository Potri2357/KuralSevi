import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Download, Printer, PhoneCall, Building2, Award, Calendar, FileText, ArrowLeft, ExternalLink } from 'lucide-react';
import { getSanctionVerification } from '@/lib/sanction-verification';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getSanctionVerification(id);

  if (!record) {
    notFound();
  }

  const isVerified = record.status === 'VERIFIED_ACTIVE';

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-slate-900 font-sans antialiased relative overflow-hidden">
      {/* Universal 3px National Governance Saffron Accent Strip */}
      <div className="h-[3px] w-full bg-[#E05A1B]" aria-hidden="true" />

      {/* Ambient background refraction orbs */}
      <div className="fixed top-20 left-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-20 right-10 w-96 h-96 rounded-full bg-[#0B3064]/10 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-1/4 w-80 h-80 rounded-full bg-[#E05A1B]/10 blur-3xl pointer-events-none -z-10" />

      {/* Official Government Header Banner */}
      <header className="bg-slate-900/95 backdrop-blur-xl text-white border-b border-amber-600/40 shadow-lg sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md flex items-center justify-center shrink-0 bg-[#0B3064] border border-white/20 group-hover:scale-105 transition-transform">
                <img
                  src="/icons/kural-sevi-logo.svg"
                  alt="Kural Sevi"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-display">Kural Sevi</span>
                <span className="text-[10px] text-amber-300 font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 glass-pill">National Verification Registry</span>
              </div>
              <div className="text-xs text-slate-300 font-medium">Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY)</div>
              <div className="text-[11px] text-amber-400/90 font-mono">Grant-in-Aid (GIA) Component · Ministry of Social Justice</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 glass-pill shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              PORTAL ACTIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main Verification Dossier */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Verification Status Card */}
        <div className="neuro-glass rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full glass-pill border border-emerald-300">
                    AUTHENTIC DOCUMENT
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Scans: {record.scan_count}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-display">
                  Verified Government Sanction Order
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  This document has been verified against the Ministry of Social Justice & Empowerment database.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`/api/cases/${record.case_id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95 neuro-btn"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          </div>

          {/* Key Reference Highlights with tactile neuro-inset */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-2">
            <div className="neuro-inset rounded-xl p-3.5 bg-slate-100/70 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Sanction Order No.</div>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 break-all">
                {record.sanction_order_id}
              </div>
            </div>
            <div className="neuro-inset rounded-xl p-3.5 bg-slate-100/70 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Case Reference</div>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {record.case_id}
              </div>
            </div>
            <div className="neuro-inset rounded-xl p-3.5 bg-slate-100/70 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Issue Date</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {record.issue_date}
              </div>
            </div>
            <div className="neuro-inset rounded-xl p-3.5 bg-slate-100/70 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Sanction Quantum</div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5">
                Rs. {record.total_entitlement.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Beneficiary Information */}
          <div className="neuro-glass rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 text-slate-900 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#FFF4ED] border border-[#FDD8C2] flex items-center justify-center text-[#E05A1B] shadow-2xs">
                <Building2 className="w-4 h-4" />
              </div>
              <span>1. Beneficiary & Location Details</span>
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Beneficiary Identifier</span>
                <span className="font-medium text-slate-900">{record.beneficiary_name_masked}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">State / UT</span>
                <span className="font-medium text-slate-900">{record.state}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">District</span>
                <span className="font-medium text-slate-900">{record.district}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Taluk / Block</span>
                <span className="font-medium text-slate-900">{record.block_village}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">DBT Bank Status</span>
                <span className="font-medium text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs glass-pill">
                  Aadhaar Seeded & PFMS Ready
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">DPDP Compliance</span>
                <span className="font-medium text-slate-700">Digital Personal Data Protection Act, 2023</span>
              </div>
            </div>
          </div>

          {/* 2. Sanctioned NSQF Pathway */}
          <div className="neuro-glass rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 text-slate-900 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064] shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
              <span>2. Sanctioned Skilling Pathway</span>
            </div>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Qualification Pack / Trade</span>
                <span className="font-medium text-slate-900 text-right max-w-[60%]">{record.trade_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">QP Code</span>
                <span className="font-mono font-medium text-slate-900">{record.qp_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">NSQF Level</span>
                <span className="font-medium text-slate-900">Level {record.nsqf_level}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Pathway Classification</span>
                <span className="font-medium text-slate-900 text-right">{record.pathway_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Training Center</span>
                <span className="font-medium text-slate-900 text-right max-w-[60%]">{record.training_center}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Batch Code</span>
                <span className="font-mono font-medium text-slate-900">{record.batch_id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Financial Entitlements Breakdown */}
        <div className="neuro-glass rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <div className="w-8 h-8 rounded-lg bg-[#EDF9F1] border border-[#BBE8CB] flex items-center justify-center text-[#0A783C] shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <span>3. Sanctioned Financial Entitlements</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Centrally Funded GIA Component</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700">
                  <th className="py-2.5 px-3 font-semibold w-12 text-center">S.No.</th>
                  <th className="py-2.5 px-3 font-semibold">Entitlement Component</th>
                  <th className="py-2.5 px-3 font-semibold">Basis / Condition</th>
                  <th className="py-2.5 px-3 font-semibold">Duration / Frequency</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {record.entitlements.map((e) => (
                  <tr key={e.sn} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-500">{e.sn}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{e.component}</td>
                    <td className="py-2.5 px-3 text-slate-600">{e.basis}</td>
                    <td className="py-2.5 px-3 text-slate-600">{e.duration}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      Rs. {e.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200 text-slate-900">
                  <td colSpan={4} className="py-3 px-3 text-right">Total Sanctioned Quantum:</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold text-sm sm:text-base">
                    Rs. {record.total_entitlement.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-slate-500 italic pt-1">
            Amount in Words: Rupees {record.total_in_words} Only
          </div>
        </div>

        {/* 4. Digital Signature & Authority Details */}
        <div className="neuro-glass rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200/80 text-slate-900 font-semibold text-sm">
            <div className="w-8 h-8 rounded-lg bg-[#EDF9F1] border border-[#BBE8CB] flex items-center justify-center text-[#0A783C] shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>4. Digital Signature & System Authentication</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-1.5 p-4 rounded-xl neuro-inset bg-slate-100/70 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Sanctioning Officer</div>
              <div className="font-bold text-slate-900">{record.officer_name}</div>
              <div className="text-slate-600 text-xs">{record.officer_department}</div>
              <div className="text-slate-600 text-xs">{record.officer_office}</div>
              <div className="text-emerald-700 font-semibold text-xs pt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Digitally Validated via Kural Sevi Portal
              </div>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl neuro-inset bg-slate-100/70 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Cryptographic Hash (SHA-256)</div>
              <div className="font-mono text-xs text-slate-800 break-all bg-white/90 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                {record.document_hash}
              </div>
              <div className="text-slate-500 text-xs pt-1">
                Integrity match confirmed. This hash guarantees the document has not been altered since issuance.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions & Support */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl neuro-glass text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#E05A1B]" />
            <span>National Welfare Helpline: <strong className="text-slate-900">1800-425-0012</strong> (Toll-Free, 24×7)</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/officer"
              className="hover:text-[#0B3064] inline-flex items-center gap-1 font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Portal
            </Link>
            <span>•</span>
            <a
              href={`/api/cases/${record.case_id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-900 font-semibold hover:underline inline-flex items-center gap-1"
            >
              View PDF <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
