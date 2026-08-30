'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CaseFilterBar } from './CaseFilterBar';
import { CaseQueueTable } from './CaseQueueTable';
import { useCases } from '../hooks/useCases';
import { CheckCircle2, X, Layers } from 'lucide-react';
import type { CaseListItem } from '../types';

interface Props {
  initialCases: CaseListItem[];
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
    pendingCount,
  } = useCases(initialCases);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

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
    setBatchSuccessMessage(`Successfully issued bulk sanction orders for ${selectedIds.length} selected cases.`);
    setSelectedIds([]);
    setTimeout(() => setBatchSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B3064] tracking-tight">
            Case Review Docket & Triage
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Review AI voice intake profiling and issue official NSQF-aligned sanction orders under PM-AJAY GIA
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="saffron" className="px-3 py-1 text-xs">
            {pendingCount} Awaiting Officer Review
          </Badge>
        </div>
      </div>

      {/* Batch Success Toast */}
      {batchSuccessMessage && (
        <div className="bg-[#EDF9F1] border border-[#BBE8CB] rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs text-[#0A783C] shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0" />
            <span className="font-bold">{batchSuccessMessage}</span>
          </div>
          <button
            onClick={() => setBatchSuccessMessage(null)}
            className="text-[#0A783C] hover:opacity-80 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#EAF1FB] border border-[#BACEEB] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-[#0B3064] font-bold">
            <Layers className="w-4 h-4 text-[#0B3064]" />
            <span>{selectedIds.length} case{selectedIds.length > 1 ? 's' : ''} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={handleBatchApprove}
              className="text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Batch Approve Selected ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedIds([])}
              className="text-xs"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <CaseFilterBar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Cases Table with Multi-select */}
      <CaseQueueTable
        cases={cases}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
