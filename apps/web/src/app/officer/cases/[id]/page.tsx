import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { CaseDetailView } from '@/features/cases';
import { getCaseDetail } from '@/lib/recommendation-service';

export const dynamic = 'force-dynamic';

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const targetId = resolved.id;

  try {
    const liveCase = await getCaseDetail(targetId);
    if (liveCase) {
      return <CaseDetailView caseData={liveCase} />;
    }
  } catch (err) {
    console.error(`Error loading live case detail for ${targetId}:`, err);
  }

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-[#0B3064] mb-2 font-display">Case Not Found</h1>
      <p className="text-slate-600 mb-6 text-sm">
        No case record found for identifier <code className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-800">{targetId}</code>.
      </p>
      <Link
        href="/officer/cases"
        className="inline-flex items-center gap-2 bg-[#0B3064] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#144282] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Case Queue</span>
      </Link>
    </div>
  );
}
