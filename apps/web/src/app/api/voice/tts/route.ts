import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, language = 'ta' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const voiceApiUrl = process.env.VOICE_API_URL || 'http://127.0.0.1:8000';
    const langCode = language.slice(0, 2).toLowerCase();

    const res = await fetch(`${voiceApiUrl}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: langCode,
      }),
    });

    if (!res.ok) {
      throw new Error(`Voice API returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error in /api/voice/tts route:', err);
    return NextResponse.json(
      { status: 'failed', error: err.message || 'TTS synthesis failed' },
      { status: 500 }
    );
  }
}
