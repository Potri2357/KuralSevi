'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Props {
  caseId: string;
  onSubmitted?: () => void;
}

export function OfficerActionPanel({ caseId, onSubmitted }: Props) {
  const [action, setAction] = useState<'approved' | 'modified' | 'rejected' | null>(null);
  const [beneficiaryDecision, setBeneficiaryDecision] = useState('pending');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!action) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/cases/${caseId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          beneficiary_decision: beneficiaryDecision,
          officer_notes: notes,
        }),
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (e) {
      console.error('Failed to submit officer decision:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-500/20">
        <CardContent className="py-6 text-center">
          <span className="text-4xl mb-3 block">✓</span>
          <h3 className="text-lg font-semibold text-emerald-300 mb-2">Decision Recorded</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Case actioned: <strong>{action}</strong>. Beneficiary: <strong>{beneficiaryDecision}</strong>.
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Logged to audit trail. District planning aggregates update tonight.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-500/20">
      <CardHeader>
        <h3 className="font-semibold text-[var(--text-primary)]">Officer Action (FR-10)</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Record your decision and the beneficiary&apos;s response. Every case must reach a terminal state.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Officer Decision</label>
            <div className="flex flex-col gap-2">
              {([
                ['approved', '✓ Approve recommendation', 'emerald'],
                ['modified', '✎ Modify recommendation', 'amber'],
                ['rejected', '✕ Reject recommendation', 'rose'],
              ] as const).map(([val, label, color]) => (
                <button
                  key={val}
                  id={`action-${val}`}
                  onClick={() => setAction(val)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg text-sm border transition-all',
                    action === val
                      ? `bg-${color}-500/15 border-${color}-500/40 text-${color}-300 font-medium`
                      : 'glass border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Beneficiary Response</label>
            <div className="flex flex-col gap-2">
              {[
                ['interested', 'Interested'],
                ['not_interested', 'Not Interested'],
                ['wants_to_discuss', 'Wants to Discuss'],
                ['unable_to_participate', 'Unable to Participate'],
              ].map(([val, label]) => (
                <button
                  key={val}
                  id={`decision-${val}`}
                  onClick={() => setBeneficiaryDecision(val)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg text-sm border transition-all',
                    beneficiaryDecision === val
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-medium'
                      : 'glass border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Officer Notes</label>
          <textarea
            id="officer-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add context, local observations, or referral details..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 resize-none"
          />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-[var(--text-muted)]">This action will be logged to the immutable audit trail.</p>
          <Button id="submit-action" onClick={handleSubmit} disabled={!action} loading={isSubmitting}>
            Submit Decision
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
