// =============================================================================
// Kural Sevi — Officer Types
// =============================================================================

export type OfficerAction = 'approved' | 'modified' | 'rejected' | 'pending';
export type BeneficiaryDecision =
  | 'interested'
  | 'not_interested'
  | 'wants_to_discuss'
  | 'unable_to_participate'
  | 'pending';
export type ReferralStatus = 'not_required' | 'required_pending' | 'assigned' | 'completed';
export type CasePriority = 'high' | 'medium' | 'low';

export interface OfficerCase {
  id: string;
  beneficiary_id: string;
  profile_id: string;
  district: string;
  state: string;
  priority: CasePriority;
  officer_action: OfficerAction;
  beneficiary_decision: BeneficiaryDecision;
  modified_recommendation?: object;
  officer_notes?: string;
  assigned_officer_id?: string;
  actioned_at?: string;
  sla_deadline: string;
  sla_breached: boolean;
  consultant_referral_status: ReferralStatus;
  consultant_referral_notes?: string;
  is_high_confidence: boolean;
  created_at: string;
  updated_at: string;
}

// Enriched case view joining profile, beneficiary, recommendations
export interface EnrichedOfficerCase extends OfficerCase {
  beneficiary: {
    case_id: string;
    district: string;
    state: string;
    language_code: string;
    gender?: string;
    age_group?: string;
  };
  profile_summary: {
    employment_preference?: string;
    has_mobility_constraints: boolean;
    profile_completeness: number;
    top_skills: string[];
  };
  recommendations: Array<{
    rank: number;
    qp_code: string;
    qp_name: string;
    nsqf_level: number;
    confidence_label: string;
    explanation_text: string;
    topsis_score: number;
  }>;
  days_pending: number;
}

export interface PlanningAggregates {
  id: string;
  state: string;
  district: string;
  aggregation_date: string;
  period_start: string;
  period_end: string;
  total_beneficiaries: number;
  completed_profiles: number;
  pending_officer_review: number;
  sla_breached: number;
  top_requested_trades: Array<{ qp_code: string; trade_name: string; count: number }>;
  common_existing_occupations: Array<{ occupation: string; count: number }>;
  recurring_skill_gaps: Array<{ skill: string; count: number }>;
  mobility_barrier_count: number;
  self_employment_count: number;
  wage_employment_count: number;
  district_coverage: Record<string, number>;
  consultant_referral_pending: number;
  mid_interview_dropoff: number;
  computed_at: string;
}

export interface OfficerActionRequest {
  case_id: string;
  action: OfficerAction;
  beneficiary_decision: BeneficiaryDecision;
  modified_recommendation?: object;
  officer_notes?: string;
  trigger_consultant_referral?: boolean;
}
