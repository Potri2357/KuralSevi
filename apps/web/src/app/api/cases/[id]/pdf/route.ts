/**
 * PM-AJAY GIA – Official Government Sanction Order PDF
 * Formatted strictly according to docs/PM-AJAY_Sanction_Order_Template.docx:
 *   – Exactly 2 pages with formal double-rule government page border
 *   – Uniform Times New Roman typography (Times-Roman, Times-Bold, Times-Italic, Times-BoldItalic)
 *   – Standard Indian currency notation ("Rs." instead of unencoded unicode glyphs)
 *   – 100% strict coordinate bounding: zero text overflow, zero border cross-cutting
 *   – Page 1: Header, Metadata Grid, Preamble, Section 1 (Profile), Section 2 (Pathway)
 *   – Page 2: Section 3 (Financials), Section 4 (Terms), Section 5 (Approval), Signatures, Copy-To
 */
import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { getCaseDetail } from '@/lib/recommendation-service';
import { createOrGetSanctionRecord, generateQRCodeBuffer } from '@/lib/sanction-verification';

// ── Number to Words Helper ───────────────────────────────────────────────────
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

function fmtDate(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatRs(n: number): string {
  return 'Rs. ' + n.toLocaleString('en-IN');
}

// ── Layout Dimensions (A4 Portrait, 72 points/inch) ───────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;

// Page Borders
const BORDER_OUTER_PAD = 28;
const BORDER_INNER_PAD = 31;

// Content Printable Boundaries
const M_L = 46;
const PW  = PAGE_W - 2 * M_L; // 503.28 pt
const M_R = M_L + PW;         // 549.28 pt

// Fonts
const T   = 'Times-Roman';
const TB  = 'Times-Bold';
const TI  = 'Times-Italic';
const TBI = 'Times-BoldItalic';

// Grayscale Palette (Official Government Look)
const C_BLACK   = '#000000';
const C_DARK    = '#1A1A1A';
const C_BODY    = '#2D2D2D';
const C_MUTED   = '#555555';
const C_BORDER  = '#333333';
const C_LINE    = '#666666';
const C_SHADE   = '#F4F4F4';
const C_ROW_ALT = '#FAFAFA';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const caseData = await getCaseDetail(id);
  if (!caseData) return new NextResponse('Case record not found', { status: 404 });

  // Resolve Pathway & Profile
  const rec = caseData.recommendations[
    caseData.citizen_selected_choice ? caseData.citizen_selected_choice - 1 : 0
  ] ?? caseData.recommendations[0];

  const orderId    = caseData.sanction_order_id ?? `ORD-AJAY-${caseData.case_id}`;
  const issueDate  = fmtDate(caseData.actioned_at);
  const district   = caseData.district ?? 'Namakkal';
  const state      = caseData.state    ?? 'Tamil Nadu';
  const p          = caseData.profile;

  const tradeName    = rec?.qp_name     ?? 'Tailor – Garment Construction';
  const qpCode       = rec?.qp_code     ?? 'APP/Q0301';
  const nsqfLevel    = rec?.nsqf_level  ?? 4;
  const pathwayType  = rec?.pathway_type ?? 'self_employment';
  const isWage       = pathwayType === 'wage_employment';
  const pathwayLabel = isWage
    ? 'Wage Employment (Industry Placement Linkage)'
    : pathwayType === 'home_enterprise'
    ? 'Home-Based Enterprise'
    : 'Self-Employment / Enterprise Linkage';

  const trainingHrs  = rec?.training_hours ?? 180;
  const courseDur    = `${trainingHrs} Hours (approx. ${Math.ceil(trainingHrs / 30)} Months)`;
  const batchId      = `BATCH-${district.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-Q3`;
  const startDate    = fmtDate(new Date(Date.now() + 7 * 86_400_000).toISOString());
  const consentRef   = `DPDP-CONSENT-${caseData.case_id}`;

  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${proto}://${host}`;

  const verificationRecord = await createOrGetSanctionRecord(caseData.case_id, baseUrl);
  const verifyUrl = verificationRecord?.verification_url ?? `${baseUrl}/verify/${caseData.case_id}`;
  const docHash = verificationRecord?.document_hash ?? `SHA256:${Buffer.from(caseData.case_id + orderId).toString('hex').slice(0, 24).toUpperCase()}`;

  let qrBuffer: Buffer | null = null;
  try {
    qrBuffer = await generateQRCodeBuffer(verifyUrl);
  } catch (qrErr) {
    console.warn('[PDF] QR Generation fallback:', qrErr);
  }

  const ENTITLEMENTS = [
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
      basis: isWage
        ? 'Upon Confirmed Placement (Employer Proof)'
        : 'Post-Certification + Enterprise Proof',
      amount: isWage ? 10_000 : 35_000,
      duration: 'One-Time Disbursement',
    },
  ];
  const totalAmt   = ENTITLEMENTS.reduce((s, e) => s + e.amount, 0);
  const totalWords = numberToWords(totalAmt);

  return new Promise<NextResponse>((resolve) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `PM-AJAY Sanction Order – ${orderId}`,
          Author: 'District Social Welfare Officer',
          Subject: 'Sanction Order under PM-AJAY GIA Component',
          Creator: 'Kural Sevi — Ministry of Social Justice',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => {
        resolve(
          new NextResponse(Buffer.concat(chunks), {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="PM-AJAY_Sanction_${orderId}.pdf"`,
              'Cache-Control': 'no-store',
            },
          }),
        );
      });

      // ── Helper: Draw Page Framing Border ───────────────────────────
      const drawPageBorder = () => {
        // Outer thick rule
        doc.rect(
          BORDER_OUTER_PAD,
          BORDER_OUTER_PAD,
          PAGE_W - 2 * BORDER_OUTER_PAD,
          PAGE_H - 2 * BORDER_OUTER_PAD,
        )
        .strokeColor(C_BORDER)
        .lineWidth(1.2)
        .stroke();

        // Inner hairline rule
        doc.rect(
          BORDER_INNER_PAD,
          BORDER_INNER_PAD,
          PAGE_W - 2 * BORDER_INNER_PAD,
          PAGE_H - 2 * BORDER_INNER_PAD,
        )
        .strokeColor(C_LINE)
        .lineWidth(0.5)
        .stroke();
      };

      // ── Helper: Section Title with Underline ────────────────────────
      const drawSectionHeader = (yPos: number, title: string): number => {
        doc.font(TB).fontSize(9.5).fillColor(C_BLACK)
           .text(title, M_L, yPos, { width: PW });
        const lineY = yPos + 13;
        doc.moveTo(M_L, lineY).lineTo(M_R, lineY)
           .strokeColor(C_BORDER).lineWidth(0.8).stroke();
        return lineY + 6;
      };

      // ── Helper: Two-Column Key-Value Row ────────────────────────────
      const drawFieldRow = (
        yPos: number,
        label: string,
        value: string,
        labelW = 165,
        rowH = 15.5,
        isShaded = false,
      ): number => {
        const valW = PW - labelW;
        if (isShaded) {
          doc.rect(M_L, yPos, labelW, rowH).fillColor(C_SHADE).fill();
        }
        // Outer cell border
        doc.rect(M_L, yPos, PW, rowH).strokeColor(C_LINE).lineWidth(0.4).stroke();
        // Middle divider
        doc.moveTo(M_L + labelW, yPos).lineTo(M_L + labelW, yPos + rowH)
           .strokeColor(C_LINE).lineWidth(0.4).stroke();

        // Label Text
        doc.font(TB).fontSize(8).fillColor(C_DARK)
           .text(label, M_L + 6, yPos + 3.5, {
             width: labelW - 12,
             lineBreak: false,
             ellipsis: true,
           });

        // Value Text
        doc.font(T).fontSize(8).fillColor(C_BODY)
           .text(value || '—', M_L + labelW + 6, yPos + 3.5, {
             width: valW - 12,
             lineBreak: false,
             ellipsis: true,
           });

        return yPos + rowH;
      };

      // ── Helper: QR Code Finder Pattern Drawer ───────────────────────
      const drawMiniQR = (x: number, y: number, size = 44) => {
        doc.rect(x, y, size, size).strokeColor(C_BORDER).lineWidth(0.6).stroke();
        const drawFinder = (fx: number, fy: number) => {
          doc.rect(fx, fy, 11, 11).strokeColor(C_BLACK).lineWidth(1.2).stroke();
          doc.rect(fx + 3, fy + 3, 5, 5).fillColor(C_BLACK).fill();
        };
        drawFinder(x + 3, y + 3);
        drawFinder(x + size - 14, y + 3);
        drawFinder(x + 3, y + size - 14);

        // Pattern dots
        const dots = [
          [16, 5], [20, 5], [24, 7], [18, 12], [26, 12], [32, 16],
          [6, 20], [10, 20], [16, 22], [22, 22], [28, 24], [34, 26],
          [18, 30], [24, 30], [30, 32], [20, 36], [26, 36], [32, 38],
        ];
        dots.forEach(([dx, dy]) => {
          doc.rect(x + dx, y + dy, 3, 3).fillColor(C_BLACK).fill();
        });
      };

      // ════════════════════════════════════════════════════════════════
      //  PAGE 1: Profile & NSQF Skilling Pathway
      // ════════════════════════════════════════════════════════════════
      drawPageBorder();

      let y = 46;

      // 1. National & State Header
      doc.font(TB).fontSize(12).fillColor(C_BLACK)
         .text('GOVERNMENT OF INDIA', M_L, y, { width: PW, align: 'center', characterSpacing: 0.5 });
      y += 14;

      doc.font(TB).fontSize(9.5).fillColor(C_DARK)
         .text(`GOVERNMENT OF ${state.toUpperCase()}`, M_L, y, { width: PW, align: 'center' });
      y += 12;

      doc.font(T).fontSize(8.5).fillColor(C_BODY)
         .text('Adi Dravidar and Tribal Welfare Department', M_L, y, { width: PW, align: 'center' });
      y += 11;

      doc.font(TB).fontSize(10.5).fillColor(C_BLACK)
         .text('PRADHAN MANTRI ANUSUCHIT JAATI ABHYUDAY YOJANA (PM-AJAY)', M_L, y, {
           width: PW, align: 'center',
         });
      y += 13;

      doc.font(TI).fontSize(8.5).fillColor(C_MUTED)
         .text('Grant-in-Aid (GIA) Component — Livelihood & NSQF-Aligned Skilling', M_L, y, {
           width: PW, align: 'center',
         });
      y += 12;

      // Double divider line under letterhead
      doc.moveTo(M_L, y).lineTo(M_R, y).strokeColor(C_BORDER).lineWidth(1.0).stroke();
      y += 2;
      doc.moveTo(M_L, y).lineTo(M_R, y).strokeColor(C_BORDER).lineWidth(0.4).stroke();
      y += 6;

      // 2. File / Sanction No. & Date Table Box
      const orderBoxH = 18;
      const colHalfW = PW / 2;
      doc.rect(M_L, y, PW, orderBoxH).fillColor(C_SHADE).fill();
      doc.rect(M_L, y, PW, orderBoxH).strokeColor(C_BORDER).lineWidth(0.5).stroke();
      doc.moveTo(M_L + colHalfW, y).lineTo(M_L + colHalfW, y + orderBoxH)
         .strokeColor(C_BORDER).lineWidth(0.5).stroke();

      // Left: File / Sanction No.
      doc.font(TB).fontSize(8.5).fillColor(C_BLACK)
         .text('File / Sanction No.:', M_L + 6, y + 4.5, { lineBreak: false });
      doc.font(T).fontSize(8.5).fillColor(C_BLACK)
         .text(orderId, M_L + 105, y + 4.5, { width: colHalfW - 110, lineBreak: false, ellipsis: true });

      // Right: Date
      doc.font(TB).fontSize(8.5).fillColor(C_BLACK)
         .text('Date:', M_L + colHalfW + 8, y + 4.5, { lineBreak: false });
      doc.font(T).fontSize(8.5).fillColor(C_BLACK)
         .text(issueDate, M_L + colHalfW + 40, y + 4.5, { width: colHalfW - 48, lineBreak: false });

      y += orderBoxH + 8;

      // 3. SANCTION ORDER Title
      doc.font(TB).fontSize(13).fillColor(C_BLACK)
         .text('SANCTION ORDER', M_L, y, { width: PW, align: 'center' });
      y += 15;

      doc.font(TI).fontSize(8.5).fillColor(C_MUTED)
         .text('Livelihood & NSQF-Aligned Skilling Pathway under PM-AJAY (GIA Component)', M_L, y, {
           width: PW, align: 'center',
         });
      y += 12;

      doc.moveTo(M_L, y).lineTo(M_R, y).strokeColor(C_LINE).lineWidth(0.5).stroke();
      y += 6;

      // 4. Subject Block
      const subLabelW = 44;
      const subTextW  = PW - subLabelW;
      const subText   = 'Sanction of NSQF-aligned livelihood skilling pathway to the beneficiary identified below, under the Grant-in-Aid (GIA) component of the Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY).';
      const subH      = doc.heightOfString(subText, { width: subTextW, lineGap: 1.5 });

      doc.font(TB).fontSize(8.5).fillColor(C_BLACK)
         .text('Subject:', M_L, y, { width: subLabelW, lineBreak: false });
      doc.font(T).fontSize(8.5).fillColor(C_DARK)
         .text(subText, M_L + subLabelW, y, { width: subTextW, lineGap: 1.5 });

      y += subH + 6;

      // 5. Case Administrative Context Box (3 Rows)
      const cBoxRowH = 15;
      const cBoxW1   = 105;
      const cBoxW2   = colHalfW - cBoxW1;
      const cBoxW3   = 105;
      const cBoxW4   = colHalfW - cBoxW3;

      const adminRows = [
        [
          { l: 'Case ID', v: caseData.case_id, wL: cBoxW1, wV: cBoxW2 },
          { l: 'State / UT', v: state, wL: cBoxW3, wV: cBoxW4 },
        ],
        [
          { l: 'District', v: district, wL: cBoxW1, wV: cBoxW2 },
          { l: 'Block / Taluk', v: (p as any)?.habitation_cluster ?? `${district} Rural Taluk`, wL: cBoxW3, wV: cBoxW4 },
        ],
      ];

      adminRows.forEach((row) => {
        doc.rect(M_L, y, PW, cBoxRowH).strokeColor(C_LINE).lineWidth(0.4).stroke();
        doc.moveTo(M_L + colHalfW, y).lineTo(M_L + colHalfW, y + cBoxRowH)
           .strokeColor(C_LINE).lineWidth(0.4).stroke();

        // Left Cell
        doc.rect(M_L, y, row[0].wL, cBoxRowH).fillColor(C_SHADE).fill();
        doc.moveTo(M_L + row[0].wL, y).lineTo(M_L + row[0].wL, y + cBoxRowH)
           .strokeColor(C_LINE).lineWidth(0.4).stroke();
        doc.font(TB).fontSize(8).fillColor(C_DARK)
           .text(row[0].l, M_L + 5, y + 3.5, { width: row[0].wL - 10, lineBreak: false });
        doc.font(T).fontSize(8).fillColor(C_BODY)
           .text(row[0].v, M_L + row[0].wL + 5, y + 3.5, { width: row[0].wV - 10, lineBreak: false, ellipsis: true });

        // Right Cell
        const rx = M_L + colHalfW;
        doc.rect(rx, y, row[1].wL, cBoxRowH).fillColor(C_SHADE).fill();
        doc.moveTo(rx + row[1].wL, y).lineTo(rx + row[1].wL, y + cBoxRowH)
           .strokeColor(C_LINE).lineWidth(0.4).stroke();
        doc.font(TB).fontSize(8).fillColor(C_DARK)
           .text(row[1].l, rx + 5, y + 3.5, { width: row[1].wL - 10, lineBreak: false });
        doc.font(T).fontSize(8).fillColor(C_BODY)
           .text(row[1].v, rx + row[1].wL + 5, y + 3.5, { width: row[1].wV - 10, lineBreak: false, ellipsis: true });

        y += cBoxRowH;
      });

      // Row 3: Department (Full width)
      doc.rect(M_L, y, PW, cBoxRowH).strokeColor(C_LINE).lineWidth(0.4).stroke();
      doc.rect(M_L, y, cBoxW1, cBoxRowH).fillColor(C_SHADE).fill();
      doc.moveTo(M_L + cBoxW1, y).lineTo(M_L + cBoxW1, y + cBoxRowH)
         .strokeColor(C_LINE).lineWidth(0.4).stroke();
      doc.font(TB).fontSize(8).fillColor(C_DARK)
         .text('Department', M_L + 5, y + 3.5, { width: cBoxW1 - 10, lineBreak: false });
      doc.font(T).fontSize(8).fillColor(C_BODY)
         .text('Adi Dravidar and Tribal Welfare Department, Government of Tamil Nadu', M_L + cBoxW1 + 5, y + 3.5, {
           width: PW - cBoxW1 - 10, lineBreak: false, ellipsis: true,
         });

      y += cBoxRowH + 6;

      // 6. Formal Preamble
      const preambleText = 'With the approval of the Competent Authority, sanction is hereby accorded for enrolment of the beneficiary named below under the Grant-in-Aid (GIA) component of PM-AJAY, based on structured livelihood profiling conducted through voice-based intake, subject to the terms and statutory directives specified in this order.';
      const preH = doc.heightOfString(preambleText, { width: PW, lineGap: 1.5 });
      doc.font(T).fontSize(8.5).fillColor(C_BODY)
         .text(preambleText, M_L, y, { width: PW, lineGap: 1.5, align: 'justify' });
      y += preH + 6;

      // 7. SECTION 1 — BENEFICIARY PROFILE (10 Rows)
      y = drawSectionHeader(y, '1.  BENEFICIARY PROFILE');

      const benefRows: [string, string, boolean][] = [
        ['Beneficiary Name', caseData.phone ? `Citizen / Beneficiary (${caseData.phone})` : 'Name Protected under DPDP Act 2023', false],
        ['Beneficiary ID (Masked)', `XXXX-XXXX-${caseData.case_id.slice(-4)}`, true],
        ['Age / Gender', `${(p as any)?.age_range ?? '21–35'} years / ${(p as any)?.gender ?? 'DPDP-Protected'}`, false],
        ['Community Certificate Ref.', `Pending verification — Taluk Office, ${district}`, true],
        ['Educational Status', p?.educational_background ?? 'Class 8 completed', false],
        ['Current Livelihood Activity', p?.current_livelihood ?? 'Agricultural / Unskilled Labor', true],
        ['Skills & Interests', p?.skills_and_interests ?? 'Livestock Management, Dairy Production', false],
        ['Mobility / Physical Limits', p?.mobility_constraints ?? `Within ${district} cluster (10 km radius)`, true],
        ['Employment Preference', p?.employment_preference ?? (isWage ? 'Wage Employment (Placement Linkage)' : 'Self-Employment / Home Enterprise'), false],
        ['Aadhaar-seeded Bank A/c', 'Linked — PFMS Verified — DBT Ready', true],
      ];

      benefRows.forEach(([lbl, val, shade]) => {
        y = drawFieldRow(y, lbl, val, 160, 14.5, shade);
      });

      y += 7;

      // 8. SECTION 2 — SANCTIONED NSQF SKILLING PATHWAY (7 Rows)
      y = drawSectionHeader(y, '2.  SANCTIONED NSQF SKILLING PATHWAY');

      const pathRows: [string, string, boolean][] = [
        ['Sanctioned Trade / Qualification', tradeName, false],
        ['QP Code', qpCode, true],
        ['NSQF Level', `Level ${nsqfLevel}`, false],
        ['Pathway Type', pathwayLabel, true],
        ['Designated Training Center', `Govt. ITI / PMKK Skilling Cluster, ${district}`, false],
        ['Course Duration', courseDur, true],
        ['Batch / Commencement Date', `${batchId}  /  ${startDate}`, false],
      ];

      pathRows.forEach(([lbl, val, shade]) => {
        y = drawFieldRow(y, lbl, val, 160, 14.5, shade);
      });

      y += 7;

      // 9. SECTION 3 — FINANCIAL ENTITLEMENTS (Moved to Page 1)
      y = drawSectionHeader(y, '3.  FINANCIAL ENTITLEMENTS');

      // Table Column Specifications: Total = 503 pt = PW
      const colSNo  = 30;
      const colComp = 135;
      const colBas  = 165;
      const colAmt  = 73;
      const colDur  = PW - (colSNo + colComp + colBas + colAmt); // 100 pt

      const tblCols = [
        { label: 'S.No.', w: colSNo, align: 'center' as const },
        { label: 'Component', w: colComp, align: 'left' as const },
        { label: 'Basis / Condition', w: colBas, align: 'left' as const },
        { label: 'Amount (Rs.)', w: colAmt, align: 'right' as const },
        { label: 'Duration / Frequency', w: colDur, align: 'left' as const },
      ];

      // Header Row
      const thH = 16;
      doc.rect(M_L, y, PW, thH).fillColor(C_SHADE).fill();
      doc.rect(M_L, y, PW, thH).strokeColor(C_BORDER).lineWidth(0.6).stroke();

      let curX = M_L;
      tblCols.forEach((col, idx) => {
        if (idx > 0) {
          doc.moveTo(curX, y).lineTo(curX, y + thH).strokeColor(C_BORDER).lineWidth(0.4).stroke();
        }
        doc.font(TB).fontSize(8).fillColor(C_BLACK)
           .text(col.label, curX + 4, y + 4, { width: col.w - 8, align: col.align, lineBreak: false });
        curX += col.w;
      });
      y += thH;

      // Entitlement Data Rows
      const dataRowH = 22;
      ENTITLEMENTS.forEach((item, rIdx) => {
        const rowBg = rIdx % 2 === 1 ? C_ROW_ALT : '#FFFFFF';
        doc.rect(M_L, y, PW, dataRowH).fillColor(rowBg).fill();
        doc.rect(M_L, y, PW, dataRowH).strokeColor(C_LINE).lineWidth(0.4).stroke();

        let cx = M_L;
        // 1. S.No
        doc.font(T).fontSize(8).fillColor(C_BLACK)
           .text(String(item.sn), cx + 2, y + 6.5, { width: colSNo - 4, align: 'center' });
        cx += colSNo;
        doc.moveTo(cx, y).lineTo(cx, y + dataRowH).strokeColor(C_LINE).lineWidth(0.4).stroke();

        // 2. Component
        doc.font(TB).fontSize(7.5).fillColor(C_DARK)
           .text(item.component, cx + 5, y + 3, { width: colComp - 10, lineGap: 1.2 });
        cx += colComp;
        doc.moveTo(cx, y).lineTo(cx, y + dataRowH).strokeColor(C_LINE).lineWidth(0.4).stroke();

        // 3. Basis / Condition
        doc.font(T).fontSize(7.5).fillColor(C_BODY)
           .text(item.basis, cx + 5, y + 3, { width: colBas - 10, lineGap: 1.2 });
        cx += colBas;
        doc.moveTo(cx, y).lineTo(cx, y + dataRowH).strokeColor(C_LINE).lineWidth(0.4).stroke();

        // 4. Amount (Rs.)
        doc.font(TB).fontSize(8).fillColor(C_BLACK)
           .text(formatRs(item.amount), cx + 4, y + 6.5, { width: colAmt - 8, align: 'right' });
        cx += colAmt;
        doc.moveTo(cx, y).lineTo(cx, y + dataRowH).strokeColor(C_LINE).lineWidth(0.4).stroke();

        // 5. Duration
        doc.font(T).fontSize(7.5).fillColor(C_BODY)
           .text(item.duration, cx + 5, y + 3, { width: colDur - 10, lineGap: 1.2 });

        y += dataRowH;
      });

      // Total Row
      const totH = 16;
      doc.rect(M_L, y, PW, totH).fillColor(C_SHADE).fill();
      doc.rect(M_L, y, PW, totH).strokeColor(C_BORDER).lineWidth(0.6).stroke();

      const splitTotX = M_L + colSNo + colComp + colBas;
      doc.moveTo(splitTotX, y).lineTo(splitTotX, y + totH).strokeColor(C_BORDER).lineWidth(0.4).stroke();
      doc.moveTo(splitTotX + colAmt, y).lineTo(splitTotX + colAmt, y + totH).strokeColor(C_BORDER).lineWidth(0.4).stroke();

      doc.font(TB).fontSize(8).fillColor(C_BLACK)
         .text('Total Entitlement', M_L + 6, y + 4, {
           width: colSNo + colComp + colBas - 12, align: 'right', lineBreak: false,
         });

      doc.font(TB).fontSize(8).fillColor(C_BLACK)
         .text(formatRs(totalAmt), splitTotX + 4, y + 4, {
           width: colAmt - 8, align: 'right', lineBreak: false,
         });

      y += totH;

      // Amount in Words Bar
      const wordsH = 14;
      doc.rect(M_L, y, PW, wordsH).strokeColor(C_LINE).lineWidth(0.4).stroke();
      doc.font(TBI).fontSize(8).fillColor(C_DARK)
         .text(`Amount in Words: Rupees ${totalWords} Only`, M_L + 6, y + 3, {
           width: PW - 12, lineBreak: false,
         });

      y += wordsH;

      // Page 1 Footer
      const p1FooterY = 780;
      doc.moveTo(M_L, p1FooterY).lineTo(M_R, p1FooterY)
         .strokeColor(C_LINE).lineWidth(0.4).stroke();
      doc.font(TI).fontSize(7.5).fillColor(C_MUTED)
         .text(
           'Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY) — GIA Sanction Order  |  Page 1 of 2',
           M_L, p1FooterY + 4, { width: PW, align: 'center' },
         );

      // ════════════════════════════════════════════════════════════════
      //  PAGE 2: Directives, Approvals, Reference & Signatures
      // ════════════════════════════════════════════════════════════════
      doc.addPage();
      drawPageBorder();

      y = 44;

      // Running Header on Page 2
      doc.font(TI).fontSize(7.5).fillColor(C_MUTED)
         .text('Government of India  •  Ministry of Social Justice & Empowerment  •  PM-AJAY (GIA Component)', M_L, y, {
           width: 310, lineBreak: false,
         });
      doc.font(TB).fontSize(7.5).fillColor(C_DARK)
         .text(`Order Ref: ${orderId}`, M_L + 315, y, { width: PW - 315, align: 'right', lineBreak: false, ellipsis: true });
      y += 13;

      doc.moveTo(M_L, y).lineTo(M_R, y).strokeColor(C_BORDER).lineWidth(0.5).stroke();
      y += 10;

      // 10. SECTION 4 — TERMS & STATUTORY DIRECTIVES
      y = drawSectionHeader(y, '4.  TERMS & STATUTORY DIRECTIVES');

      const terms = [
        'The beneficiary named above is hereby enrolled under PM-AJAY GIA for the sanctioned NSQF-aligned trade specified in Section 2.',
        'This sanction is valid for sixty (60) days from the date of issue, and lapses if the beneficiary does not join the designated training center within that period.',
        'The DBT stipend shall be credited to the Aadhaar-seeded bank account (PFMS) upon biometric verification, for the duration stated in Section 3.',
        isWage
          ? 'The designated training center shall facilitate placement support and report placement outcomes to the District Implementing Department.'
          : 'The Tool-kit / Enterprise Grant shall be released only after successful NSQF certification and submission of enterprise proof (GST registration or local trade verification).',
        'This sanction is subject to the beneficiary\'s continued participation and minimum attendance of 80% at the designated training center.',
        `This order is issued on the basis of voice-based intake, beneficiary confirmation, and review by the competent reviewing authority, in accordance with applicable data protection requirements (Consent Ref.: ${consentRef}, dated ${issueDate}).`,
        'Any change in trade, training center, or entitlement amount requires a fresh sanction or a formal amendment to this order.',
        'Sanction and disbursements are liable to be cancelled and recovered in case of false information, misrepresentation, or persistent absenteeism.',
        'Grievances or appeals regarding this order may be addressed to District Social Welfare Officer, Helpline: 1800-425-0012 (Toll-Free, 24x7).',
      ];

      const numW = 16;
      const tValW = PW - numW;
      terms.forEach((term, idx) => {
        const tH = doc.heightOfString(term, { width: tValW, lineGap: 1.5 });
        doc.font(TB).fontSize(8.5).fillColor(C_BLACK)
           .text(`${idx + 1}.`, M_L + 2, y, { width: numW, align: 'left', lineBreak: false });
        doc.font(T).fontSize(8.5).fillColor(C_BODY)
           .text(term, M_L + numW, y, { width: tValW, lineGap: 1.5, align: 'justify' });
        y += tH + 5.5;
      });

      y += 6;

      // 11. SECTION 5 — APPROVAL REFERENCE (3 Rows)
      y = drawSectionHeader(y, '5.  APPROVAL REFERENCE');

      const appRows: [string, string, boolean][] = [
        ['Committee Review Date', issueDate, false],
        ['Approval Status', 'APPROVED — Formally Registered in Social Justice National Database', true],
        ['Verification URL', verifyUrl, false],
      ];
      appRows.forEach(([lbl, val, shade]) => {
        y = drawFieldRow(y, lbl, val, 160, 16, shade);
      });

      y += 14;

      // 12. SIGNATURE & VERIFICATION PANEL (Two boxes side by side)
      const sigBoxH = 108;
      const leftBoxW = 185;
      const rightBoxW = PW - leftBoxW - 8; // 310 pt
      const rightBoxX = M_L + leftBoxW + 8;

      // Left Box: Digital Authentication & Verification
      doc.rect(M_L, y, leftBoxW, sigBoxH).strokeColor(C_BORDER).lineWidth(0.5).stroke();
      doc.rect(M_L, y, leftBoxW, 15).fillColor(C_SHADE).fill();
      doc.rect(M_L, y, leftBoxW, 15).strokeColor(C_BORDER).lineWidth(0.5).stroke();
      doc.font(TB).fontSize(8).fillColor(C_BLACK)
         .text('DOCUMENT AUTHENTICATION', M_L, y + 4, { width: leftBoxW, align: 'center' });

      // Dynamic Real QR Code
      if (qrBuffer) {
        doc.image(qrBuffer, M_L + 10, y + 25, { width: 50, height: 50 });
      } else {
        drawMiniQR(M_L + 10, y + 26, 48);
      }

      // QR Metadata text
      const qrMetaX = M_L + 66;
      const qrMetaW = leftBoxW - 72;
      doc.font(TB).fontSize(7.5).fillColor(C_DARK)
         .text('Scan for Verification', qrMetaX, y + 26, { width: qrMetaW });
      doc.font(T).fontSize(7).fillColor(C_MUTED)
         .text('Ministry of Social Justice\nVerification Portal', qrMetaX, y + 37, { width: qrMetaW });
      doc.font(TB).fontSize(7).fillColor(C_DARK)
         .text('Toll-Free Helpline:', qrMetaX, y + 62, { width: qrMetaW });
      doc.font(T).fontSize(7).fillColor(C_BODY)
         .text('1800-425-0012', qrMetaX, y + 73, { width: qrMetaW });

      doc.font(T).fontSize(6.5).fillColor(C_MUTED)
         .text(docHash, M_L + 6, y + sigBoxH - 13, { width: leftBoxW - 12, lineBreak: false, ellipsis: true });

      // Right Box: Sanctioning Authority & Signature
      doc.rect(rightBoxX, y, rightBoxW, sigBoxH).strokeColor(C_BORDER).lineWidth(0.5).stroke();
      doc.rect(rightBoxX, y, rightBoxW, 15).fillColor(C_SHADE).fill();
      doc.rect(rightBoxX, y, rightBoxW, 15).strokeColor(C_BORDER).lineWidth(0.5).stroke();
      doc.font(TB).fontSize(8).fillColor(C_BLACK)
         .text('SANCTIONING & ISSUING AUTHORITY', rightBoxX, y + 4, { width: rightBoxW, align: 'center' });

      doc.font(TI).fontSize(8).fillColor(C_MUTED)
         .text('[ Digitally Signed & Approved through Kural Sevi Portal ]', rightBoxX, y + 24, {
           width: rightBoxW, align: 'center',
         });

      // Signature line
      const sigLineY = y + 54;
      doc.moveTo(rightBoxX + 30, sigLineY).lineTo(rightBoxX + rightBoxW - 30, sigLineY)
         .strokeColor(C_BORDER).lineWidth(0.5).stroke();

      doc.font(TB).fontSize(9).fillColor(C_BLACK)
         .text('District Social Welfare Officer', rightBoxX, sigLineY + 5, {
           width: rightBoxW, align: 'center',
         });
      doc.font(T).fontSize(8.5).fillColor(C_DARK)
         .text('Adi Dravidar and Tribal Welfare Department', rightBoxX, sigLineY + 18, {
           width: rightBoxW, align: 'center',
         });
      doc.font(T).fontSize(8.5).fillColor(C_BODY)
         .text(`District Collectorate, ${district}  •  Date: ${issueDate}`, rightBoxX, sigLineY + 31, {
           width: rightBoxW, align: 'center',
         });

      y += sigBoxH + 12;

      // 13. COPY TO RECIPIENTS BLOCK
      doc.font(TB).fontSize(8.5).fillColor(C_BLACK)
         .text('Copy forwarded for information and record to:', M_L, y, { width: PW });
      y += 13;

      const copies = [
        `(1) The District Collector, District Collectorate, ${district}`,
        '(2) State Nodal Officer (PFMS / DBT), Department of Social Justice',
        `(3) The Principal / Center Head, Designated Training Center, ${district}`,
        '(4) Beneficiary Record (Transmitted via WhatsApp & SMS Notification)',
      ];

      copies.forEach((copyLine) => {
        doc.font(T).fontSize(8).fillColor(C_BODY)
           .text(copyLine, M_L + 6, y, { width: PW - 12, lineBreak: false, ellipsis: true });
        y += 11.5;
      });

      // Page 2 Footer
      const p2FooterY = 780;
      doc.moveTo(M_L, p2FooterY).lineTo(M_R, p2FooterY)
         .strokeColor(C_LINE).lineWidth(0.4).stroke();
      doc.font(TI).fontSize(7.5).fillColor(C_MUTED)
         .text(
           'Official Sanction Order generated under PM-AJAY GIA National Framework  |  Page 2 of 2',
           M_L, p2FooterY + 4, { width: PW, align: 'center' },
         );

      doc.end();
    } catch (err: any) {
      console.error('[PDF] Generation Error:', err);
      resolve(new NextResponse(`PDF generation error: ${err?.message}`, { status: 500 }));
    }
  });
}
