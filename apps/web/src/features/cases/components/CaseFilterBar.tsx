'use client';
import { Card, CardContent } from '@/components/ui/Card';
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
  ['all', 'All'],
  ['pending', 'Pending'],
  ['needs_review', 'Needs Review'],
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
    <Card>
      <CardContent className="py-3 flex flex-wrap items-center gap-3">
        <input
          id="case-search"
          type="text"
          placeholder="Search cases, districts, trades..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1 min-w-48 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50"
        />
        <div className="flex gap-1">
          {FILTER_BUTTONS.map(([val, label]) => (
            <button
              key={val}
              id={`filter-${val}`}
              onClick={() => onFilterChange(val)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === val
                  ? 'bg-indigo-600 text-white'
                  : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/8'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          id="sort-cases"
          value={sort}
          onChange={e => onSortChange(e.target.value as SortOption)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none"
        >
          <option value="sla">Sort: SLA Deadline</option>
          <option value="confidence">Sort: Confidence</option>
          <option value="date">Sort: Date</option>
        </select>
      </CardContent>
    </Card>
  );
}
