#!/usr/bin/env tsx
/**
 * Kural Sevi — Udyam/MSME Track 1 Ingestion
 * Source: data.gov.in Udyam registration district data
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log('Starting Udyam MSME data ingestion...');
  const today = new Date().toISOString().slice(0, 10);

  // Fetch from data.gov.in — Udyam district-wise registrations
  const url = `https://api.data.gov.in/resource/${process.env.UDYAM_DATASET_ID}?api-key=${process.env.DATA_GOV_API_KEY}&format=json&limit=1000`;
  
  const resp = await fetch(url);
  if (!resp.ok) {
    console.error('Udyam API error:', resp.status);
    return;
  }
  
  const data = await resp.json() as any;
  const records = data.records ?? [];

  // Group by district
  const byDistrict: Record<string, { count: number; sectors: Record<string, number> }> = {};
  for (const r of records) {
    const key = `${r.state}::${r.district}`;
    if (!byDistrict[key]) byDistrict[key] = { count: 0, sectors: {} };
    byDistrict[key].count++;
    const sector = r.major_activity ?? 'Unknown';
    byDistrict[key].sectors[sector] = (byDistrict[key].sectors[sector] ?? 0) + 1;
  }

  // Mark old records
  await supabase.from('district_data_cache').update({ is_latest: false }).eq('source', 'udyam');

  // Insert new records
  for (const [key, d] of Object.entries(byDistrict)) {
    const [state, district] = key.split('::');
    await supabase.from('district_data_cache').insert({
      state, district, source: 'udyam',
      data_type: 'msme_registrations',
      payload: { total_enterprises: d.count, sectors: d.sectors },
      fetch_date: today, is_latest: true,
    });
  }

  console.log(`Udyam ingestion complete. ${Object.keys(byDistrict).length} districts.`);
}

main().catch(console.error);
