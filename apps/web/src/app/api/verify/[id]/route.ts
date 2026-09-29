import { NextRequest, NextResponse } from 'next/server';
import { getSanctionVerification } from '@/lib/sanction-verification';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { verified: false, error: 'Sanction Order ID or Case ID is required.' },
        { status: 400 }
      );
    }

    const cleanId = decodeURIComponent(id.trim());
    const record = await getSanctionVerification(cleanId);

    if (!record) {
      return NextResponse.json(
        {
          verified: false,
          error: `No sanction record found for ID: ${cleanId}. Please check the QR code or Sanction Order reference.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verified: true,
      record,
    });
  } catch (err: any) {
    console.error('[API Verify] Error verifying ID:', err);
    return NextResponse.json(
      { verified: false, error: err?.message || 'Verification lookup failed.' },
      { status: 500 }
    );
  }
}
