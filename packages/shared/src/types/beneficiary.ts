// =============================================================================
// Kural Sevi — Beneficiary & Session Types
// =============================================================================

export type ChannelType = 'ivr' | 'whatsapp' | 'field_worker';
export type SessionState =
  | 'initiated'
  | 'consent_pending'
  | 'consent_captured'
  | 'field_collection'
  | 'confirmation'
  | 'completed'
  | 'abandoned'
  | 'dropped';

export type FieldStatus = 'extracted' | 'confirmed' | 'rejected' | 'unknown';
export type EmploymentPreference = 'wage' | 'self' | 'either';

export interface Beneficiary {
  id: string;
  case_id: string;
  phone_hash: string;
  district: string;
  state: string;
  gender?: string;
  age_group?: string;
  language_code: string;
  is_sc_verified: boolean;
  created_at: string;
  updated_at: string;
  erased_at?: string;
}

export interface ConsentRecord {
  id: string;
  beneficiary_id: string;
  session_id: string;
  channel: ChannelType;
  language_code: string;
  consent_text_hash: string;
  consent_audio_path?: string;
  consent_given: boolean;
  consent_timestamp: string;
  purpose: string;
  retention_period_days: number;
}

export interface Session {
  id: string;
  beneficiary_id?: string;
  channel: ChannelType;
  state: SessionState;
  language_code: string;
  phone_number_hash: string;
  session_token?: string;
  session_token_expires_at?: string;
  last_confirmed_field?: string;
  call_sid?: string;
  stt_confidence_avg?: number;
  transcript_path?: string;
  recording_path?: string;
  started_at: string;
  completed_at?: string;
  dropped_at?: string;
  resumed_count: number;
}

export interface SessionField {
  id: string;
  session_id: string;
  field_name: PS_Field;
  field_value?: string;
  raw_transcript_excerpt?: string;
  extraction_confidence?: number;
  status: FieldStatus;
  confirmed_at?: string;
  readback_text?: string;
}

// The 7 PS-mandated fields (FR-2)
export type PS_Field =
  | 'educational_background'
  | 'family_occupation'
  | 'current_livelihood'
  | 'skills_and_interests'
  | 'mobility_constraints'
  | 'employment_preference'
  | 'local_economic_context';

export const PS_FIELDS: PS_Field[] = [
  'educational_background',
  'family_occupation',
  'current_livelihood',
  'skills_and_interests',
  'mobility_constraints',
  'employment_preference',
  'local_economic_context',
];

export interface EducationalBackground {
  level: 'none' | 'primary' | 'upper_primary' | 'secondary' | 'higher_secondary' | 'graduate' | 'post_graduate';
  completed_years?: number;
  can_read: boolean;
  can_write: boolean;
  can_do_basic_math: boolean;
}

export interface FamilyOccupation {
  occupation: string;
  is_traditional: boolean;
  transferable_skills: string[];
  generations?: number;
}

export interface CurrentLivelihood {
  activity: string;
  is_primary: boolean;
  income_range?: string; // '0-5000', '5000-10000', etc.
  income_stability: 'stable' | 'seasonal' | 'irregular';
  has_work?: boolean;
}

export interface SkillsAndInterests {
  existing_skills: string[];
  informal_skills: string[];
  traditional_skills: string[];
  interests: string[];
  has_prior_training: boolean;
  prior_training_details?: string;
}

export interface MobilityConstraints {
  has_disability: boolean;
  disability_type?: string;
  travel_radius_km: number;
  has_caregiving_responsibility: boolean;
  caregiving_hours_per_day?: number;
  gender_safety_concerns: boolean;
  can_work_night_shift: boolean;
}

export interface LocalEconomicContext {
  nearby_markets: string[];
  district_industries: string[];
  has_local_training_centers: boolean;
  transportation_access: 'good' | 'limited' | 'poor';
}

export interface ConfirmedProfile {
  id: string;
  beneficiary_id: string;
  session_id: string;
  educational_background?: EducationalBackground;
  family_occupation?: FamilyOccupation;
  current_livelihood?: CurrentLivelihood;
  skills_and_interests?: SkillsAndInterests;
  mobility_constraints?: MobilityConstraints;
  employment_preference?: EmploymentPreference;
  local_economic_context?: LocalEconomicContext;
  profile_completeness: number;
  is_complete: boolean;
}
