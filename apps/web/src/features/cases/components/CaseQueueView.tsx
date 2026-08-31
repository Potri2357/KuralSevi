'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CaseFilterBar } from './CaseFilterBar';
import { CaseQueueTable } from './CaseQueueTable';
import { useCases } from '../hooks/useCases';
import {
  CheckCircle2,
  X,
  Clock,
  AlertTriangle,
  Star,
  Layers,
  Download,
  UserPlus,
} from 'lucide-react';
import { IndicScroll, IndicCertificate } from '@/components/icons/indic';
import { getSlaStatus } from '@/lib/utils';
import type { CaseListItem, FilterStatus } from '../types';

interface Props {
  initialCases: CaseListItem[];
}

interface PipelineStage {
  id: FilterStatus;
  label: string;
  count: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBorder: string;
  activeBg: string;
  badgeBg: string;
}

export function CaseQueueView({ initialCases }: Props) {
  const {
    cases,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    district,
    setDistrict,
    pendingCount,
  } = useCases(initialCases);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Compute pipeline stage counts
  const totalCount = initialCases.length;
  const breachedCount = useMemo(
    () => initialCases.filter((c) => getSlaStatus(c.sla_deadline) === 'breached').length,
    [initialCases]
  );
  const specialistCount = useMemo(
    () => initialCases.filter((c) => c.consultant_required).length,
    [initialCases]
  );
  const actionedCount = useMemo(
    () => initialCases.filter((c) => c.officer_action === 'approved').length,
    [initialCases]
  );

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set(initialCases.map((c) => c.district));
    return Array.from(set).sort();
  }, [initialCases]);

  const PIPELINE_STAGES: PipelineStage[] = [
    {
      id: 'all',
      label: 'All Active Docket',
      count: totalCount,
      description: 'Complete caseload pool',
      icon: Layers,
      accentColor: 'text-[#0B3064]',
      activeBorder: 'border-[#0B3064]',
      activeBg: 'bg-[#EAF1FB]/60',
      badgeBg: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
    },
    {
      id: 'pending',
      label: 'Awaiting Officer Review',
      count: pendingCount,
      description: 'Requires NSQF sanction',
      icon: Clock,
      accentColor: 'text-[#C24810]',
      activeBorder: 'border-[#E05A1B]',
      activeBg: 'bg-[#FFF4ED]/60',
      badgeBg: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',
    },
    {
      id: 'sla_breached',
      label: 'SLA Escalations',
      count: breachedCount,
      description: 'Overdue adjudication SLA',
      icon: AlertTriangle,
      accentColor: 'text-rose-600',
      activeBorder: 'border-rose-500',
      activeBg: 'bg-rose-50/60',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'specialist',
      label: 'Specialist Referrals',
      count: specialistCount,
      description: 'SHG & credit linkages',
      icon: Star,
      accentColor: 'text-[#0B3064]',
      activeBorder: 'border-[#0B3064]',
      activeBg: 'bg-[#EAF1FB]/60',
      badgeBg: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
    },
    {
      id: 'approved',
      label: 'Sanctioned & Disbursed',
      count: actionedCount,
      description: 'GIA sanction complete',
      icon: CheckCircle2,
      accentColor: 'text-[#0A783C]',
      activeBorder: 'border-[#0A783C]',
      activeBg: 'bg-[#EDF9F1]/60',
      badgeBg: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]',
    },
  ];

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === cases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cases.map((c) => c.id));
    }
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    setBatchSuccessMessage(
      `Official PM-AJAY GIA Sanction Orders issued for ${selectedIds.length} citizen docket(s).`
    );
    setSelectedIds([]);
    setTimeout(() => setBatchSuccessMessage(null), 5000);
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilter('all');
    setDistrict('all');
  };

  const isFiltered = search !== '' || filter !== 'all' || district !== 'all';

  return (
    <div className="space-y-5">
      {/* 1. Workstation Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064] shadow-2xs shrink-0">
            <IndicScroll className="w-6 h-6 text-[#0B3064]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3064] tracking-tight font-display">
              Case Review Docket & Triage Workstation
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 font-sans">
              Citizen voice intake profiling, NSQF verification, and official PM-AJAY GIA sanction orders
            </p>
          </div>
        </div>

        {/* Workstation Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/officer/beneficiary/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EAF1FB] hover:bg-[#DDE8F8] text-[#0B3064] border border-[#BACEEB] text-xs font-bold transition-all hover:shadow-2xs active:scale-[0.98]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assisted Intake</span>
          </Link>
          <Link
            href="/officer/export"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Docket</span>
          </Link>
        </div>
      </div>

      {/* 2. Interactive Workflow Pipeline Ribbon (Stages) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" role="tablist" aria-label="Triage pipeline stages">
          {PIPELINE_STAGES.map((stage) => {
            const isSelected = filter === stage.id;
            const Icon = stage.icon;

            return (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setFilter(stage.id)}
                className={`flex flex-col items-start p-3 rounded-xl transition-all duration-150 text-left cursor-pointer relative group border ${
                  isSelected
                    ? `${stage.activeBg} ${stage.activeBorder} shadow-2xs`
                    : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${stage.accentColor}`} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                      {stage.label}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-mono font-bold rounded-md border shadow-2xs ${stage.badgeBg}`}
                  >
                    {stage.count}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate w-full">
                  {stage.description}
                </p>

                {/* Active Indicator Line */}
                {isSelected && (
                  <span className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${stage.activeBorder.replace('border-', 'bg-')}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Batch Success Toast */}
      {batchSuccessMessage && (
        <div className="bg-[#EDF9F1] border border-[#BBE8CB] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-[#0A783C] shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
            <span className="font-bold">{batchSuccessMessage}</span>
          </div>
          <button
            onClick={() => setBatchSuccessMessage(null)}
            className="text-[#0A783C] hover:opacity-80 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Floating Sticky Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 bg-[#0B3064] text-white border border-[#144282] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 font-bold">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span>
              {selectedIds.length} citizen docket{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={handleBatchApprove}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0A783C] hover:bg-[#085C2E] text-white font-bold transition-colors shadow-xs cursor-pointer"
            >
              <IndicCertificate className="w-3.5 h-3.5" />
              <span>Issue Bulk Sanctions</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Workstation Filter Controls (Search, District Selector, Sort) */}
      <CaseFilterBar
        search={search}
        onSearchChange={setSearch}
        district={district}
        onDistrictChange={setDistrict}
        districts={districts}
        sort={sort}
        onSortChange={setSort}
        totalResults={cases.length}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />

      {/* 6. Adjudication Docket Table */}
      <CaseQueueTable
        cases={cases}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
