'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

export function StepConsentSubmit({ onBack, onSubmit }: Props) {
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-2xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0B3064]" />
          <h2 className="font-bold text-sm text-[#0B3064]">
            Step 3: DPDP Act 2023 Consent & Final Verification
          </h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Explicit verbal consent must be affirmed before biometric or profile data submission
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="bg-[#EAF1FB] rounded-xl p-4 border border-[#BACEEB] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B3064] uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-[#0B3064]" />
            <span>DPDP Act 2023 Statutory Disclosure</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            The beneficiary has been verbally informed in their native language (Tamil / Telugu / Hindi):
            This profile data is collected solely for NSQF-aligned skilling recommendations, district livelihood planning, and GIA sanction support under PM-AJAY.
            Personal identifying information is strictly protected and not shared with unauthorized commercial third parties. The beneficiary maintains the statutory right to withdraw consent or request rectification.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label htmlFor="consent-affirmation-checkbox" className="flex items-start gap-3 cursor-pointer">
            <input
              id="consent-affirmation-checkbox"
              type="checkbox"
              checked={consentConfirmed}
              onChange={(e) => setConsentConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#0B3064] bg-white border-slate-300 focus:ring-[#0B3064] cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-800 font-bold leading-normal">
              I certify as the designated Field Worker / Animator that I have read the statutory notice to the beneficiary in their preferred language and obtained their explicit verbal consent.
            </span>
          </label>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <Button id="step3-back" variant="secondary" onClick={onBack} className="shadow-2xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <Button
            id="submit-enrollment"
            onClick={onSubmit}
            disabled={!consentConfirmed}
            variant="success"
            className="ml-auto font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Submit Beneficiary Profile</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
