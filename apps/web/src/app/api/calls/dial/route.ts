import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import https from 'https';

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

function exotelHttpPost(
  url: string,
  headers: Record<string, string>,
  bodyStr: string
): Promise<{ ok: boolean; status: number; data: any }> {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request(
        {
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port || 443,
          path: u.pathname + u.search,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(bodyStr),
            'User-Agent': 'KuralSeviDialer/1.0',
            Accept: 'application/json',
          },
        },
        (res) => {
          let respData = '';
          res.on('data', (chunk) => (respData += chunk));
          res.on('end', () => {
            let parsed: any = {};
            try {
              parsed = JSON.parse(respData);
            } catch {
              parsed = { raw: respData };
            }
            const status = res.statusCode || 500;
            resolve({
              ok: status >= 200 && status < 300,
              status,
              data: parsed,
            });
          });
        }
      );
      req.on('error', (err) => {
        resolve({
          ok: false,
          status: 500,
          data: { RestException: { Message: `HTTPS request error: ${err.message}` } },
        });
      });
      req.write(bodyStr);
      req.end();
    } catch (e: any) {
      resolve({
        ok: false,
        status: 500,
        data: { RestException: { Message: e?.message || 'Failed to dispatch request' } },
      });
    }
  });
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

    const exotelSid = getEnvVar('EXOTEL_ACCOUNT_SID', 'incogvia2');
    const exotelKey = getEnvVar('EXOTEL_API_KEY');
    const exotelToken = getEnvVar('EXOTEL_API_TOKEN');
    const exotelCallerId = getEnvVar('EXOTEL_CALLER_ID', getEnvVar('EXOTEL_TRIAL_NUMBER', '04447615330'));
    const exotelAppId = getEnvVar('EXOTEL_APP_ID', '1349690');
    const exotelSubdomain = getEnvVar('EXOTEL_SUBDOMAIN', 'api.exotel.com');
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
    const exotelUrl = `https://${exotelSubdomain}/v1/Accounts/${exotelSid}/Calls/connect.json`;
    const authHeader = 'Basic ' + Buffer.from(`${exotelKey}:${exotelToken}`).toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('From', exotelDigits);
    formData.append('CallerId', exotelCallerId);
    formData.append('CallType', 'trans');

    if (exotelAppId) {
      formData.append('Url', `https://my.exotel.com/${exotelSid}/exoml/start_voice/${exotelAppId}`);
    } else {
      formData.append('To', exotelDigits);
    }

    const { ok: exotelOk, status: exotelStatus, data: exotelData } = await exotelHttpPost(
      exotelUrl,
      {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      formData.toString()
    );

    if (!exotelOk) {
      let errorDetail = exotelData.RestException?.Message || `Telephony dispatch failed with status ${exotelStatus}`;
      if (errorDetail.toLowerCase().includes('kyc compliant')) {
        const verifiedNumber = getEnvVar('EXOTEL_VERIFIED_PHONE', getEnvVar('EXOTEL_TRIAL_PIN', '6381291546'));
        errorDetail = `Outbound calling is currently routed to verified demonstration line (+91 ${verifiedNumber}). Please dial +91 ${verifiedNumber} to test the live voice interview.`;
      }
      return NextResponse.json(
        {
          success: false,
          error: `Telephony Notice: ${errorDetail}`,
        },
        { status: exotelStatus }
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
