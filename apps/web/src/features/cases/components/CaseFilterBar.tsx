'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, ArrowUpDown, MapPin, X, SlidersHorizontal } from 'lucide-react';
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
  return (
    <Card className="bg-white/95 border-slate-200 shadow-2xs">
      <CardContent className="py-2.5 px-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
              className="w-full bg-slate-50/70 hover:bg-white border border-slate-200 focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064] focus:border-[#0B3064] min-h-[40px] transition-colors shadow-2xs"
            />
          </div>

          {/* District Dropdown Selector */}
          <div className="flex items-center gap-1.5 min-w-[170px]">
            <label htmlFor="district-select" className="sr-only">
              Filter by district
            </label>
            <div className="relative w-full">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="district-select"
                name="district_select"
                value={district}
                onChange={(e) => onDistrictChange(e.target.value)}
                className="w-full bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3064] min-h-[40px] cursor-pointer shadow-2xs transition-colors appearance-none"
                aria-label="Filter by district"
              >
                <option value="all">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d} District
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sort & Active Results Indicator */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          {/* Result Count Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Showing <strong className="text-[#0B3064] font-bold">{totalResults}</strong> docket{totalResults === 1 ? '' : 's'}
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="sort-cases-select" className="sr-only">
              Sort docket cases
            </label>
            <div className="relative">
              <ArrowUpDown className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="sort-cases-select"
                name="case_sort"
                value={sort}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="bg-white border border-slate-200 rounded-xl pl-7 pr-6 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3064] min-h-[38px] cursor-pointer shadow-2xs appearance-none"
                aria-label="Sort docket cases order"
              >
                <option value="sla">Urgent SLA First</option>
                <option value="confidence">Confidence Score</option>
                <option value="date">Newest Intake First</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button when filtered */}
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-slate-500 hover:text-[#C24810] hover:bg-[#FFF4ED] rounded-lg transition-colors border border-transparent hover:border-[#FDD8C2]"
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
