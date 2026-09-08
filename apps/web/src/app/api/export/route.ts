import { NextRequest, NextResponse } from 'next/server';
import { getAllOfficerCases, loadCompletedCalls, getDistrictPlanningMetrics } from '@/lib/recommendation-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'case-data';
  const format = searchParams.get('format') ?? 'json';

  let data: Record<string, unknown>[] = [];
  let filename = 'export';

  if (type === 'case-data' || type === 'officer-actions') {
    const cases = await getAllOfficerCases();
    data = cases.map((c) => ({
      case_id: c.case_id,
      district: c.district,
      state: c.state,
      top_trade: c.top_trade,
      qp_code: c.qp_code,
      nsqf_level: c.nsqf_level,
      pathway_type: c.pathway_type,
      confidence: c.confidence,
      officer_action: c.officer_action,
      days_pending: c.days_pending,
      sla_deadline: c.sla_deadline,
      created_at: c.created_at,
    }));
    filename = 'kural-sevi-cases';
  } else if (type === 'planning-data') {
    const metrics = await getDistrictPlanningMetrics();
    data = [
      {
        totalBeneficiaries: metrics.totalBeneficiaries,
        completedProfiles: metrics.completedProfiles,
        mobilityConstraints: metrics.mobilityConstraints,
        midInterviewDropoffs: metrics.midInterviewDropoffs,
        topTradesSummary: metrics.topTrades.map((t) => `${t.name} (${t.count})`).join('; '),
        employmentSplit: metrics.employmentSplit.map((e) => `${e.name}: ${e.value}`).join('; '),
        export_date: new Date().toISOString(),
      },
    ];
    filename = 'kural-sevi-planning';
  } else if (type === 'recommendations') {
    const calls = loadCompletedCalls();
    const allRecs: Record<string, unknown>[] = [];
    const { getRecommendationsForCall } = await import('@/lib/recommendation-service');
    for (const call of calls) {
      const recs = await getRecommendationsForCall(call);
      for (const r of recs) {
        allRecs.push({
          case_id: call.case_id,
          phone_mask: call.phone.slice(0, 5) + 'XXXXX',
          rank: r.rank,
          qp_code: r.qp_code,
          qp_name: r.qp_name,
          nsqf_level: r.nsqf_level,
          pathway_type: r.pathway_type,
          confidence: r.confidence,
          topsis_score: r.topsis_score,
          income_range: r.income_range,
          opportunity_strength: r.opportunity.strength,
          explanation: r.explanation,
        });
      }
    }
    data = allRecs;
    filename = 'kural-sevi-recommendations';
  }

  if (format === 'csv') {
    if (data.length === 0) return new NextResponse('No data', { status: 204 });
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
      ),
    ].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  }

  return NextResponse.json({
    data,
    count: data.length,
    exported_at: new Date().toISOString(),
    source: 'kural-sevi-live',
  });
}
