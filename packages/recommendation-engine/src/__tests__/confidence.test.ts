import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeConfidence } from '../confidence';

describe('Confidence Label Computation (FR-8)', () => {
  it('returns high for complete, high-quality profile', () => {
    const result = computeConfidence({
      profile_completeness: 0.95,
      stt_confidence_avg: 0.90,
      extraction_certainty: 0.88,
      local_data_available: true,
      hard_filter_passed: true,
      missing_fields: [],
    });
    assert.equal(result, 'high');
  });

  it('returns needs_officer_review when critical fields are missing', () => {
    const result = computeConfidence({
      profile_completeness: 0.80,
      stt_confidence_avg: 0.85,
      extraction_certainty: 0.80,
      local_data_available: true,
      hard_filter_passed: true,
      missing_fields: ['skills_and_interests'],
    });
    assert.equal(result, 'needs_officer_review');
  });

  it('returns needs_officer_review for very low STT confidence', () => {
    const result = computeConfidence({
      profile_completeness: 0.90,
      stt_confidence_avg: 0.35,
      extraction_certainty: 0.70,
      local_data_available: true,
      hard_filter_passed: true,
      missing_fields: [],
    });
    assert.equal(result, 'needs_officer_review');
  });

  it('returns medium for moderate profile quality', () => {
    const result = computeConfidence({
      profile_completeness: 0.75,
      stt_confidence_avg: 0.72,
      extraction_certainty: 0.70,
      local_data_available: false,
      hard_filter_passed: true,
      missing_fields: [],
    });
    assert.equal(result, 'medium');
  });

  it('returns needs_officer_review when hard_filter_passed is false', () => {
    const result = computeConfidence({
      profile_completeness: 0.99,
      stt_confidence_avg: 0.99,
      extraction_certainty: 0.99,
      local_data_available: true,
      hard_filter_passed: false,
      missing_fields: [],
    });
    assert.equal(result, 'needs_officer_review');
  });
});
