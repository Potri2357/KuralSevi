'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BarChart3 } from 'lucide-react';
import type { TradeDemandItem } from '../types';

interface Props {
  data: TradeDemandItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: string | number;
    color?: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-md">
      <p className="font-bold text-slate-900 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-slate-600 font-medium">
          Beneficiary Demand: <strong className="text-[#0B3064] font-mono">{p.value} cases</strong>
        </p>
      ))}
    </div>
  );
};

export function TradesDemandBarChart({ data }: Props) {
  return (
    <Card className="xl:col-span-2 bg-[var(--bg-card)] border-[var(--border)] shadow-2xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#0B3064]" />
          <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
            Most Requested Vocational Trades (Top 7 QP-NOS Roles)
          </h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Derived from top-ranked recommendation pathways across verified beneficiary profiles
        </p>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11, 48, 100, 0.05)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((t, i) => (
                  <Cell key={i} fill={t.fill || '#0B3064'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
