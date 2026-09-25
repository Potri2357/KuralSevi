import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import https from 'https';

function getEnvVar(key: string, defaultValue = ''): string {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), 'apps/web/.env'),
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

const recentSmsTimestamps = new Map<string, number>();

function sendFast2SmsHttps(apiKey: string, text: string, numbers: string): Promise<{ ok: boolean; status: number; data: any }> {
  return new Promise((resolve) => {
    const now = Date.now();
    const lastSent = recentSmsTimestamps.get(numbers) || 0;
    if (now - lastSent < 8000) { // 8 seconds debounce window
      console.log(`[Fast2SMS Cooldown] Repeat SMS to ${numbers} blocked within 8s. Fast2SMS wallet balance protected.`);
      return resolve({
        ok: true,
        status: 200,
        data: { return: true, request_id: 'DEBOUNCED_COOLDOWN', message: ['SMS already sent recently. Balance protected.'] },
      });
    }
    recentSmsTimestamps.set(numbers, now);

    const payload = JSON.stringify({
      route: 'q',
      message: text.replace(/[^\x00-\x7F]/g, '').slice(0, 150),
      language: 'english',
      flash: 0,
      numbers,
    });

    const req = https.request('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      timeout: 6000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ ok: res.statusCode === 200, status: res.statusCode || 200, data: parsed });
        } catch {
          resolve({ ok: false, status: res.statusCode || 500, data: { message: data } });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 408, data: { message: 'Fast2SMS request timeout' } });
    });

    req.on('error', (err) => {
      resolve({ ok: false, status: 500, data: { message: err?.message || 'Network error' } });
    });

    req.write(payload);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { phone, message } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required.' }, { status: 400 });
    }

    let digits = phone.trim().replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    const digitsOnly = digits.slice(-10);

    const cid = (body.caseId || body.case_id || 'N/A').slice(0, 8).toUpperCase();
    const rawName = body.beneficiaryName || body.beneficiary_name || 'Beneficiary';
    const cleanName = rawName.replace(/[^\x00-\x7F]/g, '').trim().slice(0, 20) || 'Beneficiary';
    const courseChoice = body.selected_course || body.course_name || (Array.isArray(body.recommended_courses) && body.recommended_courses.length > 0 ? (body.recommended_courses[0]?.qp_name || body.recommended_courses[0]) : null);

    let defaultMsg = `Kural Sevi Ref: ${cid}\nBeneficiary: ${cleanName}\nStatus: Intake Recorded. Reply YES`;
    if (courseChoice) {
      const cleanC = String(courseChoice).replace(/[^\x00-\x7F]/g, '').trim().slice(0, 28);
      defaultMsg = `Kural Sevi Ref: ${cid}\nBeneficiary: ${cleanName}\nCourse: ${cleanC}\nStatus: Confirmed via Call`;
    }

    const rawSms = message || defaultMsg;
    const smsText = rawSms.replace(/[^\x00-\x7F]/g, '').trim().slice(0, 160);

    let dispatched = false;
    let provider = 'none';
    let resultData: any = null;
    let failureReason = '';
    let dispatchMethod = 'none';

    // 1. Dispatch via Open-Source SMS Gateway Hub (Android Gateway / ADB / WhatsApp Mirror)
    const localSmsHub = getEnvVar('SMS_GATEWAY_URL') || getEnvVar('WHATSAPP_BOT_URL') || 'http://localhost:5005';
    const cleanHubUrl = localSmsHub.replace(/\/sms$/, '').replace(/\/$/, '');

    try {
      const hubRes = await fetch(`${cleanHubUrl}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: digitsOnly,
          message: smsText,
          mirrorWhatsApp: true,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const hubData = await hubRes.json().catch(() => ({}));
      if (hubRes.ok && hubData.success) {
        dispatched = true;
        provider = 'open-source-gateway';
        dispatchMethod = hubData.method || 'open-source';
        resultData = hubData;
      } else {
        failureReason = hubData.error || `SMS Hub HTTP ${hubRes.status}`;
      }
    } catch (hubErr: any) {
      failureReason = `Open-Source SMS Hub unreachable at ${cleanHubUrl}: ${hubErr?.message}`;
    }

    // 2. Direct Android SMS Gateway fallback if configured directly
    if (!dispatched) {
      const directAndroidUrl = getEnvVar('ANDROID_SMS_GATEWAY_URL');
      if (directAndroidUrl) {
        try {
          let targetUrl = directAndroidUrl.trim();
          if (!targetUrl.endsWith('/message') && !targetUrl.endsWith('/messages')) {
            targetUrl = targetUrl.replace(/\/$/, '') + '/message';
          }
          const login = getEnvVar('ANDROID_SMS_GATEWAY_LOGIN');
          const pass = getEnvVar('ANDROID_SMS_GATEWAY_PASSWORD');
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (login && pass) {
            headers['Authorization'] = `Basic ${Buffer.from(`${login}:${pass}`).toString('base64')}`;
          }
          const aRes = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message: smsText, phoneNumbers: [`+91${digitsOnly}`] }),
            signal: AbortSignal.timeout(6000),
          });
          const aData = await aRes.json().catch(() => ({}));
          if (aRes.ok) {
            dispatched = true;
            provider = 'android-sms-gateway';
            dispatchMethod = 'cellular-sim';
            resultData = aData;
          }
        } catch (aErr: any) {
          console.warn('[Direct Android SMS] Error:', aErr.message);
        }
      }
    }

    return NextResponse.json({
      success: dispatched,
      dispatched,
      provider,
      method: dispatchMethod,
      phone: `+91${digitsOnly}`,
      message: dispatched
        ? `SMS receipt successfully dispatched to +91 ${digitsOnly} via Open-Source Gateway (${dispatchMethod.toUpperCase()}).`
        : `Could not dispatch SMS (${failureReason}).`,
      error: dispatched ? undefined : failureReason,
      data: resultData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error while dispatching SMS.' },
      { status: 500 }
    );
  }
}
