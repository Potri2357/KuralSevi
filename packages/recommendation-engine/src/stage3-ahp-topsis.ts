// =============================================================================
// Stage 3: AHP + TOPSIS Ranking
// Produces the final explainable, auditable pathway ranking (Section 9, Stage 3).
// Seven criteria with AHP-derived weights; TOPSIS for final ordering.
// All intermediate values are preserved for FR-8a explanation generation.
// =============================================================================

import type { ConfirmedProfile, AHPScores, NSQFTrade } from '@kural-sevi/shared';
import { AHP_WEIGHTS } from '@kural-sevi/shared';
import type { SimilarTrade } from './stage2-pgvector-search';
export type { SimilarTrade };

export interface DistrictOpportunityData {
  qp_code: string;
  opportunity_strength: 'high' | 'medium' | 'low' | 'unknown';
  msme_count?: number;
  eshram_workers?: number;
  evidence?: string;
  source?: string;
  source_date?: string;
}

export interface ScoredTrade extends NSQFTrade {
  similarity: number;
  ahp_scores: AHPScores;
  topsis_score: number;
  matched_skills: string[];
  skills_to_acquire: string[];
  travel_feasible: boolean;
  opportunity_data?: DistrictOpportunityData;
}

// =============================================================================
// AHP Criterion Scoring Functions
// Each returns 0–1. Higher is always better.
// =============================================================================

function scoreExistingSkillMatch(
  trade: NSQFTrade,
  profile: ConfirmedProfile
): { score: number; matched: string[]; unmatched: string[] } {
  const allBeneficiarySkills = [
    ...(profile.skills_and_interests?.existing_skills ?? []),
    ...(profile.skills_and_interests?.informal_skills ?? []),
    ...(profile.skills_and_interests?.traditional_skills ?? []),
    ...(profile.family_occupation?.transferable_skills ?? []),
  ].map(s => s.toLowerCase());

  const required = trade.required_skills.map(s => s.toLowerCase());
  if (required.length === 0) return { score: 0.5, matched: [], unmatched: [] };

  // Fuzzy match: check for substring overlap
  const matched = required.filter(req =>
    allBeneficiarySkills.some(bs => bs.includes(req) || req.includes(bs))
  );
  const score = matched.length / required.length;

  return {
    score,
    matched: matched,
    unmatched: required.filter(r => !matched.includes(r)),
  };
}

function scoreSkillGapSize(trade: NSQFTrade, profile: ConfirmedProfile): number {
  const required = trade.required_skills.length;
  const allSkills = [
    ...(profile.skills_and_interests?.existing_skills ?? []),
    ...(profile.skills_and_interests?.informal_skills ?? []),
    ...(profile.skills_and_interests?.traditional_skills ?? []),
  ].map(s => s.toLowerCase());

  const matched = trade.required_skills.filter(req =>
    allSkills.some(bs => bs.includes(req.toLowerCase()) || req.toLowerCase().includes(bs))
  ).length;

  const gap = required - matched;
  // Invert: smaller gap = higher score
  return required === 0 ? 1.0 : 1 - (gap / Math.max(required, 1));
}

function scoreBeneficiaryInterest(trade: NSQFTrade, profile: ConfirmedProfile): number {
  if (!profile.skills_and_interests?.interests) return 0.3;

  const interests = profile.skills_and_interests.interests.map(i => i.toLowerCase());
  const tradeName = trade.qp_name.toLowerCase();
  const tradeSector = trade.sector.toLowerCase();

  const hasInterest = interests.some(
    i => tradeName.includes(i) || tradeSector.includes(i) || i.includes(tradeSector)
  );

  // Employment preference alignment
  let preferenceScore = 0.5;
  if (profile.employment_preference === 'wage' && trade.pathway_type === 'wage_employment') {
    preferenceScore = 1.0;
  } else if (
    profile.employment_preference === 'self' &&
    (trade.pathway_type === 'self_employment' || trade.pathway_type === 'home_enterprise')
  ) {
    preferenceScore = 1.0;
  } else if (profile.employment_preference === 'either') {
    preferenceScore = 0.8;
  }

  return (hasInterest ? 0.8 : 0.3) * 0.4 + preferenceScore * 0.6;
}

function scoreLocalDemand(
  trade: NSQFTrade,
  opportunityData?: DistrictOpportunityData
): number {
  if (!opportunityData) return 0.3;
  return { high: 1.0, medium: 0.65, low: 0.3, unknown: 0.2 }[opportunityData.opportunity_strength];
}

function scoreIncomePotential(trade: NSQFTrade): number {
  const max = trade.typical_income_max ?? 0;
  // Normalize against 50,000 INR/month as aspirational max
  return Math.min(max / 50000, 1.0);
}

function scoreTravelFeasibility(trade: NSQFTrade, profile: ConfirmedProfile): {
  score: number;
  feasible: boolean;
} {
  if (!profile.mobility_constraints) return { score: 0.8, feasible: true };
  const { travel_radius_km, has_caregiving_responsibility } = profile.mobility_constraints;

  if (!trade.requires_mobility) {
    return { score: 1.0, feasible: true };
  }
  // Mobile trades: score by travel radius
  if (travel_radius_km >= 20) return { score: 0.9, feasible: true };
  if (travel_radius_km >= 10) return { score: 0.7, feasible: true };
  if (travel_radius_km >= 5) return { score: 0.4, feasible: true };
  return { score: 0.1, feasible: false };
}

