import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await request.json();
  const { action, beneficiary_decision, modified_recommendation, officer_notes } = body;

  if (!['approved', 'modified', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('officer_cases')
    .update({
      officer_action: action,
      beneficiary_decision: beneficiary_decision ?? 'pending',
      modified_recommendation: modified_recommendation ?? null,
      officer_notes: officer_notes ?? null,
      actioned_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log to audit trail
  await supabase.from('audit_log').insert({
    event_type: 'officer_action',
    entity_type: 'officer_case',
    entity_id: id,
    actor_type: 'officer',
    event_data: { action, beneficiary_decision, officer_notes },
  });

  return NextResponse.json({ success: true, case: data });
}
