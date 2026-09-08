import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    const accountSid = getEnvVar('TWILIO_ACCOUNT_SID');
    const authToken = getEnvVar('TWILIO_AUTH_TOKEN');
    const fromNumber = getEnvVar('TWILIO_PHONE_NUMBER');
    const voiceApiUrl = getEnvVar('VOICE_API_URL', 'https://charita-techiest-histogenetically.ngrok-free.dev');

    const hasTwilio = Boolean(accountSid && authToken && fromNumber && !accountSid.toLowerCase().includes('dummy'));

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
    const callsFilePath = path.resolve(process.cwd(), '../voice-api/data/completed_calls.json');

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

    const authHeader = hasTwilio
      ? 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      : '';

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
      const webhookUrl = `${voiceApiUrl}/webhooks/twilio/interview-start?language=${encodeURIComponent(lang)}`;
      const sessionId = `batch-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      const caseId = `BAT-${cleanPhone.slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      // If we have Twilio, we can dispatch the first call right now, and queue the rest
      if (hasTwilio && i === 0) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
          const formData = new URLSearchParams();
          formData.append('To', cleanPhone);
          formData.append('From', fromNumber);
          formData.append('Url', webhookUrl);
          formData.append('Method', 'POST');

          const twilioRes = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const twilioData = await twilioRes.json();
          if (twilioRes.ok) {
            results.push({
              phone: cleanPhone,
              name: item.name,
              language: lang,
              district: item.district,
              status: 'dispatched',
              call_sid: twilioData.sid,
            });

            // Register call in completed_calls.json
            existingCalls.unshift({
              session_id: twilioData.sid || sessionId,
              case_id: caseId,
              phone: cleanPhone,
              beneficiary_name: item.name || 'Registered Beneficiary',
              channel: 'ivr',
              language: lang,
              status: 'IN_PROGRESS',
              citizen_confirmed: false,
              notification_status: 'PENDING',
              completed_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
              confirmed_fields: {
                local_economic_context: item.district || 'Namakkal',
              },
              turns_count: 0,
              transcript: [
                {
                  user: '',
                  assistant: 'வணக்கம்! குரல் செவி தொலைபேசி நலத்திட்ட ஒருங்கிணைப்பாளர் பேசுகிறேன்...',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                },
              ],
            });
          } else {
            results.push({
              phone: cleanPhone,
              name: item.name,
              language: lang,
              district: item.district,
              status: 'failed',
              error: twilioData.message || 'Twilio call failed',
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

        // Add to call records as queued
        existingCalls.unshift({
          session_id: sessionId,
          case_id: caseId,
          phone: cleanPhone,
          beneficiary_name: item.name || 'Queued Beneficiary',
          channel: 'ivr',
          language: lang,
          status: 'QUEUED',
          citizen_confirmed: false,
          notification_status: 'QUEUED',
          completed_at: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          confirmed_fields: {
            local_economic_context: item.district || 'Namakkal',
          },
          turns_count: 0,
          transcript: [],
        });
      }
    }

    // Persist updated records
    try {
      fs.writeFileSync(callsFilePath, JSON.stringify(existingCalls, null, 2), 'utf8');
    } catch {
      // non-fatal
    }

    const dispatchedCount = results.filter((r) => r.status === 'dispatched').length;
    const queuedCount = results.filter((r) => r.status === 'queued').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

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
