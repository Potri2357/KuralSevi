/**
 * Recommendation Engine Ports & Interfaces
 * Hexagonal / Clean Architecture Boundary:
 * Separates pure mathematical & rule-based ranking from data sources and network I/O.
 */
import type { ConfirmedProfile, NSQFTrade } from '@kural-sevi/shared';
import type { SimilarTrade, DistrictOpportunityData } from './stage3-ahp-topsis';

export interface IVectorSearchPort {
  findSimilarTrades(
    profile: ConfirmedProfile,
    eligibleQpCodes: string[],
    topK?: number
  ): Promise<SimilarTrade[]>;
}

export interface IOpportunityDataPort {
  getOpportunityData(
    district: string,
    state: string,
    qpCodes: string[]
  ): Promise<DistrictOpportunityData[]>;
}
