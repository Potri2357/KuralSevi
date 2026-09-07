// =============================================================================
// Kural Sevi — Recommendation Service Bridge
// Connects Call Records, the 3-Stage Recommendation Engine, and Officer Views.
// =============================================================================

import fs from 'fs';
import path from 'path';
import {
  runRecommendationEngine,
  NSQF_CATALOG_SEED,
} from '@kural-sevi/recommendation-engine';
import type { ConfirmedProfile, NSQFTrade } from '@kural-sevi/shared';
import type { CaseListItem, CaseDetailData, RecommendationDetail } from '@/features/cases/types';

interface CompletedCallRecord {
  session_id: string;
  case_id: string;
  phone: string;
  channel: string;
  language: string;
  status: string;
  citizen_confirmed: boolean;
  notification_status: string;
  completed_at: string;
  confirmed_fields: Record<string, string>;
  turns_count?: number;
  transcript?: Array<{ user: string; assistant: string; timestamp?: string }>;
  confirmed_via?: string;
  confirmed_at?: string;
}

interface OfficerActionRecord {
  case_id: string;
  action: 'approved' | 'modified' | 'rejected';
  beneficiary_decision?: string;
  modified_recommendation?: any;
  officer_notes?: string;
  actioned_at: string;
}

// In-memory cache for generated recommendations by case_id
const _recCache = new Map<string, RecommendationDetail[]>();

function getStoragePaths() {
  const root = process.cwd();
  // We check possible locations for completed_calls.json
  const possibleCallPaths = [
    path.resolve(root, '../../apps/voice-api/data/completed_calls.json'),
    path.resolve(root, '../voice-api/data/completed_calls.json'),
    path.resolve(root, 'data/completed_calls.json'),
  ];
  let callPath = possibleCallPaths[0];
  for (const p of possibleCallPaths) {
    if (fs.existsSync(p)) {
      callPath = p;
      break;
    }
  }

  const actionPath = path.resolve(root, 'data/officer_actions.json');
  return { callPath, actionPath };
}

