'use client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';
import type { MonthlyTrendItem } from '../types';

interface Props {
  data: MonthlyTrendItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs shadow-lg min-w-[160px]">
      <p className="font-bold text-[#0B3064] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-slate-600 font-medium capitalize">{p.name}</span>
          </div>
          <span className="font-mono font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function MonthlyIntakeTrendChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EDF9F1] border border-[#BBE8CB] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#0A783C]" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
                Monthly Intake Trend
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Total intakes vs confirmed beneficiary profiles
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B3064" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0B3064" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0A783C" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0A783C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748b', fontSize: 10.5, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '8px' }}
              />
              <Area
                type="monotone"
                dataKey="cases"
                name="Total Intakes"
                stroke="#0B3064"
                strokeWidth={2}
                fill="url(#gradCases)"
                dot={{ fill: '#0B3064', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#0B3064' }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Confirmed Profiles"
                stroke="#0A783C"
                strokeWidth={2}
                fill="url(#gradCompleted)"
                dot={{ fill: '#0A783C', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#0A783C' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
