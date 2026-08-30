/**
 * Recommendation Engine Adapters
 * Concrete implementations of the Ports:
 * - PgvectorSearchAdapter: Real pgvector in Supabase + Gemini text-embedding-004
 * - InMemoryVectorSearchAdapter: Offline mock/test adapter with zero external dependencies
 * - CachedOpportunityDataAdapter: Real district_data_cache in Supabase
 * - InMemoryOpportunityDataAdapter: Deterministic mock adapter for tests/simulation
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConfirmedProfile, NSQFTrade } from '@kural-sevi/shared';
import type { IVectorSearchPort, IOpportunityDataPort } from './ports';
import { findSimilarTrades, type SimilarTrade, buildSkillsText, generateEmbedding } from './stage2-pgvector-search';
import type { DistrictOpportunityData } from './stage3-ahp-topsis';

export class PgvectorSearchAdapter implements IVectorSearchPort {
  constructor(
    private supabase: SupabaseClient,
    private geminiApiKey: string
  ) {}

  async findSimilarTrades(
    profile: ConfirmedProfile,
    eligibleQpCodes: string[],
    topK: number = 15
  ): Promise<SimilarTrade[]> {
    return findSimilarTrades(profile, eligibleQpCodes, this.supabase, this.geminiApiKey, topK);
  }
}

export class InMemoryVectorSearchAdapter implements IVectorSearchPort {
  constructor(private catalog: NSQFTrade[]) {}

  async findSimilarTrades(
    profile: ConfirmedProfile,
    eligibleQpCodes: string[],
    topK: number = 15
  ): Promise<SimilarTrade[]> {
    const eligibleSet = new Set(eligibleQpCodes);
    const matched = this.catalog.filter(t => eligibleSet.has(t.qp_code));

    // Compute simple deterministic similarity based on word overlap for offline/testing
    const profileText = buildSkillsText(profile).toLowerCase();
    return matched
      .map(trade => {
        const tradeWords = `${trade.qp_name} ${trade.sector} ${trade.required_skills?.join(' ')}`.toLowerCase();
        const score = profileText.split(' ').some(w => w.length > 3 && tradeWords.includes(w)) ? 0.88 : 0.65;
        return { ...trade, similarity: score };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}

export class CachedOpportunityDataAdapter implements IOpportunityDataPort {
  constructor(private supabase: SupabaseClient) {}

  async getOpportunityData(
    district: string,
    state: string,
    qpCodes: string[]
  ): Promise<DistrictOpportunityData[]> {
    const { data: cacheRows } = await this.supabase
      .from('district_data_cache')
      .select('source, data_type, payload')
      .eq('district', district)
      .eq('is_latest', true);

    return qpCodes.map(qp => {
      const row = cacheRows?.find(r => r.payload?.trade_counts?.[qp]);
      const count = row?.payload?.trade_counts?.[qp] || 0;
      return {
        qp_code: qp,
        opportunity_strength: count > 20 ? 'high' : count > 5 ? 'medium' : 'low',
        msme_count: count,
        evidence: `${count} registered enterprises in ${district}`,
      };
    });
  }
}

export class InMemoryOpportunityDataAdapter implements IOpportunityDataPort {
  constructor(private mockData: Record<string, Partial<DistrictOpportunityData>> = {}) {}

  async getOpportunityData(
    district: string,
    state: string,
    qpCodes: string[]
  ): Promise<DistrictOpportunityData[]> {
    return qpCodes.map(qp => {
      const mock = this.mockData[qp] || {};
      return {
        qp_code: qp,
        opportunity_strength: mock.opportunity_strength || 'medium',
        msme_count: mock.msme_count || 15,
        evidence: mock.evidence || `Market active in ${district}`,
      };
    });
  }
}
