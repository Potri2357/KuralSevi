'use client';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FilterStatus, SortOption } from '../types';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  filter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const FILTER_BUTTONS: [FilterStatus, string][] = [
  ['all', 'All Cases'],
  ['pending', 'Pending Review'],
  ['needs_review', 'Low Confidence'],
  ['sla_breached', 'SLA Breached'],
  ['approved', 'Actioned'],
];

export function CaseFilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
}: Props) {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardContent className="py-3 px-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input with Linked Label */}
        <div className="relative flex-1 min-w-[220px]">
          <label htmlFor="case-search-input" className="sr-only">
            Search cases by ID, district, or recommended trade
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="case-search-input"
            name="case_search"
            type="search"
            placeholder="Search by Case ID, district (e.g. Namakkal), or trade (e.g. Tailor)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#0B3064] focus:border-[#0B3064] min-h-[44px] shadow-2xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter case status">
          {FILTER_BUTTONS.map(([val, label]) => {
            const isSelected = filter === val;
            return (
              <button
                key={val}
                type="button"
                id={`filter-${val}`}
                onClick={() => onFilterChange(val)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer min-h-[38px]',
                  isSelected
                    ? 'bg-[#0B3064] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs'
                )}
                aria-pressed={isSelected}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-cases-select" className="text-xs text-[var(--text-muted)] font-bold shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
            Sort:
          </label>
          <select
            id="sort-cases-select"
            name="case_sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3064] min-h-[38px] cursor-pointer shadow-2xs"
            aria-label="Sort cases order"
          >
            <option value="sla">SLA Deadline (Urgent First)</option>
            <option value="confidence">Confidence Score</option>
            <option value="date">Date Created (Newest First)</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
