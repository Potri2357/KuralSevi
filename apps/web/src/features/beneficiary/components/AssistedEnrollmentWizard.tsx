'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { StepBeneficiaryInfo } from './StepBeneficiaryInfo';
import { StepMandatedFields } from './StepMandatedFields';
import { StepConsentSubmit } from './StepConsentSubmit';
import type { BeneficiaryFormData, MandatedFieldsData } from '../types';

export function AssistedEnrollmentWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BeneficiaryFormData>({
    district: '',
    state: 'Tamil Nadu',
    language: 'ta',
    gender: '',
    age_group: '',
    channel_used: 'field_worker',
  });
  const [fields, setFields] = useState<MandatedFieldsData>({
    educational_background: '',
    family_occupation: '',
    current_livelihood: '',
    skills_and_interests: '',
    mobility_constraints: '',
    employment_preference: 'either',
    local_economic_context: '',
  });

  const handleSubmit = () => {
    alert('Profile submitted! Recommendation engine will process this shortly.');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assisted Enrollment (FR-5)</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          Field-worker assisted entry for beneficiaries unable to use IVR or WhatsApp.
        </p>
        <Badge variant="amber" className="mt-2">Fallback path — Voice channel preferred</Badge>
      </div>

      <div className="flex items-center gap-2">
        {['Beneficiary Info', '7 PS Fields', 'Consent & Submit'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${step === i + 1 ? 'bg-indigo-600 text-white' : step > i + 1 ? 'bg-emerald-600 text-white' : 'bg-white/10 text-[var(--text-muted)]'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs ${step === i + 1 ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
              {s}
            </span>
            {i < 2 && <span className="text-[var(--text-muted)]">›</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <StepBeneficiaryInfo form={form} onChange={setForm} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <StepMandatedFields fields={fields} onChange={setFields} onBack={() => setStep(1)} onNext={() => setStep(3)} />
      )}
      {step === 3 && (
        <StepConsentSubmit onBack={() => setStep(2)} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
