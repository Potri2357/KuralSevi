#!/usr/bin/env tsx
/**
 * Kural Sevi — Batch Planning Aggregation (FR-14, FR-16)
 * Computes district-level statistics from confirmed case data.
 * Run on a schedule (daily) — never in real-time during beneficiary sessions.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function aggregateDistrict(district: string, state: string, periodStart: Date, periodEnd: Date) {
  const start = periodStart.toISOString();
  const end = periodEnd.toISOString();
  const today = new Date().toISOString().slice(0, 10);

  // --- Total beneficiaries in district ---
  const { count: totalBenef } = await supabase
    .from('beneficiaries')
    .select('*', { count: 'exact', head: true })
    .eq('district', district)
    .gte('created_at', start).lte('created_at', end);

  // --- Completed profiles ---
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, employment_preference, mobility_constraints, skills_and_interests')
    .eq('is_complete', true)
    .gte('created_at', start).lte('created_at', end);

  // --- Officer cases stats ---
  const { data: cases } = await supabase
    .from('officer_cases')
    .select('officer_action, consultant_referral_status, sla_deadline, created_at')
    .eq('district', district)
    .gte('created_at', start).lte('created_at', end);

  const pendingReview = (cases || []).filter(c => c.officer_action === 'pending').length;
  const slaBreached = (cases || []).filter(c =>
    c.officer_action === 'pending' && new Date(c.sla_deadline) < new Date()
  ).length;
  const consultantPending = (cases || []).filter(c =>
    c.consultant_referral_status === 'required_pending'
  ).length;

  // --- Top requested trades from recommendations ---
  const { data: recs } = await supabase
    .from('recommendations')
    .select('qp_code, nsqf_catalog(qp_name)')
    .eq('rank', 1)
    .gte('created_at', start).lte('created_at', end);

  const tradeCounts: Record<string, { qp_code: string; trade_name: string; count: number }> = {};
  for (const rec of (recs || [])) {
    const key = rec.qp_code;
    if (!tradeCounts[key]) {
      tradeCounts[key] = { qp_code: key, trade_name: (rec as any).nsqf_catalog?.qp_name || key, count: 0 };
    }
    tradeCounts[key].count++;
  }
  const topTrades = Object.values(tradeCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  // --- Employment preference split ---
  let selfCount = 0, wageCount = 0;
  for (const p of (profiles || [])) {
    if (p.employment_preference === 'self') selfCount++;
    else if (p.employment_preference === 'wage') wageCount++;
  }

  // --- Mobility barrier count ---
  const mobilityCount = (profiles || []).filter(p => {
    const mc = p.mobility_constraints as any;
    return mc && (mc.has_disability || mc.travel_radius_km < 5 || mc.has_caregiving_responsibility);
  }).length;

  // --- Drop-off count ---
  const { count: dropoff } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('state', 'dropped')
    .gte('created_at', start).lte('created_at', end);

  // --- Upsert aggregate ---
  await supabase.from('planning_aggregates').upsert({
    state,
    district,
    aggregation_date: today,
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    total_beneficiaries: totalBenef || 0,
    completed_profiles: (profiles || []).length,
    pending_officer_review: pendingReview,
    sla_breached: slaBreached,
    top_requested_trades: topTrades,
    common_existing_occupations: [],
    recurring_skill_gaps: [],
    mobility_barrier_count: mobilityCount,
    self_employment_count: selfCount,
    wage_employment_count: wageCount,
    consultant_referral_pending: consultantPending,
    mid_interview_dropoff: dropoff || 0,
    computed_at: new Date().toISOString(),
  }, { onConflict: 'district,aggregation_date' });

  console.log(`Aggregated: ${district}, ${state} — ${totalBenef} beneficiaries`);
}

async function main() {
  console.log('Starting batch planning aggregation...');
  const now = new Date();
  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30-day window

  // Get all active districts
  const { data: districts } = await supabase
    .from('beneficiaries')
    .select('district, state')
    .neq('erased_at', null);

  const unique = [...new Map((districts || []).map(d => [`${d.state}::${d.district}`, d])).values()];

  for (const { district, state } of unique) {
    await aggregateDistrict(district, state, periodStart, now);
  }

  console.log(`Planning aggregation complete. ${unique.length} districts processed.`);
}

main().catch(console.error);
