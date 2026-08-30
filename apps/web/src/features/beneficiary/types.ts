export interface BeneficiaryFormData {
  district: string;
  state: string;
  language: string;
  gender: string;
  age_group: string;
  channel_used: string;
  phone?: string;
}

export interface MandatedFieldsData {
  educational_background: string;
  family_occupation: string;
  current_livelihood: string;
  skills_and_interests: string;
  mobility_constraints: string;
  employment_preference: 'wage' | 'self' | 'either';
  local_economic_context: string;
}
