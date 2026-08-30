'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertTriangle, XCircle, FileEdit, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  caseId: string;
  onSubmitted?: () => void;
}

type OfficerActionType = 'approved' | 'modified' | 'rejected';

const DECISION_STYLES: Record<
  OfficerActionType,
  {
    active: string;
    inactive: string;
    icon: typeof CheckCircle2;
    label: string;
    badgeColor: string;
  }
> = {
  approved: {
    active: 'bg-[#EDF9F1] border-[#0A783C] text-[#0A783C] font-bold shadow-2xs ring-1 ring-[#0A783C]/30',
    inactive: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900',
    icon: CheckCircle2,
    label: 'Approve Recommendation & Issue Sanction Order',
    badgeColor: 'text-[#0A783C]',
  },
  modified: {
    active: 'bg-[#EAF1FB] border-[#0B3064] text-[#0B3064] font-bold shadow-2xs ring-1 ring-[#0B3064]/30',
    inactive: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900',
    icon: FileEdit,
    label: 'Modify Pathway or Assign Field Consultant',
    badgeColor: 'text-[#0B3064]',
  },
  rejected: {
    active: 'bg-[#FFF4ED] border-[#C24810] text-[#C24810] font-bold shadow-2xs ring-1 ring-[#C24810]/30',
    inactive: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900',
    icon: XCircle,
    label: 'Reject Recommendation (Requires Justification Note)',
    badgeColor: 'text-[#C24810]',
  },
};

const BENEFICIARY_RESPONSES = [
  { id: 'interested', label: 'Interested & Ready to Enroll' },
  { id: 'wants_to_discuss', label: 'Wants Further In-Person Discussion' },
  { id: 'not_interested', label: 'Not Interested in Suggested Trade' },
  { id: 'unable_to_participate', label: 'Unable to Participate (Family/Health)' },
];

export function OfficerActionPanel({ caseId, onSubmitted }: Props) {
  const [action, setAction] = useState<OfficerActionType | null>(null);
  const [beneficiaryDecision, setBeneficiaryDecision] = useState('interested');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!action) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/cases/${caseId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          beneficiary_decision: beneficiaryDecision,
          officer_notes: notes,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}: Failed to record decision`);
      }

      setSubmitted(true);
      onSubmitted?.();
    } catch (e: unknown) {
      console.error('Failed to submit officer decision:', e);
      const errMsg = e instanceof Error ? e.message : 'Network error occurred while submitting decision. Please retry.';
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-[#BBE8CB] bg-[#EDF9F1]/80 shadow-2xs">
        <CardContent className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB] flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-[#0A783C]">Official Decision Recorded</h3>
          <p className="text-sm text-slate-700 max-w-md mx-auto">
            Case action: <strong className="text-[#0B3064] capitalize">{action}</strong>. Beneficiary status:{' '}
            <strong className="text-slate-900">{beneficiaryDecision.replace(/_/g, ' ')}</strong>.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Logged to the permanent audit trail. District planning and ITI allocation updates will reflect overnight.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#BACEEB]/70 bg-[var(--bg-card)] shadow-2xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#0B3064]">
              Officer Sanction & Action Decision
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Review and record official decision under PM-AJAY GIA protocol. All terminal actions are logged with timestamp.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {submitError && (
          <div className="bg-[#FFF4ED] border border-[#FDD8C2] rounded-lg p-4 flex items-start gap-3 text-[#C24810]">
            <AlertCircle className="w-5 h-5 text-[#E05A1B] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold text-sm mb-0.5">Submission Failed</p>
              <p>{submitError}</p>
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={handleSubmit}
              className="shrink-0 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Decision Buttons */}
          <div>
            <label
              htmlFor="officer-decision-group"
              className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2.5 block"
            >
              1. Official Decision <span className="text-[#E05A1B]">*</span>
            </label>
            <div id="officer-decision-group" className="flex flex-col gap-2.5">
              {(['approved', 'modified', 'rejected'] as const).map((val) => {
                const item = DECISION_STYLES[val];
                const Icon = item.icon;
                const isSelected = action === val;
                return (
                  <button
                    key={val}
                    type="button"
                    id={`action-${val}`}
                    onClick={() => setAction(val)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg text-sm border transition-all flex items-center gap-3 cursor-pointer min-h-[48px]',
                      isSelected ? item.active : item.inactive
                    )}
                  >
                    <Icon className={cn('w-5 h-5 shrink-0', isSelected ? item.badgeColor : 'text-slate-400')} />
                    <span className="leading-snug">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Beneficiary Status */}
          <div>
            <label
              htmlFor="beneficiary-response-group"
              className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2.5 block"
            >
              2. Beneficiary Feedback / Readiness
            </label>
            <div id="beneficiary-response-group" className="flex flex-col gap-2.5">
              {BENEFICIARY_RESPONSES.map((item) => {
                const isSelected = beneficiaryDecision === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    id={`decision-${item.id}`}
                    onClick={() => setBeneficiaryDecision(item.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg text-sm border transition-all cursor-pointer min-h-[48px]',
                      isSelected
                        ? 'bg-[#EAF1FB] border-[#0B3064] text-[#0B3064] font-bold ring-1 ring-[#0B3064]/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Notes */}
        <div>
          <label
            htmlFor="officer-notes"
            className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2 block"
          >
            3. Officer Administrative Notes & Remarks
          </label>
          <textarea
            id="officer-notes"
            name="officer_notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add specific context, local ITI referral instructions, bank linkage details, or justification for modification/rejection..."
            rows={3}
            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#0B3064] focus:border-[#0B3064] resize-none shadow-2xs"
          />
        </div>

        {action === 'rejected' && (
          <div className="bg-[#FFF4ED] border border-[#FDD8C2] rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-[#C24810]">
            <AlertTriangle className="w-4 h-4 text-[#E05A1B] shrink-0 mt-0.5" />
            <p>
              <strong>Rejection Notice:</strong> Rejection removes this case from active sanction workflows. Please ensure mandatory officer notes describe the reason for audit compliance.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <p className="text-xs text-[var(--text-muted)]">
            Action will be officially committed under DSWO credentials.
          </p>
          <Button
            id="submit-action"
            onClick={handleSubmit}
            disabled={!action || isSubmitting}
            loading={isSubmitting}
            variant={action === 'approved' ? 'success' : action === 'rejected' ? 'danger' : 'primary'}
            className="w-full sm:w-auto"
          >
            {action === 'approved' ? 'Confirm & Issue Sanction' : action === 'rejected' ? 'Confirm Rejection' : 'Submit Official Decision'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
