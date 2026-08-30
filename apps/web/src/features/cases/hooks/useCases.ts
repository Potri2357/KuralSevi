'use client';
import { useState, useMemo } from 'react';
import type { CaseListItem, FilterStatus, SortOption } from '../types';
import { getSlaStatus } from '@/lib/utils';

export function useCases(initialCases: CaseListItem[]) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortOption>('sla');
  const [search, setSearch] = useState('');

  const filteredCases = useMemo(() => {
    return initialCases.filter(c => {
      if (search) {
        const query = search.toLowerCase();
        const matchesId = c.case_id.toLowerCase().includes(query);
        const matchesDistrict = c.district.toLowerCase().includes(query);
        const matchesTrade = c.top_trade.toLowerCase().includes(query);
        if (!matchesId && !matchesDistrict && !matchesTrade) return false;
      }
      if (filter === 'pending') return c.officer_action === 'pending';
      if (filter === 'needs_review') return c.confidence === 'needs_officer_review';
      if (filter === 'sla_breached') return getSlaStatus(c.sla_deadline) === 'breached';
      if (filter === 'approved') return c.officer_action !== 'pending';
      return true;
    }).sort((a, b) => {
      if (sort === 'sla') {
        return new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime();
      }
      if (sort === 'confidence') {
        const order: Record<string, number> = { needs_officer_review: 0, medium: 1, high: 2 };
        return (order[a.confidence] ?? 0) - (order[b.confidence] ?? 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [initialCases, search, filter, sort]);

  const pendingCount = useMemo(() => {
    return initialCases.filter(c => c.officer_action === 'pending').length;
  }, [initialCases]);

  return {
    cases: filteredCases,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    pendingCount,
  };
}
