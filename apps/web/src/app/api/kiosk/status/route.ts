import { NextRequest, NextResponse } from 'next/server';
import { getAllOfficerCases, getCaseDetail } from '@/lib/recommendation-service';
import { getSanctionVerification } from '@/lib/sanction-verification';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ error: 'Please enter a mobile number or Case ID' }, { status: 400 });
    }

    const cleanQuery = query.toLowerCase();
    const cases = await getAllOfficerCases();

    // Match by case_id
    const matched = cases.filter((c) =>
      c.case_id.toLowerCase().includes(cleanQuery)
    );

    // If query looks like a phone number (digits >= 5), check details
    const digitQuery = query.replace(/\D/g, '');
    if (matched.length === 0 && digitQuery.length >= 5) {
      for (const c of cases) {
        try {
          const detail = await getCaseDetail(c.case_id);
          if (detail?.phone && detail.phone.replace(/\D/g, '').includes(digitQuery)) {
            matched.push(c);
          }
        } catch {}
      }
    }

    if (matched.length === 0) {
      return NextResponse.json(
        { found: false, message: 'No registered applications found matching that reference.' },
        { status: 404 }
      );
    }

    const results = await Promise.all(
      matched.slice(0, 5).map(async (c) => {
        let sanctionOrder = null;
        try {
          sanctionOrder = await getSanctionVerification(c.case_id);
        } catch {}

        return {
          case_id: c.case_id,
          district: c.district,
          created_at: c.created_at,
          officer_action: c.officer_action || 'pending',
          trade_name: c.top_trade || 'Vocational Pathway Evaluation',
          qp_code: c.qp_code,
          nsqf_level: c.nsqf_level,
          sanction_order_id: sanctionOrder?.sanction_order_id || null,
          total_entitlement: sanctionOrder?.total_entitlement || null,
        };
      })
    );

    return NextResponse.json({ found: true, cases: results });
  } catch (err: any) {
    console.error('[Kiosk Status API] Lookup error:', err);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
