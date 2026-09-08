// =============================================================================
// Kural Sevi — Call Records Types
// Structured telephony session data, live transcripts, and recommendation linkage.
// =============================================================================

export interface TranscriptTurn {
  user: string;
  assistant: string;
  timestamp?: string;
}

export interface CallRecommendationSummary {
  qp_code: string;
  qp_name: string;
  nsqf_level: number;
  pathway_type: 'self_employment' | 'wage_employment' | 'home_enterprise';
  confidence: 'high' | 'medium' | 'needs_officer_review';
  topsis_score: number;
  income_range?: string;
}

export interface CallRecordItem {
  session_id: string;
  case_id: string;
  phone: string;
  channel: string;
  language: string;
  status: string;
  citizen_confirmed: boolean;
  notification_status: string;
  completed_at: string;
  confirmed_fields: {
    educational_background?: string;
    family_occupation?: string;
    current_livelihood?: string;
    skills_and_interests?: string;
    mobility_constraints?: string;
    employment_preference?: string;
    local_economic_context?: string;
    [key: string]: string | undefined;
  };
  turns_count: number;
  transcript: TranscriptTurn[];
  confirmed_via?: string;
  confirmed_at?: string;
  top_recommendation?: CallRecommendationSummary;
  officer_action?: 'pending' | 'approved' | 'modified' | 'rejected';
}

export type CallFilterChannel = 'all' | 'ivr' | 'whatsapp';
export type CallFilterStatus = 'all' | 'confirmed' | 'pending';
