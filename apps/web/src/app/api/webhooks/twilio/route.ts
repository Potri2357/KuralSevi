import { NextRequest, NextResponse } from 'next/server';

// Proxies Twilio webhooks to the voice-api FastAPI service
export async function POST(request: NextRequest) {
  const voiceApiUrl = process.env.VOICE_API_URL ?? 'http://localhost:8000';
  const body = await request.text();

  const response = await fetch(`${voiceApiUrl}/webhooks/twilio/interview-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const xml = await response.text();
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