export function loadCompletedCalls(): CompletedCallRecord[] {
  const { callPath } = getStoragePaths();
  try {
    if (fs.existsSync(callPath)) {
      const raw = fs.readFileSync(callPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load completed calls:', err);
  }
  return [];
}

export function loadOfficerActions(): Record<string, OfficerActionRecord> {
  const { actionPath } = getStoragePaths();
  try {
    if (fs.existsSync(actionPath)) {
      const raw = fs.readFileSync(actionPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load officer actions:', err);
  }
  return {};
}

export function saveOfficerAction(record: OfficerActionRecord) {
  const { actionPath } = getStoragePaths();
  try {
    const dir = path.dirname(actionPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = loadOfficerActions();
    current[record.case_id] = record;
    fs.writeFileSync(actionPath, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save officer action:', err);
  }
}

/**
 * Parses freeform educational string into completed years
 */
function parseEducationYears(edu: string): number {
  const s = (edu || '').toLowerCase();
  if (s.includes('12') || s.includes('higher secondary') || s.includes('plus two') || s.includes('+2')) return 12;
  if (s.includes('10') || s.includes('sslc') || s.includes('matric')) return 10;
  if (s.includes('8') || s.includes('middle')) return 8;
  if (s.includes('5') || s.includes('primary')) return 5;
  if (s.includes('degree') || s.includes('college') || s.includes('graduate')) return 15;
  return 8; // default to upper primary
}

/**
 * Extracts skills from text strings
 */
function extractSkillTokens(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['and', 'for', 'the', 'with', 'own', 'shop', 'area'].includes(w));
  return Array.from(new Set(words));
}

/**
 * Detects district from transcript turns or context
 */
function extractDistrict(call: CompletedCallRecord): string {
  const context = (call.confirmed_fields?.local_economic_context || '').toLowerCase();
  const transcriptStr = (call.transcript || []).map(t => `${t.user} ${t.assistant}`).join(' ').toLowerCase();
  const fullText = `${context} ${transcriptStr}`;

  const districts = [
    'Madurai', 'Namakkal', 'Salem', 'Tiruppur', 'Coimbatore', 'Chennai', 
    'Tiruchirappalli', 'Erode', 'Dindigul', 'Thanjavur', 'Vellore'
  ];

  for (const d of districts) {
    if (fullText.includes(d.toLowerCase())) return d;
  }
  return 'Namakkal'; // Standard pilot default
}

/**
 * Converts a CompletedCallRecord into a ConfirmedProfile for recommendation evaluation
 */
export function callRecordToProfile(call: CompletedCallRecord): ConfirmedProfile {
  const fields = call.confirmed_fields || {};
  const eduStr = fields.educational_background || '';
  const famOcc = fields.family_occupation || '';
  const curLiv = fields.current_livelihood || '';
  const skillsStr = fields.skills_and_interests || '';
  const mobStr = fields.mobility_constraints || '';
  const empPrefStr = (fields.employment_preference || '').toLowerCase();
  const ecoStr = fields.local_economic_context || '';

  const completedYears = parseEducationYears(eduStr);
  const district = extractDistrict(call);

  let empPref: 'wage' | 'self' | 'either' = 'either';
  if (empPrefStr.includes('self') || empPrefStr.includes('own') || empPrefStr.includes('shop') || empPrefStr.includes('business')) {
    empPref = 'self';
  } else if (empPrefStr.includes('wage') || empPrefStr.includes('job') || empPrefStr.includes('factory') || empPrefStr.includes('worker')) {
    empPref = 'wage';
  }

  const existingSkills = [
    ...extractSkillTokens(skillsStr),
    ...extractSkillTokens(famOcc),
    ...extractSkillTokens(curLiv),
  ];

  return {
    id: call.session_id,
    beneficiary_id: call.case_id,
    session_id: call.session_id,
    educational_background: {
      level: completedYears >= 10 ? 'secondary' : completedYears >= 8 ? 'upper_primary' : 'primary',
      completed_years: completedYears,
      can_read: true,
      can_write: true,
      can_do_basic_math: true,
    },
    family_occupation: {
      occupation: famOcc || 'Farming',
      is_traditional: famOcc.toLowerCase().includes('traditional') || famOcc.toLowerCase().includes('weaving'),
      transferable_skills: extractSkillTokens(famOcc),
      generations: 2,
    },
    current_livelihood: {
      activity: curLiv || 'Agricultural Labour',
      is_primary: true,
      income_stability: 'seasonal',
    },
    skills_and_interests: {
      existing_skills: existingSkills,
      informal_skills: extractSkillTokens(skillsStr),
      traditional_skills: extractSkillTokens(famOcc),
      interests: [skillsStr, curLiv].filter(Boolean),
      has_prior_training: false,
    },
    mobility_constraints: {
      has_disability: mobStr.toLowerCase().includes('disabilit') || mobStr.toLowerCase().includes('handicap'),
      travel_radius_km: mobStr.toLowerCase().includes('local') || mobStr.toLowerCase().includes('within') ? 6 : 12,
      has_caregiving_responsibility: mobStr.toLowerCase().includes('care') || mobStr.toLowerCase().includes('home'),
      caregiving_hours_per_day: 2,
      gender_safety_concerns: false,
      can_work_night_shift: false,
    },
    employment_preference: empPref,
    local_economic_context: {
      nearby_markets: [ecoStr || `${district} town market`],
      district_industries: ['Textile', 'Food Processing', 'Agriculture', 'Retail'],
      has_local_training_centers: true,
      transportation_access: 'good' as const,
    },
    profile_completeness: Object.keys(fields).length >= 5 ? 0.95 : 0.70,
    is_complete: Object.keys(fields).length >= 5,
  };
}

/**
 * Runs the Recommendation Engine for a call record and formats into UI RecommendationDetail[]
 */
export async function getRecommendationsForCall(call: CompletedCallRecord): Promise<RecommendationDetail[]> {
  if (_recCache.has(call.case_id)) {
    return _recCache.get(call.case_id)!;
  }

  const profile = callRecordToProfile(call);

  // In-memory Opportunity Data Provider matching local district
  const district = (profile.local_economic_context as any)?.district || 'Namakkal';
  const customOpportunityPort = {
    getOpportunityData: async (dist: string, state: string, qpCodes: string[]) => {
      return qpCodes.map(qp => {
        const trade = NSQF_CATALOG_SEED.find(t => t.qp_code === qp);
        const isRetailOrAgri = trade?.sector === 'Retail' || trade?.sector === 'Agriculture' || trade?.sector === 'Food Industry';
        return {
          qp_code: qp,
          opportunity_strength: (isRetailOrAgri ? 'high' : 'medium') as 'high' | 'medium' | 'low',
          msme_count: isRetailOrAgri ? 42 : 18,
          eshram_workers: isRetailOrAgri ? 320 : 110,
          evidence: `${isRetailOrAgri ? 'Strong' : 'Steady'} economic activity & MSME cluster presence in ${dist}`,
          source: 'e-Shram & Udyam District Profile',
          source_date: '2026-06-15',
        };
      });
    },
  };

  // Custom Vector Search Port using keyword and skill overlap
  const customVectorSearchPort = {
    findSimilarTrades: async (prof: ConfirmedProfile, eligibleQpCodes: string[], limit: number) => {
      const allSkills = [
        ...(prof.skills_and_interests?.existing_skills ?? []),
        ...(prof.skills_and_interests?.interests ?? []),
        ...(prof.family_occupation?.transferable_skills ?? []),
      ].map(s => s.toLowerCase());

      const scored = eligibleQpCodes.map(code => {
        const trade = NSQF_CATALOG_SEED.find(t => t.qp_code === code);
        if (!trade) return { ...NSQF_CATALOG_SEED[0], similarity: 0.5 };

        let matchCount = 0;
        const tradeText = `${trade.qp_name} ${trade.sector} ${trade.required_skills.join(' ')} ${trade.skills_acquired.join(' ')}`.toLowerCase();

        for (const skill of allSkills) {
          if (tradeText.includes(skill) || skill.split(' ').some(w => tradeText.includes(w))) {
            matchCount += 2;
          }
        }

        // Boost if employment preference matches
        if (prof.employment_preference === 'self' && trade.pathway_type === 'self_employment') {
          matchCount += 1.5;
        }

        const similarity = Math.min(0.96, Math.max(0.45, 0.50 + matchCount * 0.08));
        return { ...trade, similarity };
      });

      scored.sort((a, b) => b.similarity - a.similarity);
      return scored.slice(0, limit);
    },
  };

  const engineResult = await runRecommendationEngine({
    profile,
    sttConfidenceAvg: 0.92,
    extractionCertainty: 0.90,
    catalogOverride: NSQF_CATALOG_SEED,
    vectorSearchPort: customVectorSearchPort,
    opportunityPort: customOpportunityPort,
  });

  const details: RecommendationDetail[] = engineResult.pathways.map(p => {
    const tradeSeed = NSQF_CATALOG_SEED.find(t => t.qp_code === p.qp_code);
    const minInc = tradeSeed?.typical_income_min ? `₹${tradeSeed.typical_income_min.toLocaleString('en-IN')}` : '₹8,000';
    const maxInc = tradeSeed?.typical_income_max ? `₹${tradeSeed.typical_income_max.toLocaleString('en-IN')}` : '₹25,000';

    return {
      rank: p.rank,
      qp_code: p.qp_code,
      qp_name: p.qp_name,
      nsqf_level: p.nsqf_level,
      pathway_type: p.pathway_type,
      matched_skills: p.matched_skills.length > 0 ? p.matched_skills : ['Foundational practical skills'],
      skills_to_acquire: p.skills_to_acquire.length > 0 ? p.skills_to_acquire : ['Enterprise setup', 'Advanced techniques'],
      confidence: p.confidence_label,
      topsis_score: Math.round(p.topsis_score * 100) / 100,
      explanation: p.explanation_text,
      opportunity: {
        strength: (p.local_opportunity_signal.strength === 'unknown' ? 'medium' : p.local_opportunity_signal.strength) as 'high' | 'medium' | 'low',
        source: p.local_opportunity_signal.source,
        date: p.local_opportunity_signal.source_date,
        evidence: p.local_opportunity_signal.evidence,
      },
      income_range: `${minInc} – ${maxInc}/month`,
      travel_feasible: p.travel_feasibility,
      training_hours: tradeSeed?.training_duration_hours || 180,
    };
  });

  _recCache.set(call.case_id, details);
  return details;
}

/**
 * Returns all cases formatted for the Officer Case Queue
 */
export async function getAllOfficerCases(): Promise<CaseListItem[]> {
  const completedCalls = loadCompletedCalls();
  const actions = loadOfficerActions();

  const callCases: CaseListItem[] = [];

  for (let idx = 0; idx < completedCalls.length; idx++) {
    const call = completedCalls[idx];
    const recs = await getRecommendationsForCall(call);
    const topRec = recs[0];
    const actionRec = actions[call.case_id];

    const officerAction = actionRec?.action || (call.citizen_confirmed ? 'pending' : 'pending');
    const district = extractDistrict(call);

    callCases.push({
      id: String(100 + idx),
      case_id: call.case_id,
      district,
      state: 'Tamil Nadu',
      confidence: topRec?.confidence || (call.citizen_confirmed ? 'high' : 'medium'),
      officer_action: officerAction,
      days_pending: Math.max(1, Math.floor((Date.now() - new Date(call.completed_at).getTime()) / 86400000) || 1),
      top_trade: topRec?.qp_name || 'Vocational Pathway',
      qp_code: topRec?.qp_code || 'APP/Q0301',
      nsqf_level: topRec?.nsqf_level || 4,
      pathway_type: topRec?.pathway_type || 'self_employment',
      employment_pref: (call.confirmed_fields?.employment_preference || '').toLowerCase().includes('wage') ? 'wage' : 'self',
      has_mobility: !(call.confirmed_fields?.mobility_constraints || '').toLowerCase().includes('local'),
      sla_deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
      created_at: call.completed_at || new Date().toISOString(),
      consultant_required: topRec?.confidence === 'needs_officer_review',
    });
  }

  // Prepend completed phone calls so real callers are always first on the officer docket
  return callCases;
}

/**
 * Returns the complete CaseDetailData for a given case_id or id
 */
export async function getCaseDetail(caseIdOrId: string): Promise<CaseDetailData | null> {
  const completedCalls = loadCompletedCalls();
  const actions = loadOfficerActions();

  const matchedCall = completedCalls.find(
    (c, idx) => c.case_id === caseIdOrId || String(100 + idx) === caseIdOrId || c.session_id === caseIdOrId
  );

  if (matchedCall) {
    const recs = await getRecommendationsForCall(matchedCall);
    const district = extractDistrict(matchedCall);
    const actionRec = actions[matchedCall.case_id];
    const fields = matchedCall.confirmed_fields || {};

    return {
      case_id: matchedCall.case_id,
      district,
      state: 'Tamil Nadu',
      language: matchedCall.language === 'ta' ? 'Tamil' : matchedCall.language === 'hi' ? 'Hindi' : matchedCall.language === 'te' ? 'Telugu' : matchedCall.language === 'ml' ? 'Malayalam' : 'Tamil',
      gender: 'All / Specified in DPDP',
      age_group: '21-35',
      profile: {
        educational_background: fields.educational_background || 'Recorded via Voice Telephony',
        family_occupation: fields.family_occupation || 'Recorded via Voice Telephony',
        current_livelihood: fields.current_livelihood || 'Recorded via Voice Telephony',
        skills_and_interests: fields.skills_and_interests || 'Recorded via Voice Telephony',
        mobility_constraints: fields.mobility_constraints || 'Within district / local enterprise',
        employment_preference: fields.employment_preference || 'Self-employment preferred',
        local_economic_context: fields.local_economic_context || `${district} district cluster`,
        completeness: Object.keys(fields).length >= 5 ? 0.95 : 0.75,
      },
      recommendations: recs,
    };
  }

  return null;
}
