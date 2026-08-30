// =============================================================================
// Kural Sevi — Recommendation & NSQF Types
// =============================================================================

export type ConfidenceLabel = 'high' | 'medium' | 'needs_officer_review';
export type PathwayType = 'wage_employment' | 'self_employment' | 'home_enterprise';

export interface NSQFTrade {
  qp_code: string;
  qp_name: string;
  sector: string;
  nsqf_level: number;
  pathway_type: PathwayType;
  gender_eligible: 'all' | 'female_preferred' | 'male_preferred';
  requires_mobility: boolean;
  requires_physical_strength: boolean;
  min_education_years: number;
  typical_income_min?: number;
  typical_income_max?: number;
  training_duration_hours?: number;
  description?: string;
  required_skills: string[];
  skills_acquired: string[];
}

export interface LocalOpportunitySignal {
  exists: boolean;
  strength: 'high' | 'medium' | 'low' | 'unknown';
  source: string;
  source_date: string; // ISO date
  evidence: string; // e.g., "45 MSMEs in textile sector in Namakkal district"
}

export interface ConfidenceInputs {
  profile_completeness: number;          // 0–1
  stt_confidence_avg: number;            // 0–1
  extraction_certainty: number;          // 0–1, LLM extraction confidence
  local_data_available: boolean;
  hard_filter_passed: boolean;
  missing_fields: string[];
}

export interface AHPScores {
  existing_skill_match: number;          // 0–1
  skill_gap_size: number;                // 0–1 (inverted: smaller gap = higher score)
  beneficiary_interest: number;          // 0–1
  local_demand: number;                  // 0–1
  income_potential: number;              // 0–1
  travel_feasibility: number;            // 0–1
  dropout_risk: number;                  // 0–1 (inverted: lower risk = higher score)
}

export interface ExplanationFactor {
  factor: string;
  value: string;
  contribution: 'positive' | 'negative' | 'neutral';
}

export interface PathwayRecommendation {
  id: string;
  profile_id: string;
  beneficiary_id: string;
  rank: 1 | 2 | 3;

  // FR-7 mandatory pathway fields
  qp_code: string;
  qp_name: string;
  nsqf_level: number;
  pathway_type: PathwayType;
  matched_skills: string[];              // Beneficiary's existing skills that match
  skills_to_acquire: string[];           // Skill gap (FR-8c)
  travel_feasibility: boolean;           // FR-8d constraint-aware
  local_opportunity_signal: LocalOpportunitySignal;

  // FR-8 confidence + FR-8a explanation
  confidence_label: ConfidenceLabel;
  confidence_inputs: ConfidenceInputs;
  explanation_text: string;             // Plain-language explanation
  explanation_factors: ExplanationFactor[];

  // Scoring internals (FR-8a traceable)
  ahp_scores: AHPScores;
  topsis_score: number;                 // Final TOPSIS relative closeness 0–1

  // FR-8b freshness
  local_data_source: string;
  local_data_last_updated: string;      // ISO date

  // FR-8d constraint log
  constraint_flags: {
    mobility_checked: boolean;
    disability_checked: boolean;
    gender_safety_checked: boolean;
    travel_checked: boolean;
  };

  created_at: string;
}

export interface RecommendationSet {
  profile_id: string;
  beneficiary_id: string;
  pathways: PathwayRecommendation[];
  generated_at: string;
  pipeline_version: string;
}

// AHP weight matrix for the 7 criteria (Section 9 of PRD)
// Weights are derived from pairwise comparison; can be tuned with Tier-2 outcome data
export const AHP_WEIGHTS: AHPScores = {
  existing_skill_match: 0.25,
  skill_gap_size: 0.20,
  beneficiary_interest: 0.18,
  local_demand: 0.15,
  income_potential: 0.10,
  travel_feasibility: 0.08,
  dropout_risk: 0.04,
};
