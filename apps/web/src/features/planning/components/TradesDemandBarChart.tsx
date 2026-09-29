'use client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BarChart3, TrendingUp } from 'lucide-react';
import type { TradeDemandItem } from '../types';

interface Props {
  data: TradeDemandItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: string | number; color?: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs shadow-lg min-w-[180px]">
      <p className="font-extrabold text-[#0B3064] mb-1.5 leading-snug">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="text-slate-500 font-medium">Beneficiary Demand</span>
          <span className="text-[#0B3064] font-mono font-bold">{p.value} case{Number(p.value) !== 1 ? 's' : ''}</span>
        </div>
      ))}
    </div>
  );
};

function truncateTrade(name: string, maxLen = 22): string {
  const parts = name.split(' ');
  // Remove generic prefix words
  const filtered = parts.filter(
    (w) => !['technician', '-', 'operator', 'assistant', 'and'].includes(w.toLowerCase())
  );
  const short = filtered.slice(0, 3).join(' ');
  return short.length > maxLen ? short.slice(0, maxLen - 1) + '…' : short;
}

export function TradesDemandBarChart({ data }: Props) {
  const chartData = data.slice(0, 8).map((d) => ({
    ...d,
    shortName: truncateTrade(d.name),
  }));

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#0B3064]" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-[#0B3064]">
                Most Requested Vocational Trades
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Top NSQF QP-NOS roles by beneficiary demand
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2.5 py-1 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{data.length} trades identified</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="30%" layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, maxCount + 1]}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                width={130}
                tick={{ fill: '#334155', fontSize: 10.5, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11, 48, 100, 0.05)' }} />
              <Bar dataKey="count" radius={[0, 5, 5, 0]} maxBarSize={22}>
                {chartData.map((t, i) => (
                  <Cell key={i} fill={t.fill || '#0B3064'} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  formatter={(v: number) => `${v}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend chips */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 mt-2">
          {chartData.slice(0, 5).map((d, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border"
              style={{
                background: `${d.fill}15`,
                borderColor: `${d.fill}40`,
                color: d.fill,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: d.fill }}
              />
              {d.shortName}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
