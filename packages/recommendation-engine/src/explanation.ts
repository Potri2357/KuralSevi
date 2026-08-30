// =============================================================================
// Explanation Generation (FR-8a)
// Generates plain-language explanations from STRUCTURED scoring factors.
// NEVER calls the LLM for this — must be traceable to the scoring record.
// =============================================================================

import type { AHPScores, ExplanationFactor, ConfirmedProfile } from '@kural-sevi/shared';
import type { ScoredTrade } from './stage3-ahp-topsis';

export interface ExplanationResult {
  text: string;
  factors: ExplanationFactor[];
}

export function generateExplanation(
  trade: ScoredTrade,
  profile: ConfirmedProfile,
  languageCode: string = 'en'
): ExplanationResult {
  const factors: ExplanationFactor[] = [];
  const reasons: string[] = [];

  // Factor 1: Existing skill match
  if (trade.matched_skills.length > 0) {
    factors.push({
      factor: 'existing_skill_match',
      value: trade.matched_skills.join(', '),
      contribution: 'positive',
    });
    reasons.push(`you already have ${trade.matched_skills.join(', ')} skills`);
  }

  // Factor 2: Employment preference alignment
  const pref = profile.employment_preference;
  const pathwayType = trade.pathway_type;
  const prefAligned =
    (pref === 'self' && (pathwayType === 'self_employment' || pathwayType === 'home_enterprise')) ||
    (pref === 'wage' && pathwayType === 'wage_employment') ||
    pref === 'either';

  if (prefAligned && pref !== 'either') {
    factors.push({
      factor: 'employment_preference',
      value: pref ?? 'either',
      contribution: 'positive',
    });
    reasons.push(`you prefer ${pref} employment`);
  }

  // Factor 3: Local demand
  if (trade.opportunity_data?.opportunity_strength === 'high') {
    factors.push({
      factor: 'local_demand',
      value: 'high',
      contribution: 'positive',
    });
    reasons.push(`there are strong ${trade.qp_name} opportunities in your district`);
  } else if (trade.opportunity_data?.opportunity_strength === 'medium') {
    factors.push({
      factor: 'local_demand',
      value: 'medium',
      contribution: 'neutral',
    });
    reasons.push(`there are some ${trade.qp_name} opportunities in your district`);
  } else {
    factors.push({
      factor: 'local_demand',
      value: trade.opportunity_data?.opportunity_strength ?? 'unknown',
      contribution: 'negative',
    });
  }

  // Factor 4: Travel feasibility
  if (!trade.travel_feasible) {
    factors.push({
      factor: 'travel_feasibility',
      value: 'constrained',
      contribution: 'negative',
    });
    reasons.push(`(note: travel may be a challenge given your mobility situation)`);
  }

  // Factor 5: Skill gap size
  if (trade.skills_to_acquire.length > 0) {
    factors.push({
      factor: 'skill_gap',
      value: trade.skills_to_acquire.join(', '),
      contribution: trade.skills_to_acquire.length <= 2 ? 'neutral' : 'negative',
    });
    if (trade.skills_to_acquire.length <= 2) {
      reasons.push(`you only need to learn ${trade.skills_to_acquire.join(' and ')}`);
    }
  }

  // Factor 6: Family/traditional background
  if (profile.family_occupation?.is_traditional) {
    const familyTrade = profile.family_occupation.occupation.toLowerCase();
    const matchesTrade = trade.qp_name.toLowerCase().includes(familyTrade) ||
      trade.sector.toLowerCase().includes(familyTrade);
    if (matchesTrade) {
      factors.push({
        factor: 'family_background',
        value: profile.family_occupation.occupation,
        contribution: 'positive',
      });
      reasons.push(`it aligns with your family's traditional occupation in ${profile.family_occupation.occupation}`);
    }
  }

  // Construct plain-language text
  const positiveReasons = reasons.filter((_, i) => factors[i]?.contribution === 'positive' || factors[i]?.contribution === 'neutral');
  let text = `Recommended for ${trade.qp_name} (NSQF Level ${trade.nsqf_level}, ${trade.qp_code})`;
  if (reasons.length > 0) {
    text += ` because ${reasons.slice(0, 3).join(', and ')}.`;
  }
  if (trade.opportunity_data?.evidence) {
    text += ` Local data: ${trade.opportunity_data.evidence}.`;
  }

  return { text, factors };
}
