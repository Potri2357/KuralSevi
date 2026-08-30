'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { ExportOption } from '../types';

interface Props {
  option: ExportOption;
  isExporting: boolean;
  onExport: (type: string, format: 'json' | 'csv') => void;
}

export function ExportCard({ option, isExporting, onExport }: Props) {
  return (
    <Card className="border-white/8">
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">{option.title}</h3>
          <Badge variant={option.badgeVariant}>{option.badge}</Badge>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{option.desc}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Included Fields</p>
          <div className="flex flex-wrap gap-1">
            {option.fields.map(f => (
              <span key={f} className="text-[10px] bg-white/5 text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-white/8">
                {f}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            id={`export-${option.id}-json`}
            size="sm"
            variant="secondary"
            loading={isExporting}
            onClick={() => onExport(option.id, 'json')}
          >
            JSON
          </Button>
          <Button
            id={`export-${option.id}-csv`}
            size="sm"
            variant="secondary"
            loading={isExporting}
            onClick={() => onExport(option.id, 'csv')}
          >
            CSV
          </Button>
          <Button
            id={`export-${option.id}-rest`}
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/api/export?type=${option.id}`, '_blank')}
          >
            REST API ↗
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
