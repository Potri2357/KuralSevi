import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getEnvVar(key: string, defaultValue = ''): string {
  if (process.env[key]) return process.env[key]!;

  // Fallback to checking root .env file
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

    const accountSid = getEnvVar('TWILIO_ACCOUNT_SID');
    const authToken = getEnvVar('TWILIO_AUTH_TOKEN');
    const fromNumber = getEnvVar('TWILIO_PHONE_NUMBER');
    const voiceApiUrl = getEnvVar('VOICE_API_URL', 'https://charita-techiest-histogenetically.ngrok-free.dev');

    const cliCommand = `python3 scripts/trigger-outbound-call.py ${cleanPhone} ${language}`;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are not configured in environment.',
          command: cliCommand,
        },
        { status: 500 }
      );
    }

    const webhookUrl = `${voiceApiUrl}/webhooks/twilio/interview-start?language=${encodeURIComponent(language)}`;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
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

    if (!twilioRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: twilioData.message || `Twilio call dispatch failed with status ${twilioRes.status}`,
          code: twilioData.code,
          command: cliCommand,
        },
        { status: twilioRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Outbound call initiated to ${cleanPhone}. The beneficiary's phone will ring shortly.`,
      call_sid: twilioData.sid,
      status: twilioData.status,
      to: twilioData.to,
      from: twilioData.from,
      language,
      command: cliCommand,
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
