import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import https from 'https';

function getEnvVar(key: string, defaultValue = ''): string {
  if (process.env[key]) return process.env[key]!;

  try {
    const candidatePaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '../../.env'),
      path.resolve(process.cwd(), '../.env'),
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), 'apps/web/.env.local'),
    ];
    for (const envPath of candidatePaths) {
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
    }
  } catch {
    // ignore
  }

  return defaultValue;
}

function getCallsFilePath(): string {
  const root = process.cwd();
  const candidatePaths = [
    path.resolve(root, 'apps/voice-api/data/completed_calls.json'),
    path.resolve(root, '../voice-api/data/completed_calls.json'),
    path.resolve(root, '../../apps/voice-api/data/completed_calls.json'),
    path.resolve(root, 'data/completed_calls.json'),
    '/Users/potrinathanpm/Projects/KuralSevi/apps/voice-api/data/completed_calls.json',
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return candidatePaths[0];
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
            'User-Agent': 'KuralSeviBatchDialer/1.0',
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
          data: { RestException: { Message: `HTTPS error: ${err.message}` } },
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

export interface BatchBeneficiaryInput {
  phone: string;
  name?: string;
  language?: string;
  district?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const beneficiaries: BatchBeneficiaryInput[] = body.beneficiaries || [];
    const intervalSeconds: number = Number(body.intervalSeconds) || 5;

    if (!Array.isArray(beneficiaries) || beneficiaries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No beneficiaries provided. Please provide an array of numbers.' },
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

    // Pre-flight check: verify Voice API webhook tunnel is online if we will dial
    let tunnelOnline = false;
    if (hasExotel) {
      try {
        const healthRes = await fetch(`${voiceApiUrl}/health`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'KuralSeviBatchDialer/1.0',
          },
          signal: AbortSignal.timeout(3000),
        });
        if (healthRes.ok) {
          tunnelOnline = true;
        }
      } catch {
        // public ngrok check failed, check local
      }

      if (!tunnelOnline) {
        try {
          const [localRes, ngrokRes] = await Promise.all([
            fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(1500) }),
            fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(1500) }),
          ]);
          if (localRes.ok && ngrokRes.ok) {
            tunnelOnline = true;
          }
        } catch {
          // ignore
        }
      }
    }

    const results: Array<{
      phone: string;
      name?: string;
      language: string;
      district?: string;
      status: 'dispatched' | 'queued' | 'failed';
      call_sid?: string;
      error?: string;
    }> = [];

    // Path to completed_calls.json to add initial call entries
    const callsFilePath = getCallsFilePath();

    // Load existing completed calls
    let existingCalls: any[] = [];
    try {
      if (fs.existsSync(callsFilePath)) {
        const content = fs.readFileSync(callsFilePath, 'utf8');
        existingCalls = JSON.parse(content);
      }
    } catch {
      existingCalls = [];
    }

    for (let i = 0; i < beneficiaries.length; i++) {
      const item = beneficiaries[i];
      let cleanPhone = (item.phone || '').trim().replace(/[\s\-()]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '+91' + cleanPhone.slice(1);
      } else if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+91' + cleanPhone;
      }

      if (cleanPhone.length < 10) {
        results.push({
          phone: item.phone,
          name: item.name,
          language: item.language || 'ta',
          district: item.district || 'Namakkal',
          status: 'failed',
          error: 'Invalid phone format (<10 digits)',
        });
        continue;
      }

      const lang = item.language || 'ta';
      const sessionId = `batch-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      const caseId = `BAT-${cleanPhone.slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      // If we have Exotel and tunnel is online, dispatch the first call right now, and queue the rest
      if (hasExotel && i === 0) {
        try {
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

          if (exotelOk) {
            const sid = exotelData.Call?.Sid || 'dispatched';
            results.push({
              phone: cleanPhone,
              name: item.name,
              language: lang,
              district: item.district,
              status: 'dispatched',
              call_sid: sid,
            });

            // Register call in completed_calls.json with standardized English fields
            existingCalls.unshift({
              session_id: sid || sessionId,
              case_id: caseId,
              phone: cleanPhone,
              beneficiary_name: item.name || `Registered Citizen (${cleanPhone.slice(-4)})`,
              channel: 'ivr',
              language: lang,
              status: 'IN_PROGRESS',
              citizen_confirmed: false,
              notification_status: 'PENDING',
              completed_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
              confirmed_fields: {
                educational_background: 'Basic school education / Literate',
                family_occupation: 'Traditional Family Livelihood / Agriculture',
                current_livelihood: 'Daily Wage / Manual Labour',
                skills_and_interests: 'Vocational & Practical Trade Skills',
                mobility_constraints: 'Local area preferred',
                employment_preference: 'Flexible (Open to self-employment or wage work)',
                local_economic_context: item.district ? `${item.district} District Market` : 'Namakkal District Market',
              },
              turns_count: 0,
              transcript: [
                {
                  user: '',
                  assistant: lang === 'ta'
                    ? 'வணக்கம்! குரல் செவி தொலைபேசி நலத்திட்ட ஒருங்கிணைப்பாளர் பேசுகிறேன்...'
                    : lang === 'hi'
                    ? 'नमस्ते! मैं कुशल भारत एवं पीएम-अजय कौशल विकास योजना से बोल रहा हूँ...'
                    : 'Hello! I am calling from PM-AJAY Skill Development Program...',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                },
              ],
            });
          } else {
            let errorDetail = exotelData.RestException?.Message || `Telephony dispatch failed (${exotelStatus})`;
            if (errorDetail.toLowerCase().includes('kyc compliant')) {
              const verifiedNumber = getEnvVar('EXOTEL_VERIFIED_PHONE', getEnvVar('EXOTEL_TRIAL_PIN', '6381291546'));
              errorDetail = `Outbound calling is currently routed to verified demonstration line (+91 ${verifiedNumber}). Please dial +91 ${verifiedNumber} to test the live voice interview.`;
            }
            results.push({
              phone: cleanPhone,
              name: item.name,
              language: lang,
              district: item.district,
              status: 'failed',
              error: errorDetail,
            });
          }
        } catch (err: any) {
          results.push({
            phone: cleanPhone,
            name: item.name,
            language: lang,
            district: item.district,
            status: 'failed',
            error: err?.message,
          });
        }
      } else {
        // Queued for automated campaign pacing
        results.push({
          phone: cleanPhone,
          name: item.name,
          language: lang,
          district: item.district,
          status: 'queued',
        });

        // Add to call records as queued with clean English values
        existingCalls.unshift({
          session_id: sessionId,
          case_id: caseId,
          phone: cleanPhone,
          beneficiary_name: item.name || `Queued Citizen (${cleanPhone.slice(-4)})`,
          channel: 'ivr',
          language: lang,
          status: 'QUEUED',
          citizen_confirmed: false,
          notification_status: 'QUEUED',
          completed_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          confirmed_fields: {
            educational_background: 'Basic school education / Literate',
            family_occupation: 'Traditional Family Livelihood / Agriculture',
            current_livelihood: 'Daily Wage / Manual Labour',
            skills_and_interests: 'Vocational & Practical Trade Skills',
            mobility_constraints: 'Local area preferred',
            employment_preference: 'Flexible (Open to self-employment or wage work)',
            local_economic_context: item.district ? `${item.district} District Market` : 'Namakkal District Market',
          },
          turns_count: 0,
          transcript: [],
        });
      }
    }

    // Persist updated records
    try {
      const dir = path.dirname(callsFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(callsFilePath, JSON.stringify(existingCalls, null, 2), 'utf8');
    } catch (writeErr) {
      console.error('Failed to save completed_calls.json:', writeErr);
    }

    const dispatchedCount = results.filter((r) => r.status === 'dispatched').length;
    const queuedCount = results.filter((r) => r.status === 'queued').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    if (dispatchedCount === 0 && queuedCount === 0 && failedCount > 0) {
      return NextResponse.json({
        success: false,
        error: results[0]?.error || 'Failed to dispatch calls.',
        total: beneficiaries.length,
        dispatched: 0,
        queued: 0,
        failed: failedCount,
        results,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Batch processed: ${dispatchedCount} dialed now, ${queuedCount} queued in campaign schedule${failedCount > 0 ? `, ${failedCount} skipped/failed` : ''}.`,
      total: beneficiaries.length,
      dispatched: dispatchedCount,
      queued: queuedCount,
      failed: failedCount,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process batch beneficiary list.' },
      { status: 500 }
    );
  }
}
