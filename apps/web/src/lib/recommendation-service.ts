// =============================================================================
// Kural Sevi — Recommendation Service Bridge
// Connects Call Records, the 3-Stage Recommendation Engine, and Officer Views.
// =============================================================================

import fs from 'fs';
import path from 'path';
import {
  runRecommendationEngine,
  NSQF_CATALOG_SEED,
  TRADE_SKILL_SYNONYMS,
} from '@kural-sevi/recommendation-engine';
import type { ConfirmedProfile, NSQFTrade } from '@kural-sevi/shared';
import type { CaseListItem, CaseDetailData, RecommendationDetail } from '@/features/cases/types';
import type { CallRecordItem } from '@/features/calls/types';

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
  citizen_selected_choice?: number;
  citizen_selected_course?: string;
  recommended_courses?: Array<{ rank: number; qp_code: string; qp_name: string; nsqf_level: number }>;
}

interface OfficerActionRecord {
  case_id: string;
  action: 'approved' | 'modified' | 'rejected';
  beneficiary_decision?: string;
  modified_recommendation?: any;
  officer_notes?: string;
  actioned_at: string;
}

import type { PlanningMetricsData, PlanningInsight } from '@/features/planning/types';

// In-memory cache for generated recommendations by case_id
const _recCache = new Map<string, RecommendationDetail[]>();

export function clearRecommendationCache() {
  _recCache.clear();
}

