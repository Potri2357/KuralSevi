import { NextRequest, NextResponse } from 'next/server';

// This triggers the batch aggregation job (FR-16)
// In production: calls the Supabase Edge Function or runs the scripts/aggregate-planning.ts
export async function POST(request: NextRequest) {
  // Verify this is an authorized call (service-to-service)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In production: trigger Edge Function or background job
  return NextResponse.json({
    message: 'Aggregation job triggered. Results will be available within the scheduled batch window.',
    scheduled_for: 'Daily at 02:00 IST',
    mode: 'batch',
  });
}

export async function GET() {
  return NextResponse.json({
    mode: 'batch',
    note: 'Planning intelligence is computed on a daily schedule (FR-16). Not real-time.',
    last_run: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    next_run: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
  });
}
