import { NextResponse } from 'next/server';
import { getEnrichedCallRecords } from '@/lib/recommendation-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const calls = await getEnrichedCallRecords();
    const confirmedCount = calls.filter((c) => c.citizen_confirmed).length;

    return NextResponse.json({
      calls,
      total: calls.length,
      confirmedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error fetching enriched call records:', err);
    return NextResponse.json(
      { calls: [], total: 0, error: err?.message },
      { status: 500 }
    );
  }
}
