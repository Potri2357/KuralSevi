import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await request.json();
  const { action, beneficiary_decision, modified_recommendation, officer_notes } = body;

  if (!['approved', 'modified', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Resilient local persistence
  try {
    const { saveOfficerAction } = await import('@/lib/recommendation-service');
    saveOfficerAction({
      case_id: id,
      action,
      beneficiary_decision,
      modified_recommendation,
      officer_notes,
      actioned_at: new Date().toISOString(),
    });
  } catch (saveErr) {
    console.warn('Local action save notice:', saveErr);
  }

  // If approved, trigger automated notifications: WhatsApp (with approved PDF) and SMS
  if (action === 'approved') {
    try {
      const { getCaseDetail, loadCompletedCalls } = await import('@/lib/recommendation-service');
      const caseDetail = await getCaseDetail(id);
      const calls = loadCompletedCalls();
      const matchedCall = calls.find(c => c.case_id === id);

      const targetPhone = caseDetail?.phone || matchedCall?.phone || '917397469792';
      const districtName = caseDetail?.district || 'Namakkal';
      const topRec = caseDetail?.recommendations?.[0];
      const tradeName = topRec?.qp_name || 'Tailor - Garment Construction';
      const nsqfLevel = topRec?.nsqf_level || 4;
      const orderId = `ORD-AJAY-${id}`;
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const pdfUrl = `${appBaseUrl}/api/cases/${id}/pdf`;
      const verifyUrl = `${appBaseUrl}/verify/${id}`;

      // Register official sanction verification record in database
      try {
        const { createOrGetSanctionRecord } = await import('@/lib/sanction-verification');
        await createOrGetSanctionRecord(id, appBaseUrl);
      } catch (recErr) {
        console.warn('[Action] Sanction record creation warning:', recErr);
      }

      // 1. Dispatch WhatsApp Approved Message & Approved PDF Document
      try {
        const waMessage =
          `🎉 *GOVERNMENT OF TAMIL NADU — PM-AJAY SANCTION ORDER*\n\n` +
          `Dear Beneficiary,\n` +
          `Your application under **PM-AJAY Grant-in-Aid** has been *OFFICIALLY APPROVED* by the District Collectorate & Social Welfare Department, ${districtName}.\n\n` +
          `📋 *Sanction Docket:* ${orderId}\n` +
          `🎯 *Approved NSQF Trade:* ${tradeName} (NSQF Level ${nsqfLevel})\n` +
          `📍 *District Center:* Government ITI / PMKK Skilling Cluster, ${districtName}\n` +
          `💰 *Sanctioned Support:* 100% Free Training, Monthly DBT Stipend & ₹35,000 Tool-kit Grant\n\n` +
          `📄 *Official Sanction Order (PDF):*\n${pdfUrl}\n\n` +
          `🔍 *Verify Authenticity Online:*\n${verifyUrl}\n\n` +
          `Please present this digital sanction order at your nearest welfare office for immediate enrollment.\n` +
          `📞 Helpline: 1800-425-0012 (Toll Free)`;

        await fetch('http://localhost:5005/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetPhone,
            message: waMessage,
            pdfUrl: pdfUrl,
            fileName: `PM-AJAY_Sanction_Order_${id}.pdf`,
          }),
          signal: AbortSignal.timeout(6000),
        });
      } catch (waErr: any) {
        console.warn('[Action] WhatsApp delivery notice:', waErr?.message);
      }

      // 2. Dispatch SMS Approved Notification
      try {
        const smsMessage =
          `PM-AJAY GIA Sanction Approved! Docket ${orderId}: Your application for ${tradeName} (NSQF Level ${nsqfLevel}) has been sanctioned by DSWO, ${districtName}. Direct Benefit Transfer (DBT) & tool-kit grant initiated. Download PDF: ${pdfUrl}. Helpline: 1800-425-0012.`;

        await fetch('http://localhost:5005/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetPhone,
            message: smsMessage,
            mirrorWhatsApp: false,
          }),
          signal: AbortSignal.timeout(6000),
        });
      } catch (smsErr: any) {
        console.warn('[Action] SMS delivery notice:', smsErr?.message);
      }
    } catch (notifErr: any) {
      console.warn('[Action] Notification orchestration warning:', notifErr?.message);
    }
  }

  try {
    const { data, error } = await supabase
      .from('officer_cases')
      .update({
        officer_action: action,
        beneficiary_decision: beneficiary_decision ?? 'pending',
        modified_recommendation: modified_recommendation ?? null,
        officer_notes: officer_notes ?? null,
        actioned_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      // Log to audit trail
      await supabase.from('audit_log').insert({
        event_type: 'officer_action',
        entity_type: 'officer_case',
        entity_id: id,
        actor_type: 'officer',
        event_data: { action, beneficiary_decision, officer_notes },
      });
      return NextResponse.json({ success: true, case: data });
    }
  } catch (dbErr) {
    // Supabase offline/unconfigured fallback
  }

  return NextResponse.json({
    success: true,
    case: {
      id,
      officer_action: action,
      beneficiary_decision: beneficiary_decision ?? 'pending',
      officer_notes: officer_notes ?? null,
      actioned_at: new Date().toISOString(),
    },
  });
}
