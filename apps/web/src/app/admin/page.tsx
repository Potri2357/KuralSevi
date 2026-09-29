import Link from 'next/link';
import { Metadata } from 'next';
import {
  Users,
  Download,
  ArrowRight,
  ShieldCheck,
  Inbox,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { IndicChakra } from '@/components/icons/indic';
import { getAllOfficerCases } from '@/lib/recommendation-service';
import { getProvisionedUsers } from '@/lib/user-store';

export const metadata: Metadata = {
  title: 'System Administration & Governance — Kural Sevi',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cases = await getAllOfficerCases();
  const provisionedUsers = getProvisionedUsers();

  const totalCases = cases.length;
  const pendingCases = cases.filter((c) => c.officer_action === 'pending').length;
  const approvedCases = cases.filter((c) => c.officer_action === 'approved').length;
  const totalStaff = provisionedUsers.length;

  const adminModules = [
    {
      title: 'Official User Management & Roles',
      desc: 'Provision District Welfare Officers and Panchayat Kiosk Operators. Assign district jurisdictions, toggle active status, and maintain national welfare registry security.',
      badge: `${totalStaff} Registered Staff`,
      badgeClass: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
      icon: Users,
      iconContainer: 'text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB]',
      href: '/admin/users',
      actionLabel: 'Manage Officials & Roles',
    },
    {
      title: 'Scheme Data Export & Analytics',
      desc: 'Download anonymized DPDP Act 2023-compliant scheme microdata, district-wise aggregations, and sanction registries in CSV and JSON formats for ministerial reviews.',
      badge: 'CSV & JSON Available',
      badgeClass: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',
      icon: Download,
      iconContainer: 'text-[#C24810] bg-[#FFF4ED] border border-[#FDD8C2]',
      href: '/admin/export',
      actionLabel: 'Open Export Datasets',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#EAF1FB] border border-[#BACEEB] px-3 py-1 rounded-full text-xs font-bold text-[#0B3064] mb-2 shadow-2xs">
            <IndicChakra className="w-3.5 h-3.5 text-[#0B3064]" strokeWidth={2.5} />
            <span>Central Administration Portal · PM-AJAY GIA</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0B3064] font-display tracking-tight">
            System Administration & Governance
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-0.5">
            Operational governance console for user management and scheme data export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white text-xs font-bold transition-all shadow-md active:scale-95 neuro-btn"
          >
            <Users className="w-4 h-4" />
            <span>Manage Staff</span>
          </Link>
          <Link
            href="/admin/export"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95 neuro-btn"
          >
            <Download className="w-4 h-4 text-[#0B3064]" />
            <span>Export Data</span>
          </Link>
        </div>
      </div>

      {/* Aggregate Metrics Bar (Matching Universal UI) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Ingested Dockets', value: totalCases, icon: Inbox, color: 'text-[#0B3064] bg-[#EAF1FB] border-[#BACEEB]' },
          { label: 'Pending Officer Review', value: pendingCases, icon: ShieldCheck, color: 'text-[#C24810] bg-[#FFF4ED] border-[#FDD8C2]' },
          { label: 'Approved Sanctions', value: approvedCases, icon: Building2, color: 'text-[#0A783C] bg-[#EDF9F1] border-[#BBE8CB]' },
          { label: 'Registered Officials', value: totalStaff, icon: Users, color: 'text-[#0B3064] bg-[#EAF1FB] border-[#BACEEB]' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="neuro-glass rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 font-display mt-0.5">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl neuro-icon flex items-center justify-center shrink-0 ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2 Core Functional Workspaces */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#0B3064] font-display">
            Administrative Workspaces
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Core governance modules for user access management and reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="neuro-glass rounded-2xl p-6 flex flex-col justify-between card-hover"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl neuro-icon flex items-center justify-center ${mod.iconContainer}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border font-mono glass-pill ${mod.badgeClass}`}>
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0B3064] font-display mb-2">
                    {mod.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans font-normal">
                    {mod.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link
                    href={mod.href}
                    className="inline-flex items-center justify-between w-full text-xs font-bold text-[#0B3064] hover:text-[#144282] transition-colors group"
                  >
                    <span>{mod.actionLabel}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
