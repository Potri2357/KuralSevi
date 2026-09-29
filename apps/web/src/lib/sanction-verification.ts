import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { getCaseDetail } from './recommendation-service';
import { createServerClient } from './supabase';

export interface SanctionVerificationRecord {
  sanction_order_id: string;
  case_id: string;
  beneficiary_name_masked: string;
  phone_masked: string;
  phone: string;
  state: string;
  district: string;
  block_village: string;
  department: string;
  trade_name: string;
  qp_code: string;
  nsqf_level: number;
  pathway_type: string;
  training_center: string;
  course_duration: string;
  batch_id: string;
  commencement_date: string;
  entitlements: Array<{
    sn: number;
    component: string;
    basis: string;
    amount: number;
    duration: string;
  }>;
  total_entitlement: number;
  total_in_words: string;
  officer_name: string;
  officer_designation: string;
  officer_department: string;
  officer_office: string;
  issue_date: string;
  document_hash: string;
  verification_url: string;
  status: 'VERIFIED_ACTIVE' | 'SUPERSEDED' | 'REVOKED';
  created_at: string;
  scan_count: number;
  last_scanned_at?: string;
}

function getVerificationStorePath(): string {
  return path.join(process.cwd(), 'data', 'sanction_verifications.json');
}

function loadLocalVerifications(): Record<string, SanctionVerificationRecord> {
  const filePath = getVerificationStorePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Verification] Failed to read store:', err);
  }
  return {};
}

function saveLocalVerification(record: SanctionVerificationRecord) {
  const filePath = getVerificationStorePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const store = loadLocalVerifications();
    store[record.case_id] = record;
    store[record.sanction_order_id] = record;
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Verification] Failed to save local record:', err);
  }
}

function numberToWords(n: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numberToWords(n % 100) : '');
  if (n < 100_000) return numberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  if (n < 10_000_000) return numberToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numberToWords(n % 100000) : '');
  return numberToWords(Math.floor(n / 10_000_000)) + ' Crore' + (n % 10_000_000 ? ' ' + numberToWords(n % 10_000_000) : '');
}

/**
 * Creates or retrieves the sanction verification record for a given case.
 * Computes deterministic cryptographic hash and stores in both DB and local store.
 */
