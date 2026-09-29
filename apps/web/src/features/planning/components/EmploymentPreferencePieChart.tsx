'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { PieChart as PieIcon } from 'lucide-react';
import type { EmploymentSplitItem } from '../types';

interface Props {
  data: EmploymentSplitItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: EmploymentSplitItem }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs shadow-lg min-w-[150px]">
      <p className="font-bold text-slate-900 mb-1">{d.name}</p>
      <p className="text-slate-500">
        Beneficiaries:{' '}
        <strong className="text-[#0B3064] font-mono">{d.value}</strong>
      </p>
    </div>
  );
};

const RADIAN = Math.PI / 180;

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.08) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 10, fontWeight: 700 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function EmploymentPreferencePieChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFF4ED] border border-[#FDD8C2] flex items-center justify-center">
            <PieIcon className="w-4 h-4 text-[#C24810]" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
              Employment Mode Split
            </h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Beneficiary preference across self, wage & home enterprise
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        <div className="h-[190px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderLabel}
              >
                {data.map((e, i) => (
                  <Cell key={i} fill={e.fill} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
          {data.map((e) => {
            const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
            return (
              <div key={e.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ background: e.fill }}
                    />
                    <span className="text-slate-700 font-semibold">{e.name}</span>
                  </div>
                  <span className="font-bold font-mono text-slate-900">
                    {e.value} <span className="text-slate-400 font-normal">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: e.fill }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
