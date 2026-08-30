'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

export function StepConsentSubmit({ onBack, onSubmit }: Props) {
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-sm">Consent & Submit (FR-13)</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="glass rounded-xl p-4 border border-indigo-500/20">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The beneficiary has been informed: this information will be used only for NSQF-aligned skilling recommendations
            and district planning under PM-AJAY GIA. Data is protected under DPDP Act 2023. They can withdraw at any time.
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            id="consent-checkbox"
            type="checkbox"
            checked={consentConfirmed}
            onChange={e => setConsentConfirmed(e.target.checked)}
            className="mt-0.5 accent-indigo-500"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            I confirm the beneficiary has given verbal consent in their preferred language.
          </span>
        </label>
      </CardContent>
      <CardFooter>
        <div className="flex gap-3 w-full">
          <Button id="step3-back" variant="secondary" onClick={onBack}>
            ← Back
          </Button>
          <Button
            id="submit-enrollment"
            onClick={onSubmit}
            disabled={!consentConfirmed}
            className="ml-auto"
          >
            Submit Enrollment
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
