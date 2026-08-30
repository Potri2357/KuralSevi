import { NextRequest, NextResponse } from 'next/server';

// Proxies WhatsApp webhooks to the voice-api FastAPI service
export async function GET(request: NextRequest) {
  const voiceApiUrl = process.env.VOICE_API_URL ?? 'http://localhost:8000';
  const { search } = new URL(request.url);
  const response = await fetch(`${voiceApiUrl}/webhooks/whatsapp/${search}`);
  return new NextResponse(await response.text());
}

export async function POST(request: NextRequest) {
  const voiceApiUrl = process.env.VOICE_API_URL ?? 'http://localhost:8000';
  const body = await request.json();
  const response = await fetch(`${voiceApiUrl}/webhooks/whatsapp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await response.json());
}
