'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileJson,
  FileSpreadsheet,
  ExternalLink,
  Download,
  Copy,
  Check,
  Code2,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';
import type { ExportOption } from '../types';

interface Props {
  option: ExportOption;
  isExporting: boolean;
  onExport: (type: string, format: 'json' | 'csv') => void;
}

export function ExportCard({ option, isExporting, onExport }: Props) {
  const [copied, setCopied] = useState(false);
  const CardIcon = option.icon;
  const BadgeIcon = option.badgeIcon;

  const handleCopyEndpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/api/export?type=${option.id}&format=json`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-white border-slate-200/80 hover:border-slate-300 rounded-2xl flex flex-col justify-between shadow-[0_1px_4px_0_rgba(11,48,100,0.04)] transition-all hover:shadow-[0_4px_16px_-4px_rgba(11,48,100,0.08)]">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 shadow-2xs ${option.iconBg} ${option.iconColor}`}
              >
                <CardIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#0B3064] leading-tight">
                  {option.title}
                </h3>
                {option.recordCount && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-slate-400" />
                      {option.recordCount}
                    </span>
                    {option.lastUpdated && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {option.lastUpdated}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Badge variant={option.badgeVariant} className="flex items-center gap-1 shrink-0 px-2.5 py-0.5">
              {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
              <span>{option.badge}</span>
            </Badge>
          </div>

          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
            {option.desc}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0B3064]" />
              <span>Export Schema Fields ({option.fields.length})</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {option.fields.map((f, i) => {
                const FieldIcon = f.icon;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-50 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/90 font-medium shadow-2xs hover:bg-slate-100/80 transition-colors"
                  >
                    {FieldIcon && <FieldIcon className="w-3 h-3 text-[#0B3064] shrink-0" />}
                    <span>{f.name}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </CardContent>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* JSON Export Button */}
          <Button
            id={`export-${option.id}-json`}
            size="sm"
            variant="secondary"
            loading={isExporting}
            onClick={() => onExport(option.id, 'json')}
            className="text-xs font-bold shadow-2xs bg-white hover:bg-slate-100 text-[#0B3064] border border-slate-200"
          >
            <FileJson className="w-3.5 h-3.5 text-[#0B3064]" />
            <span>JSON</span>
            <Download className="w-3 h-3 text-slate-400 ml-0.5" />
          </Button>

          {/* CSV Export Button */}
          <Button
            id={`export-${option.id}-csv`}
            size="sm"
            variant="secondary"
            loading={isExporting}
            onClick={() => onExport(option.id, 'csv')}
            className="text-xs font-bold shadow-2xs bg-white hover:bg-slate-100 text-[#0A783C] border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0A783C]" />
            <span>CSV Table</span>
            <Download className="w-3 h-3 text-slate-400 ml-0.5" />
          </Button>

          {/* Copy Endpoint URL Button */}
          <Button
            id={`copy-${option.id}`}
            size="sm"
            variant="ghost"
            onClick={handleCopyEndpoint}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 ml-auto"
            title="Copy REST API Endpoint URL"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#0A783C]" />
                <span className="text-[#0A783C] font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy URL</span>
              </>
            )}
          </Button>

          {/* REST API Button */}
          <Button
            id={`export-${option.id}-rest`}
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/api/export?type=${option.id}`, '_blank')}
            className="text-xs font-bold text-slate-600 hover:text-[#0B3064] flex items-center gap-1"
          >
            <Code2 className="w-3.5 h-3.5 text-[#0B3064]" />
            <span>REST API</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
