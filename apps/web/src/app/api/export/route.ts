import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'case-data';
  const format = searchParams.get('format') ?? 'json';

  let data: Record<string, unknown>[] = [];
  let filename = 'export';

  if (type === 'case-data') {
    const { data: cases } = await supabase
      .from('officer_cases')
      .select('id, district, state, officer_action, beneficiary_decision, created_at, sla_deadline, consultant_referral_status')
      .order('created_at', { ascending: false })
      .limit(1000);
    data = (cases ?? []) as Record<string, unknown>[];
    filename = 'kural-sevi-cases';
  } else if (type === 'planning-data') {
    const { data: aggs } = await supabase
      .from('planning_aggregates')
      .select('*')
      .order('aggregation_date', { ascending: false })
      .limit(50);
    data = (aggs ?? []) as Record<string, unknown>[];
    filename = 'kural-sevi-planning';
  } else if (type === 'recommendations') {
    const { data: recs } = await supabase
      .from('recommendations')
      .select('id, qp_code, nsqf_level, pathway_type, confidence_label, explanation_text, topsis_score, created_at')
      .limit(1000);
    data = (recs ?? []) as Record<string, unknown>[];
    filename = 'kural-sevi-recommendations';
  }

  if (format === 'csv') {
    if (data.length === 0) return new NextResponse('No data', { status: 204 });
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      }
    });
  }

  return NextResponse.json({ data, count: data.length, exported_at: new Date().toISOString(), source: 'kural-sevi' });
}
