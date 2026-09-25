import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveCompletedCall, loadCompletedCalls } from '@/lib/recommendation-service';
import { buildRealDataWhatsAppMessage } from '@/lib/notification-formatter';

function getEnvVar(key: string, defaultValue = ''): string {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/web/.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '.env.local'),
  ];

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...rest] = trimmed.split('=');
            if (k.trim() === key) {
              const val = rest.join('=').trim();
              if (val) return val;
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return process.env[key] || defaultValue;
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
    let digitsOnly = phone.trim().replace(/\D/g, '');
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      digitsOnly = '91' + digitsOnly.slice(1);
    } else if (digitsOnly.length === 10) {
      digitsOnly = '91' + digitsOnly;
    }
    const cleanPhone = '+' + digitsOnly;

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

    let dispatched = false;
    let dispatchProvider = 'none';
    let botMessageId = '';
    let failureReason = '';

    // Dispatch via Self-Hosted WhatsApp Bot (Baileys Multi-Device)
    const localBotUrl = getEnvVar('WHATSAPP_BOT_URL') || 'http://localhost:5005';
    try {
      const botRes = await fetch(`${localBotUrl.replace(/\/$/, '')}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: digitsOnly, message: waMessage }),
        signal: AbortSignal.timeout(6000),
      });
      const botData = await botRes.json().catch(() => ({}));
      if (botRes.ok && botData.success) {
        dispatched = true;
        dispatchProvider = 'self-hosted-bot';
        botMessageId = botData.messageId || 'sent';
        console.log('[Local WhatsApp Bot] Successfully dispatched to', digitsOnly, 'Message ID:', botMessageId);
      } else {
        failureReason = botData.error || `Bot returned HTTP ${botRes.status}`;
      }
    } catch (err: any) {
      failureReason = `Local WhatsApp Bot unreachable at ${localBotUrl}: ${err?.message || 'offline'}. Start with npm run whatsapp:bot`;
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
        notification_status: dispatched ? 'WHATSAPP_DISPATCHED' : 'WHATSAPP_READY',
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
        notification_status: dispatched ? 'WHATSAPP_DISPATCHED' : 'WHATSAPP_READY',
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
        confirmed_at: dispatched ? new Date().toISOString() : undefined,
      };

      saveCompletedCall(finalRecord);
    }

    return NextResponse.json({
      success: dispatched,
      dispatched,
      message: dispatched
        ? `Official PM-AJAY WhatsApp receipt successfully dispatched to ${cleanPhone} via ${dispatchProvider.toUpperCase()}.`
        : `Could not deliver automatically (${failureReason}). Pair your device at http://localhost:5005/qr or open directly in WhatsApp to send.`,
      error: dispatched
        ? undefined
        : `Delivery notice: ${failureReason}. Use "Open in WhatsApp" to deliver directly.`,
      provider: dispatchProvider,
      failure_reason: failureReason || undefined,
      message_id: botMessageId || undefined,
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
