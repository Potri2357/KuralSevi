import { NextResponse } from 'next/server';
import { getAllOfficerCases } from '@/lib/recommendation-service';

export async function GET() {
  try {
    const liveCallCases = await getAllOfficerCases();
    return NextResponse.json({
      cases: liveCallCases,
      count: liveCallCases.length,
      liveCallsCount: liveCallCases.length,
    });
  } catch (err: any) {
    console.error('Error fetching officer cases:', err);
    return NextResponse.json(
      { cases: [], count: 0, error: err?.message },
      { status: 500 }
    );
  }
}
