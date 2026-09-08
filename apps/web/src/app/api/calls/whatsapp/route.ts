import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveCompletedCall } from '@/lib/recommendation-service';

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

interface CoursePayload {
  qp_code: string;
  qp_name: string;
  nsqf_level?: number;
  duration?: string;
  stipend?: string;
  income_range?: string;
  sector?: string;
  training_center?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      phone,
      language = 'ta',
      mode = 'course',
      course,
      caseId,
      beneficiaryName = 'Beneficiary',
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
    const generatedCaseId = caseId || `WA-${digitsOnly.slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Selected or default course
    const selectedCourse: CoursePayload = course || {
      qp_code: 'APP/Q0301',
      qp_name: "Tailor - Women's & Men's Garment",
      nsqf_level: 4,
      duration: '300 Hours (3 Months)',
      stipend: '₹1,500/month DBT under PM-AJAY',
      income_range: '₹15,000 - ₹25,000/month',
      sector: 'Apparel',
      training_center: 'District PM-AJAY Skill Development Center / NSDC Partner',
    };

    // Clean text WhatsApp message without any emojis
    let waMessage = '';

    if (language === 'ta') {
      waMessage = [
        '*அரசு PM-AJAY வாழ்வாதார மற்றும் திறன் பயிற்சி பதிவு (Kural Sevi Intake)*',
        '--------------------------------------------------',
        `மனு எண் (Case ID): ${generatedCaseId}`,
        `பயனாளி: ${beneficiaryName}`,
        `தொலைபேசி: ${cleanPhone}`,
        '',
        'வணக்கம்! தமிழ்நாடு அரசு PM-AJAY திட்டத்தின் கீழ் இலவச தொழில் திறன் பயிற்சி பாடநெறிகள், மாதாந்திர உதவித்தொகை (ரூ. 1,500/மாதம்) மற்றும் வாழ்வாதார மானியங்களைப் பெற உங்களை வரவேற்கிறோம்.',
        '',
        'பதிவை தொடங்க:',
        '1. உங்கள் கல்வி தகுதி, தற்போதைய வேலை மற்றும் விருப்பமான தொழில் பயிற்சி பற்றி ஒரு குரல் பதிவு (Voice Note) அல்லது செய்தியை உடனே இங்கு அனுப்பவும்.',
        '2. அல்லது "START" அல்லது "சரி" என்று உடனே பதில் அனுப்பவும்.',
        customNote ? `\nகுறிப்பு: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - தமிழ்நாடு அரசு PM-AJAY தொலைபேசி மற்றும் வாட்ஸ்அப் பதிவு சேவை_',
      ].filter(Boolean).join('\n');
    } else if (language === 'hi') {
      waMessage = [
        '*सरकारी पीएम-अजय (PM-AJAY) आजीविका एवं कौशल प्रशिक्षण पंजीकरण (Kural Sevi)*',
        '--------------------------------------------------',
        `केस आईडी (Case ID): ${generatedCaseId}`,
        `लाभार्थी: ${beneficiaryName}`,
        `फोन: ${cleanPhone}`,
        '',
        'नमस्ते! केंद्र एवं राज्य सरकार की पीएम-अजय योजना के तहत मुफ़्त कौशल प्रशिक्षण पाठ्यक्रम, मासिक वजीफा (रु. 1,500/माह) और आजीविका सहायता हेतु आपका स्वागत है।',
        '',
        'पंजीकरण शुरू करने के लिए:',
        '1. अपनी शिक्षा, वर्तमान कार्य और पसंदीदा कौशल पाठ्यक्रम के बारे में वॉइस नोट (Voice Note) या संदेश भेजें।',
        '2. या तुरंत "START" या "हाँ" लिखकर उत्तर दें।',
        customNote ? `\nनोट: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - पीएम-अजय टेलीफोनी एवं व्हाट्सएप पंजीकरण सेवा_',
      ].filter(Boolean).join('\n');
    } else if (language === 'te') {
      waMessage = [
        '*ప్రభుత్వ PM-AJAY జీవనోపాధి మరియు నైపుణ్య శిక్షణ నమోదు (Kural Sevi)*',
        '--------------------------------------------------',
        `కేస్ ఐడీ (Case ID): ${generatedCaseId}`,
        `లబ్ధిదారు: ${beneficiaryName}`,
        `ఫోన్: ${cleanPhone}`,
        '',
        'నమస్కారం! ప్రభుత్వ PM-AJAY పథకం కింద ఉచిత వృత్తి నైపుణ్య కోర్సులు, నెలవారీ స్టైపెండ్ (రూ. 1,500/నెలకు) మరియు ఉపాధి మార్గదర్శకత్వం కొరకు ఆహ్వానిస్తున్నాము.',
        '',
        'నమోదు ప్రారంభించడానికి:',
        '1. మీ విద్యార్హత, ప్రస్తుత పని మరియు ఆసక్తి ఉన్న వృత్తి కోర్సు గురించి వాయిస్ నోట్ (Voice Note) లేదా సందేశం పంపండి.',
        '2. లేదా వెంటనే "START" అని రిప్లై ఇవ్వండి.',
        customNote ? `\nగమనిక: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - PM-AJAY టెలిఫోనీ & వాట్సాప్ నమోదు వేదిక_',
      ].filter(Boolean).join('\n');
    } else {
      waMessage = [
        '*Government PM-AJAY Livelihood & Skill Course Intake (Kural Sevi)*',
        '--------------------------------------------------',
        `Case ID: ${generatedCaseId}`,
        `Beneficiary: ${beneficiaryName}`,
        `Phone: ${cleanPhone}`,
        '',
        'Greetings! Welcome to the government PM-AJAY initiative for free vocational skill training courses, monthly DBT stipend (Rs. 1,500/month), and livelihood support.',
        '',
        'To begin your enrollment:',
        '1. Reply with a Voice Note or message sharing your education, current occupation, and desired vocational training trade.',
        '2. Or simply reply "START" or "YES" to this message.',
        customNote ? `\nOfficer Note: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - Government PM-AJAY Telephony & WhatsApp Automated Intake Platform_',
      ].filter(Boolean).join('\n');
    }

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

    if (accountSid && authToken) {
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
        }
      } catch (err: any) {
        console.warn('Twilio WhatsApp dispatch notice:', err?.message);
      }
    }

    // Persist as a completed / active Call Record in completed_calls.json
    const newRecord = {
      session_id: `wa-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      case_id: generatedCaseId,
      phone: cleanPhone,
      channel: 'whatsapp',
      language,
      status: 'COURSE_DISPATCHED',
      citizen_confirmed: false,
      notification_status: twilioDispatched ? 'WHATSAPP_DISPATCHED' : 'WHATSAPP_READY',
      completed_at: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      confirmed_fields: {
        skills_and_interests: selectedCourse.qp_name,
        employment_preference: selectedCourse.sector || 'Skill Development Course',
        local_economic_context: selectedCourse.qp_code,
      },
      turns_count: 1,
      transcript: [
        {
          user: `WhatsApp Course Outreach: ${selectedCourse.qp_name}`,
          assistant: `Dispatched NSQF course details (${selectedCourse.qp_code}) to ${cleanPhone}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      confirmed_via: 'WhatsApp',
      confirmed_at: twilioDispatched ? new Date().toISOString() : undefined,
    };

    saveCompletedCall(newRecord);

    return NextResponse.json({
      success: true,
      message: twilioDispatched
        ? `WhatsApp message successfully dispatched to ${cleanPhone}.`
        : `WhatsApp course notification prepared for ${cleanPhone}. You can also open directly in WhatsApp Web.`,
      twilio_dispatched: twilioDispatched,
      twilio_sid: twilioResult?.sid,
      wa_link: waLink,
      case_id: generatedCaseId,
      phone: cleanPhone,
      message_preview: waMessage,
      record: newRecord,
    });
  } catch (err: any) {
    console.error('Error in /api/calls/whatsapp:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to dispatch WhatsApp course message.' },
      { status: 500 }
    );
  }
}
