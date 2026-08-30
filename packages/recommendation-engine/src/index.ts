// =============================================================================
// Kural Sevi — Recommendation Engine
// Main entry point: runs all 3 stages and returns top-3 pathway recommendations.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ConfirmedProfile,
  PathwayRecommendation,
  RecommendationSet,
  ConfidenceInputs,
  NSQFTrade,
} from '@kural-sevi/shared';
import { applyHardFilters } from './stage1-hard-filter';
import { findSimilarTrades } from './stage2-pgvector-search';
import { rankPathways } from './stage3-ahp-topsis';
import { computeConfidence } from './confidence';
import { generateExplanation } from './explanation';
import type { IVectorSearchPort, IOpportunityDataPort } from './ports';
import { PgvectorSearchAdapter, CachedOpportunityDataAdapter } from './adapters';

const PIPELINE_VERSION = '1.0.0';
const TOP_N = 3;

export interface RunEngineOptions {
  profile: ConfirmedProfile;
  supabase?: SupabaseClient;
  geminiApiKey?: string;
  sttConfidenceAvg: number;
  extractionCertainty: number;
  catalogOverride?: NSQFTrade[];
  vectorSearchPort?: IVectorSearchPort;
  opportunityPort?: IOpportunityDataPort;
}

/**
 * Runs the full 3-stage recommendation pipeline.
 * Clean Architecture: allows injecting custom IVectorSearchPort and IOpportunityDataPort,
 * completely decoupling ranking logic from database or cloud API providers.
 */
export async function runRecommendationEngine(
  options: RunEngineOptions
): Promise<RecommendationSet> {
  const {
    profile,
    supabase,
    geminiApiKey,
    sttConfidenceAvg,
    extractionCertainty,
    catalogOverride,
    vectorSearchPort,
    opportunityPort,
  } = options;

  // ── STAGE 1: Fetch active trades from catalog and apply hard filters ──
  let allTrades: NSQFTrade[] = catalogOverride ?? [];
  if (!catalogOverride && supabase) {
    const { data, error: catalogError } = await supabase
      .from('nsqf_catalog')
      .select('*')
      .eq('is_active', true);

    if (catalogError) throw new Error(`NSQF catalog fetch failed: ${catalogError.message}`);
    allTrades = (data as NSQFTrade[]) ?? [];
  }

  const stage1Result = applyHardFilters(allTrades, profile);
  const eligibleQpCodes = stage1Result.eligible.map(t => t.qp_code);

  if (eligibleQpCodes.length === 0) {
    return {
      profile_id: profile.id,
      beneficiary_id: profile.beneficiary_id,
      pathways: [],
      generated_at: new Date().toISOString(),
      pipeline_version: PIPELINE_VERSION,
    };
  }

  // ── STAGE 2: Vector similarity search (via injected port or PgvectorSearchAdapter) ──
  const searchPort: IVectorSearchPort =
    vectorSearchPort ??
    (supabase && geminiApiKey
      ? new PgvectorSearchAdapter(supabase, geminiApiKey)
      : {
          findSimilarTrades: async () =>
            stage1Result.eligible.slice(0, 15).map(t => ({ ...t, similarity: 0.85 })),
        });

  let similarTrades = await searchPort.findSimilarTrades(profile, eligibleQpCodes, 15);

  if (similarTrades.length === 0) {
    similarTrades = stage1Result.eligible.slice(0, 15).map(t => ({ ...t, similarity: 0.5 }));
  }

  // ── Fetch district opportunity data (via injected port or CachedOpportunityDataAdapter) ──
  const oppPort: IOpportunityDataPort =
    opportunityPort ??
    (supabase
      ? new CachedOpportunityDataAdapter(supabase)
      : {
          getOpportunityData: async () => [],
        });

  const district = (profile.local_economic_context as any)?.district || 'Namakkal';
  const state = (profile.local_economic_context as any)?.state || 'Tamil Nadu';
  const districtOpportunities = await oppPort.getOpportunityData(
    district,
    state,
    similarTrades.map(t => t.qp_code)
  );

  // ── STAGE 3: AHP + TOPSIS ranking ──
  const { ranked } = rankPathways(similarTrades, profile, districtOpportunities);

  // Take top N
  const top3 = ranked.slice(0, TOP_N);

  // ── Build missing fields list for confidence ──
  const missingFields: string[] = [];
  if (!profile.educational_background) missingFields.push('educational_background');
  if (!profile.family_occupation) missingFields.push('family_occupation');
  if (!profile.current_livelihood) missingFields.push('current_livelihood');
  if (!profile.skills_and_interests) missingFields.push('skills_and_interests');
  if (!profile.mobility_constraints) missingFields.push('mobility_constraints');
  if (!profile.employment_preference) missingFields.push('employment_preference');
  if (!profile.local_economic_context) missingFields.push('local_economic_context');

  // ── Build pathway recommendations ──
  const pathways: PathwayRecommendation[] = top3.map((trade, idx) => {
    const localDataAvailable = !!trade.opportunity_data;

    const confidenceInputs: ConfidenceInputs = {
      profile_completeness: profile.profile_completeness,
      stt_confidence_avg: sttConfidenceAvg,
      extraction_certainty: extractionCertainty,
      local_data_available: localDataAvailable,
      hard_filter_passed: stage1Result.eligible.some(e => e.qp_code === trade.qp_code),
      missing_fields: missingFields,
    };

    const confidence_label = computeConfidence(confidenceInputs);
    const { text: explanation_text, factors: explanation_factors } = generateExplanation(
      trade,
      profile
    );

    return {
      id: crypto.randomUUID(),
      profile_id: profile.id,
      beneficiary_id: profile.beneficiary_id,
      rank: (idx + 1) as 1 | 2 | 3,
      qp_code: trade.qp_code,
      qp_name: trade.qp_name,
      nsqf_level: trade.nsqf_level,
      pathway_type: trade.pathway_type,
      matched_skills: trade.matched_skills,
      skills_to_acquire: trade.skills_to_acquire,
      travel_feasibility: trade.travel_feasible,
      local_opportunity_signal: {
        exists: localDataAvailable,
        strength: trade.opportunity_data?.opportunity_strength ?? 'unknown',
        source: trade.opportunity_data?.source ?? 'District Livelihood Dataset',
        source_date: trade.opportunity_data?.source_date ?? new Date().toISOString().slice(0, 10),
        evidence: trade.opportunity_data?.evidence ?? 'No local data available for this period',
      },
      confidence_label,
      confidence_inputs: confidenceInputs,
      explanation_text,
      explanation_factors,
      ahp_scores: trade.ahp_scores,
      topsis_score: trade.topsis_score,
      hard_filter_passed: true,
      constraint_flags: stage1Result.constraint_flags,
      local_data_source: trade.opportunity_data?.source ?? 'N/A',
      local_data_last_updated: trade.opportunity_data?.source_date ?? new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    };
  });

  return {
    profile_id: profile.id,
    beneficiary_id: profile.beneficiary_id,
    pathways,
    generated_at: new Date().toISOString(),
    pipeline_version: PIPELINE_VERSION,
  };
}

// Re-export individual stages for testing
export { applyHardFilters } from './stage1-hard-filter';
export { findSimilarTrades, generateEmbedding, buildSkillsText } from './stage2-pgvector-search';
export { rankPathways } from './stage3-ahp-topsis';
export { computeConfidence } from './confidence';
export { generateExplanation } from './explanation';
export * from './ports';
export * from './adapters';
