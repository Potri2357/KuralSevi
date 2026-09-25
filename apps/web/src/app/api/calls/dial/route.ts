import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getEnvVar(key: string, defaultValue = ''): string {
  if (process.env[key]) return process.env[key]!;

  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps/web/.env.local'),
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
              return rest.join('=').trim();
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return defaultValue;
}

async function fetchWithRetry(url: string, opts: RequestInit, retries = 3): Promise<Response> {
  let lastErr: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, opts);
    } catch (err: any) {
      lastErr = err;
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { phone, language = 'en' } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid beneficiary phone number.' },
        { status: 400 }
      );
    }

    // Sanitize and normalize phone number
    let cleanPhone = phone.trim().replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+91' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+91' + cleanPhone;
    }

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Phone number is too short. Please include a 10-digit number.' },
        { status: 400 }
      );
    }

    const exotelSid = getEnvVar('EXOTEL_ACCOUNT_SID', 'incogvia1');
    const exotelKey = getEnvVar('EXOTEL_API_KEY');
    const exotelToken = getEnvVar('EXOTEL_API_TOKEN');
    const exotelCallerId = getEnvVar('EXOTEL_CALLER_ID', '08047289241');
    const exotelAppId = getEnvVar('EXOTEL_APP_ID');
    const voiceApiUrl = getEnvVar('VOICE_API_URL', 'https://charita-techiest-histogenetically.ngrok-free.dev').replace(/\/+$/, '');

    const hasExotel = Boolean(exotelSid && exotelKey && exotelToken);
    const cliCommand = `python3 scripts/trigger-exotel-call.py ${cleanPhone} ${language}`;

    if (!hasExotel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Telephony gateway service is not configured in the environment.',
        },
        { status: 500 }
      );
    }

    // Pre-flight check: Verify that the Voice API Webhook Tunnel is online before dialing
    let tunnelOnline = false;
    let preflightError = '';

    try {
      const healthRes = await fetch(`${voiceApiUrl}/health`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'KuralSeviDialer/1.0',
        },
        signal: AbortSignal.timeout(5000),
      });
      if (healthRes.ok) {
        tunnelOnline = true;
      } else {
        preflightError = `Voice API tunnel (${voiceApiUrl}) responded with HTTP ${healthRes.status}. Please make sure your ngrok tunnel is active and forwarding to port 8000.`;
      }
    } catch {
      // Direct fetch over public ngrok might fail on local loopback/TLS; fallback to local inspector
    }

    if (!tunnelOnline) {
      try {
        const [localRes, ngrokRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(2000) }),
          fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(2000) }),
        ]);
        if (localRes.ok && ngrokRes.ok) {
          const ngrokData = await ngrokRes.json();
          const activeTunnels = ngrokData?.tunnels || [];
          if (activeTunnels.length > 0) {
            tunnelOnline = true;
          }
        }
      } catch {
        // Local fallback check failed
      }
    }

    if (!tunnelOnline) {
      return NextResponse.json(
        {
          success: false,
          error: preflightError || `Voice API Webhook Tunnel (${voiceApiUrl}) is offline or unreachable. Telephony requires an active public webhook URL to handle calls without throwing error. Please start your tunnel using: npm run tunnel.`,
          command: cliCommand,
        },
        { status: 502 }
      );
    }

    // ── Primary Path: Exotel (India Domestic Cloud Telephony) ──
    const exotelDigits = cleanPhone.replace(/^\+91|^91|^0/, '');
    const exotelUrl = `https://api.exotel.com/v1/Accounts/${exotelSid}/Calls/connect.json`;
    const authHeader = 'Basic ' + Buffer.from(`${exotelKey}:${exotelToken}`).toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('From', exotelDigits);
    formData.append('CallerId', exotelCallerId);
    formData.append('CallType', 'trans');

    if (exotelAppId) {
      formData.append('Url', `http://my.exotel.com/${exotelSid}/exoml/start_voice/${exotelAppId}`);
    } else {
      formData.append('To', exotelDigits);
    }

    const exotelRes = await fetchWithRetry(exotelUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const exotelData = await exotelRes.json().catch(() => ({}));

    if (!exotelRes.ok) {
      let errorDetail = exotelData.RestException?.Message || `Telephony dispatch failed with status ${exotelRes.status}`;
      if (errorDetail.toLowerCase().includes('kyc compliant')) {
        errorDetail = `Outbound calling is currently routed to verified demonstration line (+91 9342900638). Please dial +91 9342900638 to test the live voice interview.`;
      }
      return NextResponse.json(
        {
          success: false,
          error: `Telephony Notice: ${errorDetail}`,
        },
        { status: exotelRes.status }
      );
    }

    const callSid = exotelData.Call?.Sid || 'initiated';
    return NextResponse.json({
      success: true,
      message: `Outbound call initiated to +91 ${exotelDigits}. The phone will ring shortly from ${exotelCallerId}.`,
      call_sid: callSid,
      to: exotelDigits,
      from: exotelCallerId,
      language,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error while initiating call.',
      },
      { status: 500 }
    );
  }
}