function getStoragePaths() {
  const root = process.cwd();
  // We check possible locations for completed_calls.json
  const possibleCallPaths = [
    path.resolve(root, 'apps/voice-api/data/completed_calls.json'),
    path.resolve(root, '../voice-api/data/completed_calls.json'),
    path.resolve(root, '../../apps/voice-api/data/completed_calls.json'),
    path.resolve(root, 'data/completed_calls.json'),
    '/Users/potrinathanpm/Projects/KuralSevi/apps/voice-api/data/completed_calls.json',
  ];
  let callPath = possibleCallPaths[0];
  for (const p of possibleCallPaths) {
    if (fs.existsSync(p)) {
      callPath = p;
      break;
    }
  }

  const possibleActionPaths = [
    path.resolve(root, 'apps/web/data/officer_actions.json'),
    path.resolve(root, 'data/officer_actions.json'),
    path.resolve(root, '../web/data/officer_actions.json'),
    '/Users/potrinathanpm/Projects/KuralSevi/apps/web/data/officer_actions.json',
  ];
  let actionPath = possibleActionPaths[0];
  for (const p of possibleActionPaths) {
    if (fs.existsSync(p)) {
      actionPath = p;
      break;
    }
  }
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

export function saveCompletedCall(record: CompletedCallRecord) {
  const { callPath } = getStoragePaths();
  try {
    const dir = path.dirname(callPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const current = loadCompletedCalls();
    const idx = current.findIndex(
      (c) => (record.session_id && c.session_id === record.session_id) || (record.case_id && c.case_id === record.case_id)
    );
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...record };
    } else {
      current.unshift(record);
    }
    fs.writeFileSync(callPath, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save completed call:', err);
  }
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
 * Extracts meaningful vocational skill and interest tokens from text strings
 */
function extractSkillTokens(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['and', 'for', 'the', 'with', 'own', 'area', 'completed', 'class', 'standard'].includes(w));
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

  // Only extract vocational skills from current livelihood if it is a specific trade (e.g. shop, tailoring)
  // rather than generic daily survival wage labour which shouldn't bias vocational recommendations
  const curLivLower = curLiv.toLowerCase();
  const isGenericLabor = curLivLower.includes('agricultural labour') || curLivLower.includes('daily wage') || curLivLower.includes('coolie');

  const existingSkills = [
    ...extractSkillTokens(skillsStr),
    ...(!isGenericLabor ? extractSkillTokens(curLiv) : []),
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
      occupation: famOcc || 'Traditional Household Livelihood',
      is_traditional: famOcc.toLowerCase().includes('traditional') || famOcc.toLowerCase().includes('weaving'),
      transferable_skills: extractSkillTokens(famOcc),
      generations: 2,
    },
    current_livelihood: {
      activity: curLiv || 'Local Livelihood',
      is_primary: true,
      income_stability: 'seasonal',
    },
    skills_and_interests: {
      existing_skills: existingSkills,
      informal_skills: extractSkillTokens(skillsStr),
      traditional_skills: extractSkillTokens(famOcc),
      // Clean isolation: citizen's expressed vocational aspirations are kept unpolluted by survival wage labour
      interests: skillsStr ? [skillsStr] : (!isGenericLabor && curLiv ? [curLiv] : []),
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
      district_industries: ['Textile', 'Food Processing', 'Retail', 'Capital Goods', 'Healthcare', 'Agriculture'],
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
        // Robust district opportunities across all supported NSQF sectors in Tamil Nadu
        const isHighOpportunitySector = 
          trade?.sector === 'Retail' || 
          trade?.sector === 'Apparel' || 
          trade?.sector === 'Food Industry' || 
          trade?.sector === 'Capital Goods' ||
          trade?.sector === 'Beauty & Wellness';
        
        return {
          qp_code: qp,
          opportunity_strength: (isHighOpportunitySector ? 'high' : 'medium') as 'high' | 'medium' | 'low',
          msme_count: isHighOpportunitySector ? 48 : 22,
          eshram_workers: isHighOpportunitySector ? 410 : 160,
          evidence: `Robust MSME enterprise cluster and consumer market demand in ${dist} district`,
          source: 'e-Shram & Udyam District Profile',
          source_date: '2026-06-15',
        };
      });
    },
  };

  // Custom Vector Search Port using domain keywords, synonyms, and skill overlap
  const customVectorSearchPort = {
    findSimilarTrades: async (prof: ConfirmedProfile, eligibleQpCodes: string[], limit: number) => {
      const citizenInterests = (prof.skills_and_interests?.interests ?? []).map(s => s.toLowerCase());
      const citizenSkills = (prof.skills_and_interests?.existing_skills ?? []).map(s => s.toLowerCase());
      const allCitizenTokens = Array.from(new Set([
        ...citizenSkills,
        ...citizenInterests.flatMap(i => i.replace(/[^\w\s]/g, ' ').split(/\s+/)).filter(w => w.length > 2),
      ]));

      const scored = eligibleQpCodes.map(code => {
        const trade = NSQF_CATALOG_SEED.find(t => t.qp_code === code);
        if (!trade) return { ...NSQF_CATALOG_SEED[0], similarity: 0.5 };

        const synonyms = (TRADE_SKILL_SYNONYMS[trade.qp_code] || []).map(s => s.toLowerCase());
        const tradeKeywords = [
          trade.qp_name.toLowerCase(),
          trade.sector.toLowerCase(),
          ...trade.required_skills.map(s => s.toLowerCase()),
          ...trade.skills_acquired.map(s => s.toLowerCase()),
          ...synonyms,
        ];

        let matchCount = 0;

        // 1. Direct interest phrase matching gets highest priority
        for (const interest of citizenInterests) {
          if (trade.qp_name.toLowerCase().includes(interest) || interest.includes(trade.qp_name.toLowerCase())) {
            matchCount += 6;
          } else if (synonyms.some(syn => interest.includes(syn) || syn.includes(interest))) {
            matchCount += 5;
          } else if (trade.sector.toLowerCase().includes(interest) || interest.includes(trade.sector.toLowerCase())) {
            matchCount += 4;
          }
        }

        // 2. Token matching against trade keywords and synonyms
        for (const token of allCitizenTokens) {
          if (token.length <= 2) continue;
          if (synonyms.includes(token)) {
            matchCount += 3;
          } else if (tradeKeywords.some(tk => tk.includes(token) || token.includes(tk))) {
            matchCount += 1.5;
          }
        }

        // 3. Boost if employment preference matches pathway type
        if (prof.employment_preference === 'self' && (trade.pathway_type === 'self_employment' || trade.pathway_type === 'home_enterprise')) {
          matchCount += 2;
        } else if (prof.employment_preference === 'wage' && trade.pathway_type === 'wage_employment') {
          matchCount += 2;
        }

        const similarity = Math.min(0.98, Math.max(0.40, 0.45 + matchCount * 0.07));
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
      id: call.case_id,
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
      sla_deadline: new Date(new Date(call.completed_at || Date.now()).getTime() + 3 * 86400000).toISOString(),
      created_at: call.completed_at || new Date().toISOString(),
      consultant_required: topRec?.confidence === 'needs_officer_review',
    });
  }

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
      citizen_selected_choice: matchedCall.citizen_selected_choice,
      citizen_selected_course: matchedCall.citizen_selected_course,
      citizen_confirmed: matchedCall.citizen_confirmed,
      confirmed_via: matchedCall.confirmed_via,
      confirmed_at: matchedCall.confirmed_at,
    };
  }

  return null;
}

/**
 * Generates dynamic District Planning Intelligence metrics from actual citizen calls
 */
