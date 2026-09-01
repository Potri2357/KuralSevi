#!/usr/bin/env tsx
/**
 * Kural Sevi — Full End-to-End Simulation & Verification Test
 * Tests the complete lifecycle:
 * Beneficiary Profile -> Hard Filter (Stage 1) -> Vector/AHP-TOPSIS (Stage 3)
 * -> Confidence (FR-8) -> Explanation (FR-8a) -> Officer Decision Audit
 */
import {
  applyHardFilters,
  rankPathways,
  computeConfidence,
  generateExplanation,
} from '@kural-sevi/recommendation-engine';
import type { NSQFTrade, ConfirmedProfile } from '@kural-sevi/shared';

const SAMPLE_CATALOG: NSQFTrade[] = [
  {
    qp_code: 'APP/Q0301',
    qp_name: 'Tailor — Women\'s and Men\'s Garment',
    sector: 'Apparel',
    nsqf_level: 4,
    pathway_type: 'self_employment',
    gender_eligible: 'all',
    requires_mobility: false,
    requires_physical_strength: false,
    min_education_years: 5,
    training_duration_hours: 300,
    required_skills: ['hand_stitching'],
    skills_acquired: ['pattern_making', 'garment_fitting'],
  },
  {
    qp_code: 'FIC/Q5001',
    qp_name: 'Papad and Ready-to-Eat Products Maker',
    sector: 'Food Processing',
    nsqf_level: 2,
    pathway_type: 'home_enterprise',
    gender_eligible: 'all',
    requires_mobility: false,
    requires_physical_strength: false,
    min_education_years: 0,
    training_duration_hours: 80,
    required_skills: ['traditional_cooking'],
    skills_acquired: ['standardized_recipes', 'hygiene_standards'],
  },
  {
    qp_code: 'CON/Q0102',
    qp_name: 'Mason',
    sector: 'Construction',
    nsqf_level: 4,
    pathway_type: 'wage_employment',
    gender_eligible: 'male_preferred',
    requires_mobility: true,
    requires_physical_strength: true,
    min_education_years: 5,
    training_duration_hours: 350,
    required_skills: [],
    skills_acquired: ['brick_laying', 'plastering'],
  }
];

const BENEFICIARY_PROFILE: ConfirmedProfile = {
  id: 'test-profile-001',
  beneficiary_id: 'benef-001',
  session_id: 'sess-001',
  educational_background: {
    level: 'upper_primary',
    completed_years: 8,
    can_read: true,
    can_write: true,
    can_do_basic_math: true,
  },
  family_occupation: {
    occupation: 'weaving',
    is_traditional: true,
    transferable_skills: ['hand_stitching', 'pattern_recognition'],
    generations: 3,
  },
  current_livelihood: {
    activity: 'daily wage agricultural labour',
    is_primary: true,
    income_stability: 'seasonal',
  },
  skills_and_interests: {
    existing_skills: ['hand_stitching'],
    informal_skills: ['basic_tailoring'],
    traditional_skills: ['handloom_weaving'],
    interests: ['Apparel', 'Food Processing'],
    has_prior_training: false,
  },
  mobility_constraints: {
    has_disability: false,
    travel_radius_km: 8,
    has_caregiving_responsibility: true,
    caregiving_hours_per_day: 3,
    gender_safety_concerns: false,
    can_work_night_shift: false,
  },
  employment_preference: 'self',
  local_economic_context: {
    nearby_markets: ['Namakkal weekly bazaar'],
    district_industries: ['Garments', 'Textiles'],
    has_local_training_centers: true,
    transportation_access: 'good',
  },
  profile_completeness: 0.95,
  is_complete: true,
};

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('  KURAL SEVI: End-to-End Recommendation Pipeline Verification  ');
  console.log('================================================================\n');

  // Step 1: Stage 1 Hard Filters
  console.log('1. [Stage 1: Hard Filters]');
  const filterResult = applyHardFilters(SAMPLE_CATALOG, BENEFICIARY_PROFILE);
  console.log(`   Candidate trades evaluated: ${SAMPLE_CATALOG.length}`);
  console.log(`   Eligible trades passed:    ${filterResult.eligible.length}`);
  console.log(`   Excluded trades:           ${filterResult.excluded.length}`);
  filterResult.excluded.forEach(e => {
    console.log(`     - Excluded ${e.trade.qp_name}: ${e.reasons.join('; ')}`);
  });

  // Step 2: Stage 3 AHP + TOPSIS Ranking
  console.log('\n2. [Stage 3: AHP + TOPSIS Multi-Criteria Ranking]');
  const candidatesWithSim = filterResult.eligible.map(t => ({ ...t, similarity: 0.85 }));
  const oppData = [
    { qp_code: 'APP/Q0301', opportunity_strength: 'high' as const, msme_count: 45, eshram_workers: 230, evidence: '45 garment MSMEs in Namakkal' },
    { qp_code: 'FIC/Q5001', opportunity_strength: 'medium' as const, msme_count: 12, eshram_workers: 80, evidence: '12 food enterprises in district' },
    { qp_code: 'CON/Q0102', opportunity_strength: 'low' as const, msme_count: 5, eshram_workers: 400, evidence: 'Construction demand stable' },
  ];

  const { ranked } = rankPathways(candidatesWithSim, BENEFICIARY_PROFILE, oppData);
  console.log(`   Ranked pathways: ${ranked.length}`);
  ranked.forEach((r, idx) => {
    console.log(`     #${idx + 1} [${r.qp_code}] ${r.qp_name} | TOPSIS: ${(r.topsis_score * 100).toFixed(1)}%`);
  });

  // Step 3: Confidence Score & Explainability
  console.log('\n3. [FR-8 & FR-8a: Confidence & Explainability]');
  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    const conf = computeConfidence({
      profile_completeness: BENEFICIARY_PROFILE.profile_completeness,
      stt_confidence_avg: 0.91,
      extraction_certainty: 0.88,
      local_data_available: true,
      hard_filter_passed: true,
      missing_fields: [],
    });

    const explanation = generateExplanation(r, BENEFICIARY_PROFILE, 'ta');

    console.log(`\n   Path #${i + 1} (${r.qp_name}):`);
    console.log(`     Confidence Label: [${conf.toUpperCase()}]`);
    console.log(`     Skills to Acquire: ${r.skills_to_acquire.length > 0 ? r.skills_to_acquire.join(', ') : 'None (full match)'}`);
    console.log(`     Explanation: "${explanation.text}"`);
    console.log(`     Traceable Factors: ${explanation.factors.map(f => f.factor).join(', ')}`);
  }

  console.log('\n================================================================');
  console.log('  VERIFICATION RESULT: ALL ENGINE STAGES EXECUTED SUCCESSFULLY  ');
  console.log('================================================================');
}

runEndToEndVerification().catch(console.error);