function scoreDropoutRisk(trade: NSQFTrade, profile: ConfirmedProfile): number {
  // Lower dropout risk → higher score (inverted risk)
  let riskScore = 0.5;

  if (profile.skills_and_interests?.has_prior_training) riskScore -= 0.15;
  if (profile.mobility_constraints?.has_caregiving_responsibility) riskScore += 0.2;
  if ((trade.training_duration_hours ?? 0) > 300) riskScore += 0.1;
  if (profile.employment_preference !== 'either') riskScore -= 0.1; // Clear preference = lower dropout

  const clampedRisk = Math.min(Math.max(riskScore, 0), 1);
  return 1 - clampedRisk; // Invert: lower risk = higher score
}

// =============================================================================
// TOPSIS Implementation
// =============================================================================

function topsis(
  scores: Array<{ trade: SimilarTrade; weighted: AHPScores }>,
  weights: AHPScores
): Array<{ trade: SimilarTrade; topsis_score: number }> {
  if (scores.length === 0) return [];

  const criteria = Object.keys(weights) as (keyof AHPScores)[];

  // Find ideal and anti-ideal solutions
  const ideal: Record<keyof AHPScores, number> = {} as any;
  const antiIdeal: Record<keyof AHPScores, number> = {} as any;

  for (const c of criteria) {
    const vals = scores.map(s => s.weighted[c]);
    ideal[c] = Math.max(...vals);
    antiIdeal[c] = Math.min(...vals);
  }

  // Compute separation measures and relative closeness
  return scores.map(({ trade, weighted }) => {
    let distIdeal = 0;
    let distAntiIdeal = 0;

    for (const c of criteria) {
      distIdeal += Math.pow(weighted[c] - ideal[c], 2);
      distAntiIdeal += Math.pow(weighted[c] - antiIdeal[c], 2);
    }

    distIdeal = Math.sqrt(distIdeal);
    distAntiIdeal = Math.sqrt(distAntiIdeal);

    const topsis_score =
      distIdeal + distAntiIdeal === 0
        ? 0.5
        : distAntiIdeal / (distIdeal + distAntiIdeal);

    return { trade, topsis_score };
  });
}

// =============================================================================
// Main Stage 3 Entry Point
// =============================================================================

export interface RankedResult {
  ranked: ScoredTrade[];
}

export function rankPathways(
  candidates: SimilarTrade[],
  profile: ConfirmedProfile,
  opportunityData: DistrictOpportunityData[]
): RankedResult {
  const oppMap = new Map(opportunityData.map(o => [o.qp_code, o]));

  const scored = candidates.map(trade => {
    const opp = oppMap.get(trade.qp_code);
    const { score: skillScore, matched, unmatched } = scoreExistingSkillMatch(trade, profile);
    const gapScore = scoreSkillGapSize(trade, profile);
    const interestScore = scoreBeneficiaryInterest(trade, profile);
    const demandScore = scoreLocalDemand(trade, opp);
    const incomeScore = scoreIncomePotential(trade);
    const { score: travelScore, feasible } = scoreTravelFeasibility(trade, profile);
    const dropoutScore = scoreDropoutRisk(trade, profile);

    const rawScores: AHPScores = {
      existing_skill_match: skillScore,
      skill_gap_size: gapScore,
      beneficiary_interest: interestScore,
      local_demand: demandScore,
      income_potential: incomeScore,
      travel_feasibility: travelScore,
      dropout_risk: dropoutScore,
    };

    // Apply AHP weights
    const weighted: AHPScores = {
      existing_skill_match: rawScores.existing_skill_match * AHP_WEIGHTS.existing_skill_match,
      skill_gap_size: rawScores.skill_gap_size * AHP_WEIGHTS.skill_gap_size,
      beneficiary_interest: rawScores.beneficiary_interest * AHP_WEIGHTS.beneficiary_interest,
      local_demand: rawScores.local_demand * AHP_WEIGHTS.local_demand,
      income_potential: rawScores.income_potential * AHP_WEIGHTS.income_potential,
      travel_feasibility: rawScores.travel_feasibility * AHP_WEIGHTS.travel_feasibility,
      dropout_risk: rawScores.dropout_risk * AHP_WEIGHTS.dropout_risk,
    };

    return {
      trade,
      weighted,
      raw: rawScores,
      matched,
      unmatched,
      feasible,
      opp,
    };
  });

  // Apply TOPSIS
  const topsisResults = topsis(
    scored.map(s => ({ trade: s.trade as SimilarTrade, weighted: s.weighted })),
    AHP_WEIGHTS
  );

  // Sort by TOPSIS score descending
  const sorted = topsisResults.sort((a, b) => b.topsis_score - a.topsis_score);

  const ranked: ScoredTrade[] = sorted.map(({ trade, topsis_score }, idx) => {
    const s = scored.find(sc => sc.trade.qp_code === trade.qp_code)!;
    return {
      ...trade,
      ahp_scores: s.weighted,
      topsis_score,
      matched_skills: s.matched,
      skills_to_acquire: s.unmatched,
      travel_feasible: s.feasible,
      opportunity_data: s.opp,
    };
  });

  return { ranked };
}
