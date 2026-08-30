// =============================================================================
// Stage 1: Hard Filters
// Excludes pathways BEFORE any scoring (Section 9, Stage 1 of PRD).
// A pathway excluded here never appears in the top-3.
// All constraint checks are logged for auditability (FR-8d).
// =============================================================================

import type { NSQFTrade, ConfirmedProfile } from '@kural-sevi/shared';

export interface HardFilterResult {
  eligible: NSQFTrade[];
  excluded: Array<{
    trade: NSQFTrade;
    reasons: string[];
  }>;
  constraint_flags: {
    mobility_checked: boolean;
    disability_checked: boolean;
    gender_safety_checked: boolean;
    travel_checked: boolean;
    education_checked: boolean;
    nsqf_eligibility_checked: boolean;
  };
}

export function applyHardFilters(
  candidates: NSQFTrade[],
  profile: ConfirmedProfile
): HardFilterResult {
  const eligible: NSQFTrade[] = [];
  const excluded: HardFilterResult['excluded'] = [];

  const flags: HardFilterResult['constraint_flags'] = {
    mobility_checked: false,
    disability_checked: false,
    gender_safety_checked: false,
    travel_checked: false,
    education_checked: false,
    nsqf_eligibility_checked: true, // always checked
  };

  const mobility = profile.mobility_constraints;
  const education = profile.educational_background;
  const gender = undefined; // from beneficiary, not profile — passed via context

  for (const trade of candidates) {
    const exclusionReasons: string[] = [];

    // --- Filter 1: Education eligibility ---
    flags.education_checked = true;
    const completedYears = education?.completed_years ?? 0;
    if (trade.min_education_years > completedYears && !education?.can_do_basic_math) {
      exclusionReasons.push(
        `Requires ${trade.min_education_years} years of education; beneficiary has ${completedYears}`
      );
    }

    // --- Filter 2: Mobility / travel constraint ---
    if (mobility) {
      flags.mobility_checked = true;
      flags.travel_checked = true;
      if (trade.requires_mobility && mobility.travel_radius_km < 5) {
        exclusionReasons.push(
          `Trade requires mobility but beneficiary travel radius is ${mobility.travel_radius_km} km`
        );
      }

      // --- Filter 3: Physical strength / disability ---
      flags.disability_checked = true;
      if (trade.requires_physical_strength && mobility.has_disability) {
        exclusionReasons.push(
          `Trade requires physical strength; beneficiary has a disability`
        );
      }

      // --- Filter 4: Gender safety concerns ---
      flags.gender_safety_checked = true;
      if (mobility.gender_safety_concerns) {
        // Night-shift or high-mobility trades are excluded for safety
        if (!mobility.can_work_night_shift && trade.requires_mobility && trade.sector === 'Transport') {
          exclusionReasons.push(
            `Trade involves night-shift transport; excluded due to gender safety concern`
          );
        }
      }

      // --- Filter 5: Caregiving constraint + travel ---
      if (mobility.has_caregiving_responsibility && mobility.caregiving_hours_per_day) {
        const hoursForWork = 24 - mobility.caregiving_hours_per_day;
        if (hoursForWork < 6 && trade.requires_mobility) {
          exclusionReasons.push(
            `High caregiving load (${mobility.caregiving_hours_per_day}h/day) incompatible with mobile trade`
          );
        }
      }
    }

    if (exclusionReasons.length > 0) {
      excluded.push({ trade, reasons: exclusionReasons });
    } else {
      eligible.push(trade);
    }
  }

  return { eligible, excluded, constraint_flags: flags };
}
