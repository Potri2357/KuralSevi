import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runRecommendationEngine } from '../index';
import { InMemoryVectorSearchAdapter, InMemoryOpportunityDataAdapter } from '../adapters';
import type { ConfirmedProfile, NSQFTrade } from '@kural-sevi/shared';

const MOCK_CATALOG: NSQFTrade[] = [
  {
    qp_code: 'APP/Q0301',
    qp_name: 'Tailor — Garments',
    sector: 'Apparel',
    nsqf_level: 4,
    pathway_type: 'self_employment',
    gender_eligible: 'all',
    requires_mobility: false,
    requires_physical_strength: false,
    min_education_years: 5,
    training_duration_hours: 300,
    required_skills: ['hand_stitching'],
    skills_acquired: ['pattern_making'],
  },
  {
    qp_code: 'FIC/Q5001',
    qp_name: 'Food Products Maker',
    sector: 'Food Processing',
    nsqf_level: 2,
    pathway_type: 'home_enterprise',
    gender_eligible: 'all',
    requires_mobility: false,
    requires_physical_strength: false,
    min_education_years: 0,
    training_duration_hours: 80,
    required_skills: ['traditional_cooking'],
    skills_acquired: ['packaging'],
  },
];

const TEST_PROFILE: ConfirmedProfile = {
  id: 'profile-test-port',
  beneficiary_id: 'benef-test-port',
  session_id: 'sess-test-port',
  educational_background: { level: 'upper_primary', completed_years: 8, can_read: true, can_write: true, can_do_basic_math: true },
  family_occupation: { occupation: 'weaving', is_traditional: true, transferable_skills: ['hand_stitching'], generations: 2 },
  current_livelihood: { activity: 'daily_wage', is_primary: true, income_stability: 'seasonal' },
  skills_and_interests: { existing_skills: ['hand_stitching'], informal_skills: [], traditional_skills: [], interests: ['tailoring'], has_prior_training: false },
  mobility_constraints: { has_disability: false, travel_radius_km: 10, has_caregiving_responsibility: false, gender_safety_concerns: false, can_work_night_shift: true },
  employment_preference: 'self',
  local_economic_context: { nearby_markets: ['Namakkal'], district_industries: ['garments'], has_local_training_centers: true, transportation_access: 'good' },
  profile_completeness: 0.95,
  is_complete: true,
};

describe('Hexagonal Architecture: Ports & Adapters Isolation', () => {
  it('runs complete recommendation engine with in-memory adapters and zero external I/O', async () => {
    const vectorSearchPort = new InMemoryVectorSearchAdapter(MOCK_CATALOG);
    const opportunityPort = new InMemoryOpportunityDataAdapter({
      'APP/Q0301': { opportunity_strength: 'high', msme_count: 50, evidence: '50 units in district' },
    });

    const result = await runRecommendationEngine({
      profile: TEST_PROFILE,
      catalogOverride: MOCK_CATALOG,
      vectorSearchPort,
      opportunityPort,
      sttConfidenceAvg: 0.92,
      extractionCertainty: 0.90,
    });

    assert.equal(result.profile_id, TEST_PROFILE.id);
    assert.ok(result.pathways.length > 0);
    assert.equal(result.pathways[0].qp_code, 'APP/Q0301');
    assert.equal(result.pathways[0].rank, 1);
    assert.equal(result.pathways[0].confidence_label, 'high');
  });
});
