import { NextRequest, NextResponse } from 'next/server';
import { getCaseDetail } from '@/lib/recommendation-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const detail = await getCaseDetail(id);
    if (detail) {
      return NextResponse.json(detail);
    }
  } catch (err) {
    console.error(`Error loading case detail for ${id}:`, err);
  }

  return NextResponse.json({ error: 'Case not found', id }, { status: 404 });
}
