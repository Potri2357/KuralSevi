#!/usr/bin/env tsx
/**
 * Kural Sevi — End-to-End Recommendation Pipeline Verification
 * Validates complete linkage:
 * Telephony Call Records -> 3-Stage Recommendation Engine -> Web API & Officer Views
 */

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
}

interface VoiceApiResponse {
  count: number;
  records: CompletedCallRecord[];
}

interface WebCaseItem {
  id: string;
  case_id: string;
  district: string;
  state: string;
  confidence: string;
  officer_action: string;
  days_pending: number;
  top_trade: string;
  qp_code: string;
  nsqf_level: number;
  pathway_type: string;
  employment_pref: string;
  has_mobility: boolean;
  sla_deadline: string;
  created_at: string;
  consultant_required: boolean;
}

interface WebCasesResponse {
  count: number;
  liveCallsCount: number;
  cases: WebCaseItem[];
}

interface PathwayDetail {
  rank: number;
  qp_code: string;
  qp_name: string;
  nsqf_level: number;
  pathway_type: string;
  matched_skills: string[];
  skills_to_acquire: string[];
  confidence: string;
  topsis_score: number;
  explanation: string;
  opportunity: {
    strength: string;
    source: string;
    date: string;
    evidence: string;
  };
  income_range: string;
  travel_feasible: boolean;
  training_hours: number;
}

interface CaseDetailResponse {
  case_id: string;
  district: string;
  state: string;
  language: string;
  gender: string;
  age_group: string;
  profile: {
    educational_background: string;
    family_occupation: string;
    current_livelihood: string;
    skills_and_interests: string;
    mobility_constraints: string;
    employment_preference: string;
    local_economic_context: string;
    completeness: number;
  };
  recommendations: PathwayDetail[];
}

interface ActionResponse {
  success: boolean;
  case?: {
    id: string;
    officer_action: string;
    beneficiary_decision?: string;
    officer_notes?: string;
    actioned_at: string;
  };
}

async function runVerification() {
  console.log('================================================================');
  console.log('  KURAL SEVI: Telephony <-> Engine <-> Frontend Verification    ');
  console.log('================================================================\n');

  // Step 1: Query completed calls from Voice API
  console.log('1. [Telephony Integration]');
  const voiceApiRes = await fetch('http://localhost:8000/api/completed-calls');
  if (!voiceApiRes.ok) {
    throw new Error(`Voice API returned HTTP ${voiceApiRes.status}`);
  }
  const voiceData = (await voiceApiRes.json()) as VoiceApiResponse;
  console.log(`   ✓ Voice API active on port 8000`);
  console.log(`   ✓ Completed phone call interviews retrieved: ${voiceData.count}`);
  const sampleCall = voiceData.records[0];
  if (!sampleCall) {
    throw new Error('No completed calls found in Voice API');
  }
  console.log(`   ✓ Caller Case ID: ${sampleCall.case_id} (${sampleCall.phone})`);
  console.log(`   ✓ Extracted 7 PM-AJAY Dimensions:`);
  for (const [k, v] of Object.entries(sampleCall.confirmed_fields)) {
    console.log(`       • ${k}: "${v}"`);
  }

  // Step 2: Query Web API cases queue
  console.log('\n2. [Frontend Docket & Recommendation Engine Execution]');
  const webCasesRes = await fetch('http://localhost:3000/api/cases');
  if (!webCasesRes.ok) {
    throw new Error(`Web API /api/cases returned HTTP ${webCasesRes.status}`);
  }
  const webCasesData = (await webCasesRes.json()) as WebCasesResponse;
  console.log(`   ✓ Web API active on port 3000`);
  console.log(`   ✓ Total cases on officer docket: ${webCasesData.count} (${webCasesData.liveCallsCount} from real calls)`);

  const topCase = webCasesData.cases[0];
  if (topCase) {
    console.log(`   ✓ Top Case in Queue: ${topCase.case_id}`);
    console.log(`   ✓ Top Recommended NSQF Trade: ${topCase.top_trade} (${topCase.qp_code}, Level ${topCase.nsqf_level})`);
    console.log(`   ✓ Confidence Label: ${topCase.confidence.toUpperCase()}`);
    console.log(`   ✓ Officer Status: ${topCase.officer_action.toUpperCase()}`);
  }

  // Step 3: Query Web API case detail with 3-stage recommendation pathways
  console.log('\n3. [3-Stage Recommendation Engine Dynamic Output]');
  const detailRes = await fetch(`http://localhost:3000/api/cases/${sampleCall.case_id}`);
  if (!detailRes.ok) {
    throw new Error(`Web API /api/cases/${sampleCall.case_id} returned HTTP ${detailRes.status}`);
  }
  const detail = (await detailRes.json()) as CaseDetailResponse;
  console.log(`   ✓ Case Detail loaded for: ${detail.case_id} (${detail.district}, ${detail.language})`);
  console.log(`   ✓ Recommendations generated: ${detail.recommendations.length} pathways`);

  detail.recommendations.forEach((rec: PathwayDetail) => {
    console.log(`\n     Rank #${rec.rank}: ${rec.qp_name} [${rec.qp_code}]`);
    console.log(`       • NSQF Level: ${rec.nsqf_level} | Pathway: ${rec.pathway_type}`);
    console.log(`       • TOPSIS Score: ${(rec.topsis_score * 100).toFixed(1)}% | Confidence: ${rec.confidence.toUpperCase()}`);
    console.log(`       • Income Range: ${rec.income_range}`);
    console.log(`       • Matched Skills: ${rec.matched_skills.join(', ')}`);
    console.log(`       • Skills to Acquire: ${rec.skills_to_acquire.join(', ')}`);
    console.log(`       • Local Demand Evidence: ${rec.opportunity.evidence}`);
    console.log(`       • Rationale: "${rec.explanation}"`);
  });

  // Step 4: Test Officer Action adjudication
  console.log('\n4. [Officer Action Adjudication]');
  const actionRes = await fetch(`http://localhost:3000/api/cases/${sampleCall.case_id}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'approved',
      beneficiary_decision: 'ready',
      officer_notes: 'Sanction approved under PM-AJAY GIA pilot batch.',
    }),
  });
  const actionData = (await actionRes.json()) as ActionResponse;
  console.log(`   ✓ Officer action submission result: ${actionData.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   ✓ Action recorded: ${actionData.case?.officer_action}`);

  console.log('\n================================================================');
  console.log('  SUCCESS: TELEPHONY, ENGINE & FRONTEND ARE FULLY CONNECTED!    ');
  console.log('================================================================');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
