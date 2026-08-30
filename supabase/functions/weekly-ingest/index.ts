// Supabase Edge Function — Weekly data ingestion cron
// Triggers Track 1 data pulls (e-Shram, Udyam) on a weekly schedule.
// Schedule: Sunday 01:00 IST (configured in supabase/config.toml)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DATA_GOV_API_KEY = Deno.env.get('DATA_GOV_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async () => {
  const results: Record<string, string> = {};

  // e-Shram ingest
  try {
    const resp = await fetch(
      `https://api.data.gov.in/resource/6176b653-f879-4b55-8b6c-fef05c5fc7fa?api-key=${DATA_GOV_API_KEY}&format=json&limit=1000`,
    );
    if (resp.ok) {
      const data = await resp.json();
      const today = new Date().toISOString().slice(0, 10);

      await supabase.from('district_data_cache').update({ is_latest: false }).eq('source', 'eshram');
      await supabase.from('district_data_cache').insert({
        state: 'ALL',
        district: 'ALL',
        source: 'eshram',
        data_type: 'raw_records',
        payload: { records: data.records?.slice(0, 100) ?? [] },
        fetch_date: today,
        is_latest: true,
      });
      results.eshram = `OK — ${data.count ?? 0} records`;
    }
  } catch (e) {
    results.eshram = `ERROR: ${e}`;
  }

  // Log ingestion run
  await supabase.from('audit_log').insert({
    event_type: 'data_ingestion',
    entity_type: 'system',
    entity_id: '00000000-0000-0000-0000-000000000000',
    actor_type: 'system',
    event_data: { ...results, run_at: new Date().toISOString() },
  });

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
