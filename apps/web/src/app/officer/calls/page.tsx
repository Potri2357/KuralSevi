import { Metadata } from 'next';
import { getEnrichedCallRecords } from '@/lib/recommendation-service';
import { CallRecordsView } from '@/features/calls';

export const metadata: Metadata = {
  title: 'Call Records & Telephony Transcripts — Kural Sevi',
  description: 'Real-time PM-AJAY voice intake logs, vernacular transcripts, citizen SMS confirmations, and NSQF pathway linkages.',
};

export const dynamic = 'force-dynamic';

export default async function OfficerCallsPage() {
  const calls = await getEnrichedCallRecords();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in-50 duration-300">
      <CallRecordsView initialCalls={calls} />
    </main>
  );
}
