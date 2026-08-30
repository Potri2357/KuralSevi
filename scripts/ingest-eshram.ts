#!/usr/bin/env tsx
/**
 * Kural Sevi — e-Shram Track 1 Data Ingestion
 * Source: data.gov.in e-Shram district occupation data
 * Schedule: Weekly via Supabase Edge Function
 * Architecture rule: All data pulled into cache; recommendation engine never calls live APIs.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY!;
const ESHRAM_DATASET_ID = process.env.ESHRAM_DATASET_ID || '6176b653-f879-4b55-8b6c-fef05c5fc7fa';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface EShramRecord {
  district: string;
  state: string;
  occupation_category: string;
  worker_count: number;
  male_count: number;
  female_count: number;
}

async function fetchEShramData(offset: number = 0, limit: number = 1000): Promise<EShramRecord[]> {
  const url = new URL(`https://api.data.gov.in/resource/${ESHRAM_DATASET_ID}`);
  url.searchParams.set('api-key', DATA_GOV_API_KEY);
  url.searchParams.set('format', 'json');
  url.searchParams.set('offset', offset.toString());
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`e-Shram API error: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as any;
  return (data.records || []) as EShramRecord[];
}

async function ingestDistrict(records: EShramRecord[]) {
  // Group by district
  const byDistrict: Record<string, any> = {};
  for (const r of records) {
    const key = `${r.state}::${r.district}`;
    if (!byDistrict[key]) {
      byDistrict[key] = {
        state: r.state,
        district: r.district,
        occupations: {},
        total_workers: 0,
      };
    }
    byDistrict[key].occupations[r.occupation_category] = {
      count: r.worker_count,
      male: r.male_count,
      female: r.female_count,
    };
    byDistrict[key].total_workers += r.worker_count;
  }

  // Mark previous records as not latest
  await supabase
    .from('district_data_cache')
    .update({ is_latest: false })
    .eq('source', 'eshram')
    .eq('data_type', 'occupation_distribution');

  // Insert new records
  const today = new Date().toISOString().slice(0, 10);
  for (const [, districtData] of Object.entries(byDistrict)) {
    await supabase.from('district_data_cache').insert({
      state: districtData.state,
      district: districtData.district,
      source: 'eshram',
      data_type: 'occupation_distribution',
      payload: {
        occupations: districtData.occupations,
        total_workers: districtData.total_workers,
        trade_counts: mapOccupationsToQPCodes(districtData.occupations),
      },
      fetch_date: today,
      is_latest: true,
    });
  }
  console.log(`Ingested e-Shram data for ${Object.keys(byDistrict).length} districts`);
}

// Maps broad occupation categories to QP-NOS codes for recommendation scoring
function mapOccupationsToQPCodes(occupations: Record<string, any>): Record<string, number> {
  const mapping: Record<string, string[]> = {
    'Textile Workers': ['TEX/Q4101', 'APP/Q0103', 'APP/Q0301', 'HAN/Q0101'],
    'Agricultural Labourers': ['AGR/Q4101', 'AGR/Q1201', 'AHC/Q0401'],
    'Construction Workers': ['CON/Q0102', 'CON/Q0501', 'CON/Q0701', 'CON/Q0603'],
    'Food Processing': ['FIC/Q0201', 'FIC/Q0601', 'FIC/Q0101'],
    'Domestic Workers': ['DMS/Q0101'],
    'Transport Workers': ['TRA/Q5501', 'LSC/Q1009'],
    'Leather Workers': ['LSS/Q2302', 'LSS/Q5001'],
    'Shop/Retail': ['RAS/Q0104', 'RAS/Q0502'],
  };

  const result: Record<string, number> = {};
  for (const [category, count] of Object.entries(occupations)) {
    const qpCodes = mapping[category] || [];
    for (const qp of qpCodes) {
      result[qp] = (result[qp] || 0) + (count as any).count;
    }
  }
  return result;
}

async function main() {
  console.log('Starting e-Shram data ingestion...');
  let offset = 0;
  const limit = 1000;
  let allRecords: EShramRecord[] = [];

  while (true) {
    const batch = await fetchEShramData(offset, limit);
    if (batch.length === 0) break;
    allRecords = [...allRecords, ...batch];
    offset += limit;
    if (batch.length < limit) break;
  }

  console.log(`Fetched ${allRecords.length} e-Shram records`);
  await ingestDistrict(allRecords);
  console.log('e-Shram ingestion complete.');
}

main().catch(console.error);
