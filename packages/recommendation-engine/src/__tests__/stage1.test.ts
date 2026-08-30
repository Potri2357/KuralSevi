import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyHardFilters } from '../stage1-hard-filter';
import type { NSQFTrade, ConfirmedProfile } from '@kural-sevi/shared';

const TAILORING_TRADE: NSQFTrade = {
  qp_code: 'APP/Q0301', qp_name: 'Tailor', sector: 'Apparel', nsqf_level: 4,
  pathway_type: 'self_employment', gender_eligible: 'all',
  requires_mobility: false, requires_physical_strength: false,
  min_education_years: 5, required_skills: ['hand_stitching'], skills_acquired: ['pattern_making'],
};

const MASON_TRADE: NSQFTrade = {
  qp_code: 'CON/Q0102', qp_name: 'Mason', sector: 'Construction', nsqf_level: 4,
  pathway_type: 'wage_employment', gender_eligible: 'male_preferred',
  requires_mobility: true, requires_physical_strength: true,
  min_education_years: 5, required_skills: [], skills_acquired: [],
};

const BASE_PROFILE: ConfirmedProfile = {
  id: 'test-profile',
  beneficiary_id: 'test-beneficiary',
  session_id: 'test-session',
  profile_completeness: 0.9,
  is_complete: true,
};

describe('Stage 1: Hard Filters', () => {
  it('should pass tailoring for a beneficiary with adequate education', () => {
    const profile: ConfirmedProfile = {
      ...BASE_PROFILE,
      educational_background: { level: 'upper_primary', completed_years: 8, can_read: true, can_write: true, can_do_basic_math: true },
    };
    const result = applyHardFilters([TAILORING_TRADE], profile);
    assert.equal(result.eligible.length, 1);
    assert.equal(result.excluded.length, 0);
  });

  it('should exclude mason trade for a beneficiary with a disability', () => {
    const profile: ConfirmedProfile = {
      ...BASE_PROFILE,
      educational_background: { level: 'upper_primary', completed_years: 8, can_read: true, can_write: true, can_do_basic_math: true },
      mobility_constraints: { has_disability: true, travel_radius_km: 15, has_caregiving_responsibility: false, gender_safety_concerns: false, can_work_night_shift: true },
    };
    const result = applyHardFilters([MASON_TRADE], profile);
    assert.equal(result.excluded.length, 1);
    assert.ok(result.excluded[0].reasons[0].includes('physical strength'));
  });

  it('should exclude trades requiring mobility when travel radius is very low', () => {
    const profile: ConfirmedProfile = {
      ...BASE_PROFILE,
      mobility_constraints: { has_disability: false, travel_radius_km: 3, has_caregiving_responsibility: false, gender_safety_concerns: false, can_work_night_shift: true },
    };
    const result = applyHardFilters([MASON_TRADE], profile);
    assert.equal(result.eligible.length, 0);
    assert.equal(result.constraint_flags.travel_checked, true);
  });

  it('should set all constraint flags correctly', () => {
    const profile: ConfirmedProfile = {
      ...BASE_PROFILE,
      mobility_constraints: { has_disability: false, travel_radius_km: 20, has_caregiving_responsibility: false, gender_safety_concerns: false, can_work_night_shift: true },
    };
    const result = applyHardFilters([TAILORING_TRADE, MASON_TRADE], profile);
    assert.equal(result.constraint_flags.mobility_checked, true);
    assert.equal(result.constraint_flags.disability_checked, true);
    assert.equal(result.constraint_flags.gender_safety_checked, true);
    assert.equal(result.constraint_flags.nsqf_eligibility_checked, true);
  });
});