export async function createOrGetSanctionRecord(
  caseId: string,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): Promise<SanctionVerificationRecord | null> {
  const store = loadLocalVerifications();
  if (store[caseId]) {
    return store[caseId];
  }

  const caseData = await getCaseDetail(caseId);
  if (!caseData) return null;

  const rec = caseData.recommendations[
    caseData.citizen_selected_choice ? caseData.citizen_selected_choice - 1 : 0
  ] ?? caseData.recommendations[0];

  const orderId = caseData.sanction_order_id ?? `ORD-AJAY-${caseData.case_id}`;
  const district = caseData.district ?? 'Namakkal';
  const state = caseData.state ?? 'Tamil Nadu';
  const p = caseData.profile;

  const isWage = rec?.pathway_type === 'wage_employment';
  const pathwayLabel = isWage
    ? 'Wage Employment (Industry Placement Linkage)'
    : rec?.pathway_type === 'home_enterprise'
    ? 'Home-Based Enterprise'
    : 'Self-Employment / Enterprise Linkage';

  const tradeName = rec?.qp_name ?? 'Tailor – Garment Construction';
  const qpCode = rec?.qp_code ?? 'APP/Q0301';
  const nsqfLevel = rec?.nsqf_level ?? 4;
  const trainingHrs = rec?.training_hours ?? 180;
  const courseDur = `${trainingHrs} Hours (approx. ${Math.ceil(trainingHrs / 30)} Months)`;
  const batchId = `BATCH-${district.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-Q3`;
  const startDate = new Date(Date.now() + 7 * 86_400_000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const issueDate = new Date(caseData.actioned_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const entitlements = [
    {
      sn: 1,
      component: 'NSQF Training & Assessment Fee',
      basis: '100% Govt. Sponsored — Centrally Funded',
      amount: 12_000,
      duration: 'Full Course Duration',
    },
    {
      sn: 2,
      component: 'DBT Monthly Training Stipend',
      basis: 'Aadhaar-linked PFMS Credit — Biometric Verified',
      amount: 3_000,
      duration: 'Per Month, During Training',
    },
    {
      sn: 3,
      component: isWage ? 'Placement Support Allowance' : 'Tool-Kit / Enterprise Seed Grant',
      basis: isWage ? 'Upon Confirmed Placement (Employer Proof)' : 'Post-Certification + Enterprise Proof',
      amount: isWage ? 10_000 : 35_000,
      duration: 'One-Time Disbursement',
    },
  ];

  const totalEntitlement = entitlements.reduce((s, e) => s + e.amount, 0);
  const totalWords = numberToWords(totalEntitlement);

  // Deterministic Cryptographic SHA-256 Hash
  const hashPayload = `${orderId}|${caseData.case_id}|${tradeName}|${qpCode}|${totalEntitlement}|${issueDate}`;
  const documentHash = crypto.createHash('sha256').update(hashPayload).digest('hex').toUpperCase();

  const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${caseData.case_id}`;

  const maskedPhone = caseData.phone
    ? `${caseData.phone.slice(0, 2)}XXXXXX${caseData.phone.slice(-2)}`
    : 'XXXXXX0000';

  const record: SanctionVerificationRecord = {
    sanction_order_id: orderId,
    case_id: caseData.case_id,
    beneficiary_name_masked: caseData.phone
      ? `Citizen (${maskedPhone})`
      : 'Beneficiary (DPDP Protected)',
    phone_masked: maskedPhone,
    phone: caseData.phone || '',
    state,
    district,
    block_village: (p as any)?.habitation_cluster ?? `${district} Rural Taluk`,
    department: 'Adi Dravidar and Tribal Welfare Department',
    trade_name: tradeName,
    qp_code: qpCode,
    nsqf_level: nsqfLevel,
    pathway_type: pathwayLabel,
    training_center: `Govt. ITI / PMKK Skilling Cluster, ${district}`,
    course_duration: courseDur,
    batch_id: batchId,
    commencement_date: startDate,
    entitlements,
    total_entitlement: totalEntitlement,
    total_in_words: totalWords,
    officer_name: 'District Social Welfare Officer',
    officer_designation: 'District Social Welfare Officer',
    officer_department: 'Adi Dravidar and Tribal Welfare Department',
    officer_office: `District Collectorate, ${district}`,
    issue_date: issueDate,
    document_hash: `SHA256:${documentHash.slice(0, 32)}`,
    verification_url: verificationUrl,
    status: 'VERIFIED_ACTIVE',
    created_at: new Date().toISOString(),
    scan_count: 0,
  };

  // 1. Save locally
  saveLocalVerification(record);

  // 2. Attempt Supabase sync
  try {
    const supabase = createServerClient();
    await supabase.from('sanction_orders').upsert({
      case_id: record.case_id,
      sanction_order_id: record.sanction_order_id,
      trade_name: record.trade_name,
      total_entitlement: record.total_entitlement,
      document_hash: record.document_hash,
      status: record.status,
      created_at: record.created_at,
    });
  } catch (dbErr) {
    console.warn('[Verification] Supabase sync notice:', dbErr);
  }

  return record;
}

/**
 * Retrieves the verification record by case ID or Sanction Order ID.
 * Increments the scan counter.
 */
export async function getSanctionVerification(
  idOrCaseId: string
): Promise<SanctionVerificationRecord | null> {
  const store = loadLocalVerifications();
  let record = store[idOrCaseId];

  // If not found, attempt to generate/retrieve from case detail
  if (!record) {
    record = (await createOrGetSanctionRecord(idOrCaseId)) as any;
  }

  if (record) {
    record.scan_count = (record.scan_count || 0) + 1;
    record.last_scanned_at = new Date().toISOString();
    saveLocalVerification(record);
  }

  return record || null;
}

/**
 * Generates high-resolution PNG QR Code buffer for PDF embedding.
 */
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'M',
    type: 'png',
    margin: 1,
    width: 256,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}
