import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveCompletedCall, loadCompletedCalls } from '@/lib/recommendation-service';
import { buildRealDataWhatsAppMessage } from '@/lib/notification-formatter';

function getEnvVar(key: string, defaultValue = ''): string {
  if (process.env[key]) return process.env[key]!;

  try {
    const rootEnv = path.resolve(process.cwd(), '../../.env');
    if (fs.existsSync(rootEnv)) {
      const content = fs.readFileSync(rootEnv, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...rest] = trimmed.split('=');
          if (k.trim() === key) {
            return rest.join('=').trim();
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return defaultValue;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      phone,
      language = 'ta',
      mode = 'intake',
      caseId,
      beneficiaryName = 'Beneficiary',
      confirmed_fields,
      recommended_courses,
      selected_course,
      customNote = '',
    } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid phone number.' },
        { status: 400 }
      );
    }

    // Clean and normalize phone number
    let cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+91' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+91' + cleanPhone;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');

    // Look up existing call record in completed_calls.json if caseId provided
    const allCalls = loadCompletedCalls();
    const existingRecord = caseId
      ? allCalls.find((c) => c.case_id === caseId || c.phone === cleanPhone)
      : allCalls.find((c) => c.phone === cleanPhone);

    const generatedCaseId =
      caseId ||
      existingRecord?.case_id ||
      `WA-${digitsOnly.slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Extract real data from existing record if not explicitly in request
    const activeFields =
      confirmed_fields || existingRecord?.confirmed_fields || {};
    const activeCourses =
      recommended_courses || existingRecord?.recommended_courses || [];
    const activeSelectedCourse =
      selected_course ||
      existingRecord?.citizen_selected_course ||
      (activeCourses.length > 0 && mode === 'single_course' ? activeCourses[0]?.qp_name : undefined);

    const activeLanguage = language || existingRecord?.language || 'ta';
    const activeName =
      beneficiaryName !== 'Beneficiary'
        ? beneficiaryName
        : (existingRecord as any)?.beneficiary_name ||
          (existingRecord?.case_id ? `Citizen (${existingRecord.case_id})` : 'Beneficiary');

    // Build real-data bilingual WhatsApp message
    const waMessage = buildRealDataWhatsAppMessage({
      phone: cleanPhone,
      language: activeLanguage,
      caseId: generatedCaseId,
      beneficiaryName: activeName,
      confirmedFields: activeFields,
      recommendedCourses: activeCourses,
      selectedCourse: activeSelectedCourse,
      customNote,
      isConfirmedStatus:
        existingRecord?.citizen_confirmed ||
        existingRecord?.status === 'BENEFICIARY_CONFIRMED',
    });

    // Direct wa.me link for browser / desktop 1-click fallback
    const waLink = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(waMessage)}`;

    // Attempt Twilio WhatsApp dispatch
    const accountSid = getEnvVar('TWILIO_ACCOUNT_SID');
    const authToken = getEnvVar('TWILIO_AUTH_TOKEN');
    let fromNumber = getEnvVar('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886';
    if (!fromNumber.startsWith('whatsapp:')) {
      fromNumber = `whatsapp:${fromNumber}`;
    }

    let twilioResult: any = null;
    let twilioDispatched = false;

    if (accountSid && authToken && !accountSid.includes('dummy')) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const formData = new URLSearchParams();
        formData.append('To', `whatsapp:${cleanPhone}`);
        formData.append('From', fromNumber);
        formData.append('Body', waMessage);

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        twilioResult = await twilioRes.json();
        if (twilioRes.ok) {
          twilioDispatched = true;
        } else {
          console.warn('Twilio WhatsApp response:', twilioResult);
        }
      } catch (err: any) {
        console.warn('Twilio WhatsApp dispatch notice:', err?.message);
      }
    }

    // Persist or Update completed call record
    let finalRecord: any;

    if (existingRecord) {
      // Update existing record preserving all prior turn history and scores
      const existingTranscript = existingRecord.transcript || [];
      const updatedTranscript = [
        ...existingTranscript,
        {
          user: `Officer Action: Dispatched Real WhatsApp Confirmation Receipt`,
          assistant: activeSelectedCourse
            ? `Dispatched official receipt for confirmed course: ${activeSelectedCourse}`
            : `Dispatched official receipt with top ${activeCourses.length || 3} recommended courses`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];

      finalRecord = {
        ...existingRecord,
        notification_status: twilioDispatched ? 'WHATSAPP_DISPATCHED' : 'WHATSAPP_READY',
        confirmed_via: existingRecord.confirmed_via || 'WhatsApp',
        transcript: updatedTranscript,
        turns_count: updatedTranscript.length,
      };

      if (activeSelectedCourse && !finalRecord.citizen_selected_course) {
        finalRecord.citizen_selected_course = activeSelectedCourse;
      }

      saveCompletedCall(finalRecord);
    } else {
      // New call session record created from portal
      finalRecord = {
        session_id: `wa-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        case_id: generatedCaseId,
        phone: cleanPhone,
        channel: 'whatsapp',
        language: activeLanguage,
        status: activeSelectedCourse ? 'BENEFICIARY_CONFIRMED' : 'RECEIPT_DISPATCHED',
        citizen_confirmed: !!activeSelectedCourse,
        notification_status: twilioDispatched ? 'WHATSAPP_DISPATCHED' : 'WHATSAPP_READY',
        completed_at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        confirmed_fields: activeFields,
        recommended_courses: activeCourses,
        citizen_selected_course: activeSelectedCourse,
        turns_count: 1,
        transcript: [
          {
            user: `WhatsApp Confirmation Outreach to ${activeName}`,
            assistant: `Dispatched official PM-AJAY notification receipt to ${cleanPhone}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
        confirmed_via: 'WhatsApp',
        confirmed_at: twilioDispatched ? new Date().toISOString() : undefined,
      };

      saveCompletedCall(finalRecord);
    }

    return NextResponse.json({
      success: true,
      message: twilioDispatched
        ? `Official PM-AJAY WhatsApp receipt successfully dispatched to ${cleanPhone}.`
        : `WhatsApp confirmation receipt prepared for ${cleanPhone}. You can also open directly in WhatsApp Web.`,
      twilio_dispatched: twilioDispatched,
      twilio_sid: twilioResult?.sid,
      wa_link: waLink,
      case_id: generatedCaseId,
      phone: cleanPhone,
      message_preview: waMessage,
      record: finalRecord,
    });
  } catch (err: any) {
    console.error('Error in /api/calls/whatsapp:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to dispatch WhatsApp message.' },
      { status: 500 }
    );
  }
}
