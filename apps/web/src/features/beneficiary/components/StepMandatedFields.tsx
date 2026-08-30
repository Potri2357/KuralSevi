'use client';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { MandatedFieldsData } from '../types';

interface Props {
  fields: MandatedFieldsData;
  onChange: (fields: MandatedFieldsData) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepMandatedFields({ fields, onChange, onBack, onNext }: Props) {
  const setField = <K extends keyof MandatedFieldsData>(key: K, value: MandatedFieldsData[K]) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-sm">7 PS-Mandated Fields (FR-2)</h3>
        <p className="text-xs text-[var(--text-muted)]">
          All fields must be confirmed with the beneficiary before submission (FR-3).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(fields) as (keyof MandatedFieldsData)[]).map(key => (
          <div key={key}>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
              {key.replace(/_/g, ' ')}
            </label>
            {key === 'employment_preference' ? (
              <select
                id={`field-${key}`}
                value={fields[key]}
                onChange={e => setField('employment_preference', e.target.value as MandatedFieldsData['employment_preference'])}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] focus:outline-none"
              >
                <option value="wage">Wage Employment</option>
                <option value="self">Self Employment</option>
                <option value="either">Either</option>
              </select>
            ) : (
              <textarea
                id={`field-${key}`}
                value={fields[key]}
                onChange={e => setField(key, e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <div className="flex gap-3 w-full">
          <Button id="step2-back" variant="secondary" onClick={onBack}>
            ← Back
          </Button>
          <Button id="step2-next" onClick={onNext} className="ml-auto">
            Next →
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
