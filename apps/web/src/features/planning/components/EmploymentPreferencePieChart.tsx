'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { EmploymentSplitItem } from '../types';

interface Props {
  data: EmploymentSplitItem[];
}

export function EmploymentPreferencePieChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-[var(--text-primary)]">Employment Preference Split</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8b9dc3' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-2">
          {data.map(e => (
            <div key={e.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: e.fill }} />
                <span className="text-[var(--text-secondary)]">{e.name}</span>
              </div>
              <span className="font-semibold" style={{ color: e.fill }}>{e.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
