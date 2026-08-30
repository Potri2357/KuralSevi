'use client';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import type { MandatedFieldsData } from '../types';

interface Props {
  fields: MandatedFieldsData;
  onChange: (fields: MandatedFieldsData) => void;
  onBack: () => void;
  onNext: () => void;
}

const FIELD_CONFIG: Array<{
  key: keyof MandatedFieldsData;
  label: string;
  helper: string;
  placeholder: string;
}> = [
  {
    key: 'current_livelihood',
    label: '1. Current Livelihood & Daily/Monthly Earnings',
    helper: 'Elicit current primary source of income, seasonal fluctuations, and approximate monthly earnings.',
    placeholder: 'e.g. Daily wage agricultural labour, seasonal during harvest, ~₹4,500/month',
  },
  {
    key: 'skills_and_interests',
    label: '2. Existing Practical Skills & Expressed Trade Interests',
    helper: 'Identify hand-skills, prior trade exposures, or specific vocational ambitions.',
    placeholder: 'e.g. Basic hand-stitching, knows household cooking; interested in tailoring or food processing',
  },
  {
    key: 'mobility_constraints',
    label: '3. Mobility Constraints & Caregiving Responsibilities',
    helper: 'Record physical travel limits (km from habitation), childcare/eldercare, or disability status.',
    placeholder: 'e.g. Can travel up to 8km to block headquarters; 2 young children at home',
  },
  {
    key: 'educational_background',
    label: '4. Educational Attainment & Literacy Level',
    helper: 'Record formal schooling completed and regional language reading/writing proficiency.',
    placeholder: 'e.g. 8th standard completed, can read and write Tamil fluently',
  },
  {
    key: 'family_occupation',
    label: '5. Family & Generational Occupation Heritage',
    helper: 'Traditional family craft, artisanal lineage, or agricultural background.',
    placeholder: 'e.g. Traditional handloom weaving family; parents and grandparents were weavers',
  },
  {
    key: 'employment_preference',
    label: '6. Preferred Mode of Work',
    helper: 'Self-employment / micro-enterprise vs structured wage employment.',
    placeholder: '',
  },
  {
    key: 'local_economic_context',
    label: '7. Local Habitation / Village Economic Ecosystem',
    helper: 'Availability of weekly shandy/markets, MSME clusters, Common Service Centres (CSC), or SHGs.',
    placeholder: 'e.g. Textile cluster nearby, weekly Monday market in village, active women SHG group',
  },
];

export function StepMandatedFields({ fields, onChange, onBack, onNext }: Props) {
  const setField = <K extends keyof MandatedFieldsData>(key: K, value: MandatedFieldsData[K]) => {
    onChange({ ...fields, [key]: value });
  };

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-sm text-[var(--text-primary)]">
            Step 2: 7 PM-AJAY Mandated Profile Dimensions
          </h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          All 7 dimensions are required to feed the multi-criteria NSQF recommendation algorithm
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {FIELD_CONFIG.map((f) => (
          <div key={f.key} className="space-y-1.5 border-b border-[var(--border-subtle)] pb-4 last:border-0 last:pb-0">
            <label
              htmlFor={`mandated-field-${f.key}`}
              className="text-xs text-slate-900 font-bold uppercase tracking-wider block"
            >
              {f.label}
            </label>
            <p className="text-xs text-[var(--text-muted)]">{f.helper}</p>

            {f.key === 'employment_preference' ? (
              <select
                id={`mandated-field-${f.key}`}
                name={f.key}
                value={fields[f.key]}
                onChange={(e) =>
                  setField(
                    'employment_preference',
                    e.target.value as MandatedFieldsData['employment_preference']
                  )
                }
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] cursor-pointer shadow-2xs"
              >
                <option value="self">Self-Employment / Micro-Enterprise</option>
                <option value="wage">Wage Employment (Salary / Factory)</option>
                <option value="either">Open to Either Self or Wage Employment</option>
              </select>
            ) : (
              <textarea
                id={`mandated-field-${f.key}`}
                name={f.key}
                value={fields[f.key]}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={2}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-2xs"
              />
            )}
          </div>
        ))}
      </CardContent>

      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <Button id="step2-back" variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <Button id="step2-next" onClick={onNext}>
            <span>Continue to DPDP Consent</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
