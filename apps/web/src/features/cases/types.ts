import type { ConfidenceLabel, PathwayType } from '@kural-sevi/shared';

export type FilterStatus = 'all' | 'pending' | 'needs_review' | 'sla_breached' | 'approved';
export type SortOption = 'sla' | 'confidence' | 'date';

export interface CaseListItem {
  id: string;
  case_id: string;
  district: string;
  state: string;
  confidence: ConfidenceLabel;
  officer_action: 'pending' | 'approved' | 'modified' | 'rejected';
  days_pending: number;
  top_trade: string;
  qp_code: string;
  nsqf_level: number;
  pathway_type: PathwayType;
  employment_pref: 'wage' | 'self' | 'either';
  has_mobility: boolean;
  sla_deadline: string;
  created_at: string;
  consultant_required: boolean;
}

export interface RecommendationDetail {
  rank: number;
  qp_code: string;
  qp_name: string;
  nsqf_level: number;
  pathway_type: PathwayType;
  matched_skills: string[];
  skills_to_acquire: string[];
  confidence: ConfidenceLabel;
  topsis_score: number;
  explanation: string;
  opportunity: {
    strength: 'high' | 'medium' | 'low';
    source: string;
    date: string;
    evidence: string;
  };
  income_range: string;
  travel_feasible: boolean;
  training_hours: number;
}

export interface CaseDetailData {
  case_id: string;
  district: string;
  state: string;
  language: string;
  gender: string;
  age_group: string;
  profile: {
    educational_background: string;
    family_occupation: string;
    current_livelihood: string;
    skills_and_interests: string;
    mobility_constraints: string;
    employment_preference: string;
    local_economic_context: string;
    completeness: number;
  };
  recommendations: RecommendationDetail[];
}
