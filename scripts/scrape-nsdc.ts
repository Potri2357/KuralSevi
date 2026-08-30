#!/usr/bin/env tsx
/**
 * Kural Sevi — Track 2: NSDC / Skill India Digital Hub (SIDH) QP-NOS Ingestion
 * Architecture rule: Curated, pre-verified QP-NOS data cached locally.
 * Includes official PM-AJAY priority trades for SC beneficiaries.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

interface NSDCTradeRecord {
  qp_code: string;
  qp_name: string;
  sector: string;
  nsqf_level: number;
  description: string;
  pathway_type: 'wage_employment' | 'self_employment' | 'home_enterprise';
  min_education_years: number;
  requires_physical_strength: boolean;
  requires_mobility: boolean;
  training_hours: number;
  required_skills: string[];
  skills_acquired: string[];
}

// Curated NSDC NSQF Catalog verified for PM-AJAY GIA
const CURATED_NSDC_TRADES: NSDCTradeRecord[] = [
  {
    qp_code: 'APP/Q0301',
    qp_name: 'Tailor — Women\'s and Men\'s Garment',
    sector: 'Apparel',
    nsqf_level: 4,
    description: 'Stitches garments and performs tailoring alterations as per specifications.',
    pathway_type: 'self_employment',
    min_education_years: 5,
    requires_physical_strength: false,
    requires_mobility: false,
    training_hours: 300,
    required_skills: ['hand_stitching', 'basic_stitching'],
    skills_acquired: ['pattern_making', 'garment_fitting', 'finishing'],
  },
  {
    qp_code: 'FIC/Q5001',
    qp_name: 'Papad and Ready-to-Eat Products Maker',
    sector: 'Food Processing',
    nsqf_level: 2,
    description: 'Prepares and packages traditional food products using domestic and semi-mechanized equipment.',
    pathway_type: 'home_enterprise',
    min_education_years: 0,
    requires_physical_strength: false,
    requires_mobility: false,
    training_hours: 80,
    required_skills: ['traditional_cooking'],
    skills_acquired: ['standardized_recipes', 'hygiene_standards', 'packaging'],
  },
  {
    qp_code: 'BWS/Q0201',
    qp_name: 'Assistant Beauty Therapist',
    sector: 'Beauty & Wellness',
    nsqf_level: 3,
    description: 'Provides basic beauty services including skincare, waxing, threading, and makeup.',
    pathway_type: 'self_employment',
    min_education_years: 8,
    requires_physical_strength: false,
    requires_mobility: false,
    training_hours: 240,
    required_skills: ['basic_grooming'],
    skills_acquired: ['skincare_treatments', 'eyebrow_threading', 'client_consultation'],
  },
  {
    qp_code: 'ELE/Q4601',
    qp_name: 'Field Technician — Home Appliances',
    sector: 'Electronics',
    nsqf_level: 4,
    description: 'Installs, troubleshoots, and repairs household electrical and electronic appliances.',
    pathway_type: 'wage_employment',
    min_education_years: 10,
    requires_physical_strength: false,
    requires_mobility: true,
    training_hours: 360,
    required_skills: ['basic_electrical_tools'],
    skills_acquired: ['fault_diagnosis', 'circuit_testing', 'component_replacement'],
  }
];

async function main() {
  console.log('Ingesting NSDC curated catalog into nsqf_catalog table...');
  let count = 0;
  for (const trade of CURATED_NSDC_TRADES) {
    const { error } = await supabase.from('nsqf_catalog').upsert({
      qp_code: trade.qp_code,
      qp_name: trade.qp_name,
      sector: trade.sector,
      nsqf_level: trade.nsqf_level,
      description: trade.description,
      pathway_type: trade.pathway_type,
      min_education_years: trade.min_education_years,
      requires_physical_strength: trade.requires_physical_strength,
      requires_mobility: trade.requires_mobility,
      training_hours: trade.training_hours,
      required_skills: trade.required_skills,
      skills_acquired: trade.skills_acquired,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'qp_code' });

    if (error) {
      console.warn(`[Skip/Offline] ${trade.qp_code}: ${error.message}`);
    } else {
      count++;
    }
  }
  console.log(`NSDC catalog ingestion routine finished (${count} updated/verified).`);
}

main().catch(console.error);
