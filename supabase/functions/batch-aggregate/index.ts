// Supabase Edge Function — Daily batch aggregation
// Computes district-level planning statistics from confirmed case data.
// Schedule: Daily at 02:00 IST

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // Get all active districts
  const { data: beneficiaries } = await supabase
    .from('beneficiaries')
    .select('district, state')
    .is('erased_at', null);

  const districts = [...new Map(
    (beneficiaries ?? []).map(b => [`${b.state}::${b.district}`, b])
  ).values()];

  let processed = 0;
  for (const { district, state } of districts) {
    const { count: total } = await supabase
      .from('beneficiaries')
      .select('*', { count: 'exact', head: true })
      .eq('district', district);

    const { count: pending } = await supabase
      .from('officer_cases')
      .select('*', { count: 'exact', head: true })
      .eq('district', district)
      .eq('officer_action', 'pending');

    await supabase.from('planning_aggregates').upsert({
      state, district, aggregation_date: today,
      period_start: periodStart, period_end: today,
      total_beneficiaries: total ?? 0,
      completed_profiles: 0,
      pending_officer_review: pending ?? 0,
      computed_at: new Date().toISOString(),
    }, { onConflict: 'district,aggregation_date' });

    processed++;
  }

  return new Response(JSON.stringify({ success: true, districts_processed: processed }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
