'use client';
import { Badge } from '@/components/ui/Badge';
import { CaseFilterBar } from './CaseFilterBar';
import { CaseQueueTable } from './CaseQueueTable';
import { useCases } from '../hooks/useCases';
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Case Queue</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Review and action beneficiary pathway recommendations (FR-9, FR-15)
          </p>
        </div>
        <Badge variant="amber">{pendingCount} Pending Review</Badge>
      </div>

      <CaseFilterBar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
      />

      <CaseQueueTable cases={cases} />
    </div>
  );
}
