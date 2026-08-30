'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { PieChart as PieIcon } from 'lucide-react';
import type { EmploymentSplitItem } from '../types';

interface Props {
  data: EmploymentSplitItem[];
}

export function EmploymentPreferencePieChart({ data }: Props) {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-[#0B3064]" />
          <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
            Employment Mode Split
          </h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Beneficiary preference distribution across self, wage, and home-based enterprise
        </p>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((e, i) => (
                  <Cell key={i} fill={e.fill} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#0f172a',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
          {data.map((e) => (
            <div key={e.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ background: e.fill }} />
                <span className="text-slate-700 font-semibold">{e.name}</span>
              </div>
              <span className="font-bold font-mono text-slate-900">{e.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
