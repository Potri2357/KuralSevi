'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, ArrowUpDown, MapPin, X, SlidersHorizontal } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import type { SortOption } from '../types';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  district: string;
  onDistrictChange: (district: string) => void;
  districts: string[];
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalResults: number;
  onClearFilters: () => void;
  isFiltered: boolean;
}

export function CaseFilterBar({
  search,
  onSearchChange,
  district,
  onDistrictChange,
  districts,
  sort,
  onSortChange,
  totalResults,
  onClearFilters,
  isFiltered,
}: Props) {
  const districtOptions = [
    { value: 'all', label: 'All Districts', icon: MapPin },
    ...districts.map((d) => ({ value: d, label: `${d} District`, icon: MapPin })),
  ];

  const sortOptions = [
    { value: 'sla', label: 'Urgent SLA First', icon: ArrowUpDown },
    { value: 'confidence', label: 'Confidence Score', icon: ArrowUpDown },
    { value: 'date', label: 'Newest Intake First', icon: ArrowUpDown },
  ];

  return (
    <Card styleVariant="neuro-glass">
      <CardContent className="py-3 px-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search & District filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <label htmlFor="case-search-input" className="sr-only">
              Search docket by ID, citizen name, district, or recommended trade
            </label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="case-search-input"
              name="case_search"
              type="search"
              placeholder="Search docket by ID (KS-...), district, or trade (e.g. Tailor)..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full neuro-inset focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064]/20 focus:border-[#0B3064] min-h-[40px] transition-all"
            />
          </div>

          {/* District Dropdown Selector */}
          <div className="w-full sm:w-[190px] shrink-0">
            <label htmlFor="district-select" className="sr-only">
              Filter by district
            </label>
            <CustomSelect
              id="district-select"
              value={district}
              onChange={onDistrictChange}
              options={districtOptions}
              buttonClassName="min-h-[40px] py-2 text-xs"
              aria-label="Filter by district"
            />
          </div>
        </div>

        {/* Right: Sort & Active Results Indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
          {/* Result Count Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2.5 py-1 rounded-full glass-pill">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Showing <strong className="text-[#0B3064] font-bold">{totalResults}</strong> docket{totalResults === 1 ? '' : 's'}
            </span>
          </div>

          {/* Sort Selector */}
          <div className="w-full sm:w-[180px] shrink-0">
            <label htmlFor="sort-cases-select" className="sr-only">
              Sort docket cases
            </label>
            <CustomSelect
              id="sort-cases-select"
              value={sort}
              onChange={(val) => onSortChange(val as SortOption)}
              options={sortOptions}
              buttonClassName="min-h-[40px] py-2 text-xs"
              aria-label="Sort docket cases order"
            />
          </div>

          {/* Reset button when filtered */}
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-[#C24810] glass-saffron rounded-xl transition-all cursor-pointer"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