export async function getDistrictPlanningMetrics(): Promise<PlanningMetricsData> {
  const completedCalls = loadCompletedCalls();
  const totalBeneficiaries = completedCalls.length;
  const completedProfiles = completedCalls.filter(
    (c) => c.citizen_confirmed || Object.keys(c.confirmed_fields || {}).length >= 4
  ).length;
  const mobilityConstraints = completedCalls.filter((c) => {
    const mob = (c.confirmed_fields?.mobility_constraints || '').toLowerCase();
    return mob.includes('local') || mob.includes('disabilit') || mob.includes('care') || mob.includes('home');
  }).length;
  const midInterviewDropoffs = completedCalls.filter((c) => !c.citizen_confirmed).length;

  const tradeFrequencies: Record<string, number> = {};
  const empCounts = { 'Self-Employment': 0, 'Wage Employment': 0, 'Home-based Enterprise': 0 };
  const skillGapCounts: Record<string, number> = {};
  const monthCounts: Record<string, { cases: number; completed: number }> = {};

  for (const call of completedCalls) {
    const recs = await getRecommendationsForCall(call);
    const top = recs[0];
    if (top) {
      tradeFrequencies[top.qp_name] = (tradeFrequencies[top.qp_name] || 0) + 1;
      if (top.pathway_type === 'wage_employment') {
        empCounts['Wage Employment']++;
      } else if (top.pathway_type === 'home_enterprise') {
        empCounts['Home-based Enterprise']++;
      } else {
        empCounts['Self-Employment']++;
      }
      for (const skill of top.skills_to_acquire || []) {
        skillGapCounts[skill] = (skillGapCounts[skill] || 0) + 1;
      }
    }

    const date = call.completed_at ? new Date(call.completed_at) : new Date();
    const month = date.toLocaleString('en-US', { month: 'short' });
    if (!monthCounts[month]) {
      monthCounts[month] = { cases: 0, completed: 0 };
    }
    monthCounts[month].cases++;
    if (call.citizen_confirmed) {
      monthCounts[month].completed++;
    }
  }

  const tradeColors = ['#0B3064', '#144282', '#E05A1B', '#0A783C', '#475569', '#64748B'];
  const topTrades = Object.entries(tradeFrequencies)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({
      name,
      count,
      fill: tradeColors[i % tradeColors.length],
    }));

  const employmentSplit = [
    { name: 'Self-Employment', value: empCounts['Self-Employment'], fill: '#E05A1B' },
    { name: 'Wage Employment', value: empCounts['Wage Employment'], fill: '#0B3064' },
    { name: 'Home-based Enterprise', value: empCounts['Home-based Enterprise'], fill: '#0A783C' },
  ].filter((e) => e.value > 0);

  const skillGaps = Object.entries(skillGapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([skill, count]) => ({ skill, count }));

  const monthlyTrend = Object.entries(monthCounts).map(([month, data]) => ({
    month,
    cases: data.cases,
    completed: data.completed,
  }));

  const topTradeName = topTrades[0]?.name || 'Vocational Pathway';
  const topTradeCount = topTrades[0]?.count || 0;
  const insights: PlanningInsight[] = [
    {
      icon: 'School',
      title: 'High-Demand Pathway Alignment',
      body: `${topTradeCount} caller${topTradeCount !== 1 ? 's' : ''} recommended for ${topTradeName}. Coordinate with local ITIs to align training batches.`,
      urgency: 'chakra',
    },
    {
      icon: 'Building2',
      title: 'Enterprise & Market Linkage',
      body: `${empCounts['Self-Employment'] + empCounts['Home-based Enterprise']} beneficiaries opted for self or home-based enterprise. Prioritize PM-AJAY GIA capital subsidy linkage.`,
      urgency: 'green',
    },
    {
      icon: 'Accessibility',
      title: 'Local Mobility Support',
      body: `${mobilityConstraints} beneficiaries noted local travel constraints. Consider cluster-proximate training modules or home-based toolkits.`,
      urgency: 'saffron',
    },
  ];

  return {
    totalBeneficiaries,
    completedProfiles,
    mobilityConstraints,
    midInterviewDropoffs,
    topTrades,
    employmentSplit,
    skillGaps,
    monthlyTrend: monthlyTrend.length > 0 ? monthlyTrend : [{ month: 'Sep', cases: totalBeneficiaries, completed: completedProfiles }],
    insights,
  };
}

/**
 * Returns all completed call records enriched with their NSQF top recommendation and officer status
 */
export async function getEnrichedCallRecords(): Promise<CallRecordItem[]> {
  const calls = loadCompletedCalls();
  const actions = loadOfficerActions();

  const results: CallRecordItem[] = [];
  for (const call of calls) {
    const recs = await getRecommendationsForCall(call);
    const top = recs[0];
    const action = actions[call.case_id]?.action || 'pending';

    results.push({
      session_id: call.session_id,
      case_id: call.case_id,
      phone: call.phone,
      channel: call.channel || 'ivr',
      language: call.language || 'ta',
      status: call.status || 'COMPLETED',
      citizen_confirmed: Boolean(call.citizen_confirmed),
      notification_status: call.notification_status || 'DISPATCHED',
      completed_at: call.completed_at || new Date().toISOString(),
      confirmed_fields: call.confirmed_fields || {},
      turns_count: call.turns_count || call.transcript?.length || 0,
      transcript: call.transcript || [],
      confirmed_via: call.confirmed_via,
      confirmed_at: call.confirmed_at,
      officer_action: action,
      top_recommendation: top
        ? {
            qp_code: top.qp_code,
            qp_name: top.qp_name,
            nsqf_level: top.nsqf_level,
            pathway_type: top.pathway_type,
            confidence: top.confidence,
            topsis_score: top.topsis_score,
            income_range: top.income_range,
          }
        : undefined,
    });
  }

  return results;
}
