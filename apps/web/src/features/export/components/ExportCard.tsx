'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileJson, FileSpreadsheet, ExternalLink } from 'lucide-react';
import type { ExportOption } from '../types';

interface Props {
  option: ExportOption;
  isExporting: boolean;
  onExport: (type: string, format: 'json' | 'csv') => void;
}

export function ExportCard({ option, isExporting, onExport }: Props) {
  return (
    <Card className="bg-[var(--bg-card)] border-[var(--border)] flex flex-col justify-between shadow-2xs">
      <div>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-sm sm:text-base text-[#0B3064] leading-tight">
              {option.title}
            </h3>
            <Badge variant={option.badgeVariant}>{option.badge}</Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            {option.desc}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2">
              Export Schema Fields
            </p>
            <div className="flex flex-wrap gap-1.5">
              {option.fields.map((f) => (
                <span
                  key={f}
                  className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 font-bold shadow-2xs"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </div>

      <div className="p-4 border-t border-[var(--border-subtle)] bg-slate-50 rounded-b-xl">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            id={`export-${option.id}-json`}
            size="sm"
            variant="secondary"
            loading={isExporting}
            onClick={() => onExport(option.id, 'json')}
            className="text-xs font-bold shadow-2xs"
          >
            <FileJson className="w-3.5 h-3.5 text-[#0B3064]" />
            <span>JSON</span>
          </Button>

          <Button
            id={`export-${option.id}-csv`}
            size="sm"
            variant="secondary"
            loading={isExporting}
            onClick={() => onExport(option.id, 'csv')}
            className="text-xs font-bold shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A783C]" />
            <span>CSV Table</span>
          </Button>

          <Button
            id={`export-${option.id}-rest`}
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/api/export?type=${option.id}`, '_blank')}
            className="text-xs font-bold ml-auto text-slate-600 hover:text-[#0B3064]"
          >
            <span>REST API</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
