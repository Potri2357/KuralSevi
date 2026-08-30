'use client';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { BeneficiaryFormData } from '../types';

interface Props {
  form: BeneficiaryFormData;
  onChange: (form: BeneficiaryFormData) => void;
  onNext: () => void;
}

export function StepBeneficiaryInfo({ form, onChange, onNext }: Props) {
  const handleChange = (key: keyof BeneficiaryFormData, value: string) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-sm">Beneficiary Information</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { label: 'District', key: 'district' as const, placeholder: 'e.g. Namakkal' },
          { label: 'Gender', key: 'gender' as const, placeholder: 'Female / Male / Other' },
          { label: 'Age Group', key: 'age_group' as const, placeholder: 'e.g. 26-35' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
              {f.label}
            </label>
            <input
              id={`field-${f.key}`}
              value={form[f.key]}
              onChange={e => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        ))}
        <div>
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
            Interview Language
          </label>
          <select
            id="field-language"
            value={form.language}
            onChange={e => handleChange('language', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] focus:outline-none"
          >
            <option value="ta">Tamil</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
          </select>
        </div>
      </CardContent>
      <CardFooter>
        <Button id="step1-next" onClick={onNext} className="ml-auto">
          Next →
        </Button>
      </CardFooter>
    </Card>
  );
}
