'use client';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowRight, User } from 'lucide-react';
import type { BeneficiaryFormData } from '../types';

interface Props {
  form: BeneficiaryFormData;
  onChange: (form: BeneficiaryFormData) => void;
  onNext: () => void;
}

const DISTRICT_OPTIONS = [
  'Namakkal',
  'Tiruppur',
  'Salem',
  'Coimbatore',
  'Erode',
  'Madurai',
  'Tiruchirappalli',
  'Dindigul',
  'Thanjavur',
  'Chennai',
];

const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-60'];

export function StepBeneficiaryInfo({ form, onChange, onNext }: Props) {
  const handleChange = (key: keyof BeneficiaryFormData, value: string) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-sm text-[var(--text-primary)]">
            Step 1: Beneficiary Basic Information & Demographics
          </h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Capture administrative district and spoken dialect for appropriate local matching
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* District Dropdown */}
          <div>
            <label
              htmlFor="field-district"
              className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5 block"
            >
              District (Tamil Nadu) <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-district"
              name="district"
              value={form.district}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[44px] shadow-2xs"
            >
              {DISTRICT_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="field-gender"
              className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5 block"
            >
              Gender <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-gender"
              name="gender"
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[44px] shadow-2xs"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Transgender">Transgender</option>
            </select>
          </div>

          {/* Age Group */}
          <div>
            <label
              htmlFor="field-age-group"
              className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5 block"
            >
              Age Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-age-group"
              name="age_group"
              value={form.age_group}
              onChange={(e) => handleChange('age_group', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[44px] shadow-2xs"
            >
              {AGE_GROUPS.map((a) => (
                <option key={a} value={a}>
                  {a} years
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Language */}
          <div>
            <label
              htmlFor="field-language"
              className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5 block"
            >
              Preferred Spoken Language <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-language"
              name="language"
              value={form.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[44px] shadow-2xs"
            >
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
            </select>
          </div>
        </div>

        {/* Optional Phone */}
        <div>
          <label
            htmlFor="field-phone"
            className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5 block"
          >
            Beneficiary Contact Phone (Optional)
          </label>
          <input
            id="field-phone"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210 (Used solely for IVR dispatch and audio recommendations readback)"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] shadow-2xs"
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Phone numbers are encrypted using AES-256-GCM and stored only during the active intake session.
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-end w-full">
          <Button id="step1-next" onClick={onNext}>
            <span>Continue to Mandated Fields</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
