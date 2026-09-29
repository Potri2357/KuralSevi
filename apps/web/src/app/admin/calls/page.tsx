import { Metadata } from 'next';
import { getEnrichedCallRecords } from '@/lib/recommendation-service';
import { CallRecordsView } from '@/features/calls';

export const metadata: Metadata = {
  title: 'Citizen Call Records & Telephony Transcripts — Admin Console',
  description: 'Telephony voice recordings, AI transcriptions, and citizen intake logs.',
};

export const dynamic = 'force-dynamic';

export default async function AdminCallsPage() {
  const calls = await getEnrichedCallRecords();

  return (
    <div className="space-y-6">
      <CallRecordsView initialCalls={calls} />
    </div>
  );
}
