'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import {
  PhoneCall,
  PhoneOutgoing,
  PhoneForwarded,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  MapPin,
  Building2,
  Share2,
  ExternalLink,
  ShieldCheck,
  Activity,
  Calendar,
  Filter,
  X,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  Trash2,
  Play,
  Check,
  Users,
  FileDown,
  Volume2,
  Copy,
} from 'lucide-react';
import { IndicScroll, IndicCertificate } from '@/components/icons/indic';
import { cn } from '@/lib/utils';
import type { CallRecordItem, CallFilterChannel, CallFilterStatus } from '../types';
import { WhatsAppCourseModal } from './WhatsAppCourseModal';

interface Props {
  initialCalls: CallRecordItem[];
}

const LANGUAGE_LABELS: Record<string, { name: string; native: string; flag: string }> = {
  ta: { name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  hi: { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  te: { name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  ml: { name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
};

export function CallRecordsView({ initialCalls }: Props) {
  const [calls, setCalls] = useState<CallRecordItem[]>(initialCalls);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CallFilterStatus>('all');
  const [channelFilter, setChannelFilter] = useState<CallFilterChannel>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // WhatsApp Course Dispatch Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [activeWhatsAppCall, setActiveWhatsAppCall] = useState<CallRecordItem | null>(null);

  const openWhatsAppModalForCall = (call?: CallRecordItem) => {
    setActiveWhatsAppCall(call || null);
    setIsWhatsAppModalOpen(true);
  };

  // Direct Outbound Dialing State
  const [isDialModalOpen, setIsDialModalOpen] = useState(false);
  const [dialModalTab, setDialModalTab] = useState<'single' | 'bulk'>('single');
  const [dialPhone, setDialPhone] = useState('+919342900638');
  const [dialLanguage, setDialLanguage] = useState('en');
  const [isDialing, setIsDialing] = useState(false);
  const [dialResult, setDialResult] = useState<{
    success: boolean;
    message?: string;
    call_sid?: string;
    command?: string;
    error?: string;
  } | null>(null);

  // Bulk Beneficiary CSV State
  const [bulkItems, setBulkItems] = useState<
    Array<{
      id: string;
      phone: string;
      name: string;
      language: string;
      district: string;
      valid: boolean;
      error?: string;
    }>
  >([]);
  const [rawText, setRawText] = useState('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    success: boolean;
    message?: string;
    total?: number;
    dispatched?: number;
    queued?: number;
    failed?: number;
    error?: string;
  } | null>(null);
  const [campaignInterval, setCampaignInterval] = useState('15');

  // Live polling every 5 seconds for incoming telephony calls
  useEffect(() => {
    let isMounted = true;
    async function refreshCalls() {
      try {
        const res = await fetch('/api/call-records', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.calls) {
            setCalls(json.calls);
            setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }
        }
      } catch (err) {
        // silent fallback
      }
    }

    const timer = setInterval(refreshCalls, 5000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/call-records', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setCalls(json.calls || []);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  const toggleTranscript = (sessionId: string) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const handleCopyTranscript = (call: CallRecordItem) => {
    if (!call.transcript || call.transcript.length === 0) return;
    const lines: string[] = [];
    call.transcript.forEach((turn, idx) => {
      lines.push(`--- Turn ${idx + 1} ---`);
      if (turn.user) {
        lines.push(`[${turn.timestamp || ''}] Beneficiary: "${turn.user}"`);
      }
      if (turn.assistant) {
        lines.push(`[${turn.timestamp || ''}] Kural Sevi AI: "${turn.assistant}"`);
      }
    });
    const fullText = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      setCopiedSessionId(call.session_id);
      setTimeout(() => setCopiedSessionId(null), 2000);
    }
  };

  const openDialWithNumber = (phoneNumber: string) => {
    setDialModalTab('single');
    setDialPhone(phoneNumber || '+91');
    setDialResult(null);
    setIsDialModalOpen(true);
  };

  const parseBeneficiaryText = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: Array<{
      id: string;
      phone: string;
      name: string;
      language: string;
      district: string;
      valid: boolean;
      error?: string;
    }> = [];

    lines.forEach((line, index) => {
      // Skip header row if present
      if (index === 0 && (line.toLowerCase().includes('phone') || line.toLowerCase().includes('mobile'))) {
        return;
      }

      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const rawPhone = parts[0] || '';
      const name = parts[1] || `Beneficiary ${index + 1}`;
      let language = (parts[2] || 'ta').toLowerCase();
      const district = parts[3] || 'Namakkal';

      if (!['ta', 'hi', 'te', 'ml'].includes(language)) {
        language = 'ta';
      }

      let cleanPhone = rawPhone.replace(/[\s\-()]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '+91' + cleanPhone.slice(1);
      } else if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+91' + cleanPhone;
      }

      // Check if it is a valid 10-digit Indian mobile number
      const isValid = cleanPhone.length >= 12 && /^\+91[6-9]\d{9}$/.test(cleanPhone);

      parsed.push({
        id: `row-${index}-${Math.random().toString(36).substring(2, 6)}`,
        phone: cleanPhone,
        name,
        language,
        district,
        valid: isValid,
        error: !isValid ? 'Invalid 10-digit mobile number' : undefined,
      });
    });

    setBulkItems(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        parseBeneficiaryText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const sample = `phone,name,language,district\n+919342900638,Ravi Kumar,ta,Namakkal\n+919876543210,Priya S,ta,Salem\n+919123456780,Murugan M,ta,Namakkal\n+919443210987,Anjali Devi,hi,Coimbatore`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kural_sevi_beneficiaries_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLaunchCampaign = async () => {
    const validOnes = bulkItems.filter((b) => b.valid);
    if (validOnes.length === 0) return;

    setIsBulkSubmitting(true);
    setBulkResult(null);

    try {
      const res = await fetch('/api/calls/batch-dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaries: validOnes.map((b) => ({
            phone: b.phone,
            name: b.name,
            language: b.language,
            district: b.district,
          })),
          intervalSeconds: Number(campaignInterval) || 15,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBulkResult({
          success: true,
          message: data.message,
          total: data.total,
          dispatched: data.dispatched,
          queued: data.queued,
          failed: data.failed,
        });
        setTimeout(handleManualRefresh, 2000);
      } else {
        setBulkResult({
          success: false,
          error: data.error || 'Failed to dispatch batch campaign.',
        });
      }
    } catch (err: any) {
      setBulkResult({
        success: false,
        error: err?.message || 'Network error during campaign launch.',
      });
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const handleTriggerDial = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dialPhone.trim()) return;

    setIsDialing(true);
    setDialResult(null);

    try {
      const res = await fetch('/api/calls/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: dialPhone.trim(),
          language: dialLanguage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDialResult({
          success: true,
          message: data.message || `Outbound call placed successfully to ${dialPhone}.`,
          call_sid: data.call_sid,
          command: data.command || `python3 scripts/trigger-outbound-call.py ${dialPhone} ${dialLanguage}`,
        });
        // Trigger quick refresh
        setTimeout(handleManualRefresh, 3000);
      } else {
        setDialResult({
          success: false,
          error: data.error || 'Failed to dispatch call. Please verify Twilio configuration or CLI script.',
          command: data.command || `python3 scripts/trigger-outbound-call.py ${dialPhone} ${dialLanguage}`,
        });
      }
    } catch (err: any) {
      setDialResult({
        success: false,
        error: err?.message || 'Network error while attempting to trigger outbound call.',
        command: `python3 scripts/trigger-outbound-call.py ${dialPhone} ${dialLanguage}`,
      });
    } finally {
      setIsDialing(false);
    }
  };

  // Metrics computation
  const totalCalls = calls.length;
  const confirmedCalls = calls.filter((c) => c.citizen_confirmed).length;
  const ivrCalls = calls.filter((c) => c.channel?.toLowerCase() === 'ivr' || !c.channel).length;
  const avgTurns =
    totalCalls > 0
      ? (calls.reduce((sum, c) => sum + (c.turns_count || c.transcript?.length || 0), 0) / totalCalls).toFixed(1)
      : '0.0';

  // Filtered calls
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      // Search
      if (search) {
        const query = search.toLowerCase();
        const matchesPhone = c.phone?.toLowerCase().includes(query);
        const matchesId = c.case_id?.toLowerCase().includes(query);
        const matchesTrade = c.top_recommendation?.qp_name?.toLowerCase().includes(query);
        const matchesFields = Object.values(c.confirmed_fields || {}).some((v) =>
          String(v).toLowerCase().includes(query)
        );
        if (!matchesPhone && !matchesId && !matchesTrade && !matchesFields) return false;
      }

      // Status Filter
      if (statusFilter === 'confirmed' && !c.citizen_confirmed) return false;
      if (statusFilter === 'pending' && c.citizen_confirmed) return false;

      // Channel Filter
      if (channelFilter === 'ivr' && c.channel?.toLowerCase() === 'whatsapp') return false;
      if (channelFilter === 'whatsapp' && c.channel?.toLowerCase() !== 'whatsapp') return false;

      // Language Filter
      if (languageFilter !== 'all' && c.language !== languageFilter) return false;

      return true;
    });
  }, [calls, search, statusFilter, channelFilter, languageFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B3064] flex items-center justify-center text-white shadow-2xs">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B3064] tracking-tight">
                Citizen Telephony Call Records
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
                Real-time voice intake logs, bilingual transcripts, citizen SMS receipts, and NSQF pathway alignments
              </p>
            </div>
          </div>
        </div>

        {/* Live sync & dial actions */}
        <div className="flex items-center gap-3">

          {/* WhatsApp Course Outreach & Intake Button */}
          <Button
            size="sm"
            onClick={() => openWhatsAppModalForCall()}
            className="text-xs font-bold gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Initialise WhatsApp Intake</span>
          </Button>

          {/* Bulk Beneficiary Upload Button */}
          <Button
            size="sm"
            onClick={() => {
              setDialModalTab('bulk');
              setBulkResult(null);
              setIsDialModalOpen(true);
            }}
            className="text-xs font-bold gap-1.5 bg-[#0B3064] hover:bg-[#144282] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Beneficiary List</span>
          </Button>

          {/* Direct Outbound Dial Button */}
          <Button
            size="sm"
            onClick={() => {
              setDialModalTab('single');
              setDialResult(null);
              setIsDialModalOpen(true);
            }}
            className="text-xs font-bold gap-1.5 bg-[#E05A1B] hover:bg-[#C24810] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <PhoneOutgoing className="w-3.5 h-3.5" />
            <span>Dial Beneficiary</span>
          </Button>
        </div>
      </div>

      {/* Operations Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Recorded Calls</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0B3064] mt-1">{totalCalls}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Telephony & WhatsApp</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064] shadow-2xs">
              <PhoneCall className="w-5 h-5 text-[#0B3064]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Citizen Confirmed</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0A783C] mt-1">{confirmedCalls}</p>
              <p className="text-[11px] text-[#0A783C] font-semibold mt-0.5">
                {totalCalls > 0 ? `${Math.round((confirmedCalls / totalCalls) * 100)}% verification rate` : 'Two-way loop verified'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EDF9F1] border border-[#BBE8CB] flex items-center justify-center text-[#0A783C] shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-[#0A783C]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Avg. Conversation Turns</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0B3064] mt-1">{avgTurns}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Turns per intake call</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064] shadow-2xs">
              <Activity className="w-5 h-5 text-[#0B3064]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 shadow-2xs bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Receipt Dispatch</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#E05A1B] mt-1">100%</p>
              <p className="text-[11px] text-[#E05A1B] font-semibold mt-0.5">WhatsApp + SMS delivered</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FFF4ED] border border-[#FDD8C2] flex items-center justify-center text-[#E05A1B] shadow-2xs">
              <MessageSquare className="w-5 h-5 text-[#E05A1B]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="bg-white/95 border-slate-200 shadow-2xs">
        <CardContent className="py-3 px-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              placeholder="Search by caller phone (+91...), Case ID, trade, or livelihood skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50/70 hover:bg-white border border-slate-200 focus:bg-white rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064] focus:border-[#0B3064] min-h-[40px] transition-colors shadow-2xs"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  statusFilter === 'all'
                    ? 'bg-white text-[#0B3064] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('confirmed')}
                className={cn(
                  'px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer',
                  statusFilter === 'confirmed'
                    ? 'bg-white text-[#0A783C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0A783C]" />
                <span>Confirmed</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={cn(
                  'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  statusFilter === 'pending'
                    ? 'bg-white text-[#C24810] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Pending Reply
              </button>
            </div>

            {/* Channel Pills */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setChannelFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  channelFilter === 'all'
                    ? 'bg-white text-[#0B3064] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                All Channels
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('ivr')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  channelFilter === 'ivr'
                    ? 'bg-white text-[#0B3064] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                IVR Call
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('whatsapp')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  channelFilter === 'whatsapp'
                    ? 'bg-white text-[#0A783C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                WhatsApp
              </button>
            </div>

            {/* Language Selector */}
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="bg-slate-50/80 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-[#0B3064] shadow-2xs cursor-pointer"
            >
              <option value="all">All Languages</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Records Count Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <div>
          Showing <strong className="text-[#0B3064] font-bold">{filteredCalls.length}</strong> of{' '}
          <strong className="text-slate-800">{totalCalls}</strong> recorded citizen intake sessions
        </div>
        {(search || statusFilter !== 'all' || channelFilter !== 'all' || languageFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setChannelFilter('all');
              setLanguageFilter('all');
            }}
            className="text-xs font-bold text-[#0B3064] hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Call Records List */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-300 bg-white/90 shadow-2xs">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF1FB] text-[#0B3064] flex items-center justify-center mx-auto shadow-2xs">
                <PhoneCall className="w-6 h-6 text-[#0B3064]" />
              </div>
              <h3 className="font-bold text-base text-[#0B3064]">No Telephony Call Records Found</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {totalCalls === 0
                  ? 'Beneficiary voice interviews can be initiated directly by entering the phone number. When the citizen answers, Kural Sevi conducts the conversational intake in their vernacular language.'
                  : 'No calls match your active filter criteria. Try resetting your search query or selecting "All Status".'}
              </p>
              {totalCalls === 0 && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setDialResult(null);
                      setIsDialModalOpen(true);
                    }}
                    className="text-xs font-bold bg-[#E05A1B] hover:bg-[#C24810] text-white shadow-sm"
                  >
                    <PhoneOutgoing className="w-3.5 h-3.5 mr-1.5" />
                    <span>Dial Beneficiary Directly</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          filteredCalls.map((call) => {
            const isExpanded = Boolean(expandedTranscripts[call.session_id]);
            const langMeta = LANGUAGE_LABELS[call.language] || { name: call.language, native: call.language, flag: '🇮🇳' };
            const fields = call.confirmed_fields || {};
            const rec = call.top_recommendation;

            return (
              <Card
                key={call.session_id}
                className="border-slate-200 hover:border-slate-300 transition-all duration-200 overflow-hidden shadow-2xs bg-white"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Caller Info & Case ID */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        <PhoneCall className="w-3.5 h-3.5 text-[#0B3064]" />
                        <span className="font-bold text-sm text-slate-800 font-mono">
                          {call.phone || 'Incoming Caller'}
                        </span>
                        {call.phone && (
                          <button
                            type="button"
                            onClick={() => openDialWithNumber(call.phone)}
                            className="text-[11px] font-bold text-[#E05A1B] hover:text-[#C24810] bg-[#FFF4ED] hover:bg-[#FFE8DC] px-2 py-0.5 rounded-md border border-[#FDD8C2] ml-1 transition-colors cursor-pointer flex items-center gap-1"
                            title="Call this beneficiary again"
                          >
                            <PhoneOutgoing className="w-2.5 h-2.5" />
                            <span>Redial</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#EAF1FB] text-[#0B3064] px-2.5 py-1 rounded-xl border border-[#BACEEB] text-xs font-bold font-mono">
                        <IndicScroll className="w-3 h-3 text-[#0B3064]" />
                        <span>Case: {call.case_id}</span>
                      </div>

                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase tracking-wider">
                        {call.channel?.toUpperCase() || 'IVR'}
                      </span>

                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB]">
                        {langMeta.name} ({langMeta.native})
                      </span>
                    </div>

                    {/* Right: Confirmation Status & Timestamp */}
                    <div className="flex items-center gap-2">
                      {call.citizen_confirmed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB] shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0A783C]" />
                          <span>Citizen Confirmed ({call.confirmed_via || 'SMS'})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#FFF4ED] text-[#C24810] border border-[#FDD8C2] shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-[#E05A1B]" />
                          <span>Awaiting Citizen Reply</span>
                        </span>
                      )}

                      {/* Card Quick WhatsApp Action */}
                      <button
                        type="button"
                        onClick={() => openWhatsAppModalForCall(call)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EDF9F1] text-[#075E54] border border-[#BBE8CB] hover:bg-[#DCFCE7] transition-all hover:scale-102 cursor-pointer shadow-2xs"
                        title="Initialise WhatsApp voice intake for this beneficiary"
                      >
                        <Sparkles className="w-3 h-3 text-[#25D366]" />
                        <span>WhatsApp Intake</span>
                      </button>

                      <span className="text-xs font-medium text-slate-400">
                        {call.completed_at || 'Recently'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendation Engine Banner */}
                {rec && (
                  <div className="px-4 sm:px-5 py-3 bg-[#0B3064]/[0.03] border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0B3064] flex items-center justify-center text-white shrink-0 shadow-2xs">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B3064] bg-[#EAF1FB] px-1.5 py-0.5 rounded">
                            NSQF Recommendation #1
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {rec.qp_code} · Level {rec.nsqf_level} · <span className="capitalize">{rec.pathway_type.replace('_', ' ')}</span>
                          </span>
                        </div>
                        <p className="font-bold text-sm text-[#0B3064] mt-0.5">
                          {rec.qp_name}{' '}
                          {rec.income_range && (
                            <span className="text-xs font-semibold text-[#0A783C] ml-1">
                              ({rec.income_range})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <ConfidenceBadge label={rec.confidence} size="sm" />
                      {rec.topsis_score > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {Math.round(rec.topsis_score * 100)}% Match
                        </span>
                      )}

                      {/* WhatsApp Intake Button */}
                      <button
                        type="button"
                        onClick={() => openWhatsAppModalForCall(call)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-[#075E54] bg-[#EDF9F1] hover:bg-[#DCFCE7] border border-[#BBE8CB] transition-all hover:scale-102 cursor-pointer shadow-2xs h-8"
                        title="Initialise WhatsApp voice intake for this beneficiary"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>WhatsApp Intake</span>
                      </button>

                      <Link href={`/officer/cases/${call.case_id}`}>
                        <Button size="sm" variant="secondary" className="text-xs font-bold shadow-2xs gap-1 py-1 h-8">
                          <span>Adjudicate Case</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Extracted 7 PM-AJAY Fields Grid */}
                <div className="p-4 sm:p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Extracted Mandated Livelihood Profile
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Education */}
                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>Education</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        {fields.educational_background || 'Recorded via Voice Telephony'}
                      </p>
                    </div>

                    {/* Family Occupation */}
                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <IndicScroll className="w-3.5 h-3.5 text-slate-400" />
                        <span>Family Occupation</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {fields.family_occupation || 'Traditional Household Work'}
                      </p>
                    </div>

                    {/* Current Livelihood */}
                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>Current Work</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {fields.current_livelihood || 'Local Enterprise / Labour'}
                      </p>
                    </div>

                    {/* Skills & Interests */}
                    <div className="bg-[#FFF4ED]/50 p-2.5 rounded-xl border border-[#FDD8C2]/70">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C24810] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#E05A1B]" />
                        <span>Skills & Interests</span>
                      </div>
                      <p className="text-xs font-bold text-[#C24810] mt-1 truncate">
                        {fields.skills_and_interests || 'Vocational Aspirations'}
                      </p>
                    </div>

                    {/* Mobility Constraints */}
                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mobility Radius</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {fields.mobility_constraints || 'Local Cluster / District'}
                      </p>
                    </div>

                    {/* Employment Preference */}
                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Preference</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {fields.employment_preference || 'Self-Employment'}
                      </p>
                    </div>

                    {/* Local Economic Context */}
                    <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 sm:col-span-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Market Context</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                        {fields.local_economic_context || 'Local Village & Weekly Haat Commerce'}
                      </p>
                    </div>
                  </div>

                  {/* Transcript Toggle Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleTranscript(call.session_id)}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#0B3064] hover:text-[#144282] transition-colors py-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        {isExpanded ? 'Hide Conversation Transcript' : `View Full Turn-by-Turn Transcript (${call.transcript?.length || 0} turns)`}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0A783C]" />
                      <span>Bilingual Receipt Dispatched</span>
                    </div>
                  </div>

                  {/* Expandable Transcript Dialogue Box */}
                  {isExpanded && (
                    <div className="mt-3 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
                      {/* Transcript Header Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#0B3064]/10 text-[#0B3064] flex items-center justify-center border border-[#0B3064]/15 shadow-2xs">
                            <Volume2 className="w-4 h-4 text-[#0B3064]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-slate-800 tracking-tight">
                                Vernacular Telephony Voice Transcript
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0A783C] animate-pulse" />
                                Live STT Ingested
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Turn-by-turn conversational recording & bilingual intake
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            Session: {call.session_id.slice(0, 8)}...
                          </span>
                          <span className="text-[11px] font-bold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] px-2.5 py-1 rounded-lg shadow-2xs">
                            {call.transcript?.length || 0} Turns
                          </span>
                        </div>
                      </div>

                      {/* Conversation Turnovers Flow */}
                      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1.5">
                        {call.transcript && call.transcript.length > 0 ? (
                          call.transcript.map((turn, tIdx) => (
                            <div key={tIdx} className="space-y-3">
                              {/* Turn Divider for subsequent turns */}
                              {tIdx > 0 && (
                                <div className="relative py-1 my-0.5">
                                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-slate-200/70" />
                                  </div>
                                  <div className="relative flex justify-center">
                                    <span className="bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold font-mono text-slate-500 rounded-full border border-slate-200 uppercase tracking-wider">
                                      Turn {tIdx + 1}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Citizen / Beneficiary Turn (Spoken Inbound) */}
                              {turn.user && (
                                <div className="flex items-start gap-3 max-w-[92%] sm:max-w-[85%]">
                                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/90 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs mt-0.5">
                                    <User className="w-4 h-4 text-amber-700" />
                                  </div>
                                  <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 text-slate-900 shadow-2xs hover:border-slate-300 transition-all flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-[#FFF4ED] border border-[#FDD8C2] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                          <User className="w-2.5 h-2.5 text-[#E05A1B]" />
                                          Beneficiary
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                          <Volume2 className="w-3 h-3 text-slate-400" />
                                          Citizen Voice
                                        </span>
                                      </div>
                                      {turn.timestamp && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                                          <Clock className="w-3 h-3 text-slate-300" />
                                          {turn.timestamp}
                                        </span>
                                      )}
                                    </div>
                                    <p className="leading-relaxed font-sans text-xs sm:text-[13.5px] text-slate-800 font-medium">
                                      &ldquo;{turn.user}&rdquo;
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Assistant / Kural Sevi Turn (Outbound Vernacular Voice) */}
                              {turn.assistant && (
                                <div className="flex items-start gap-3 max-w-[92%] sm:max-w-[85%] ml-auto justify-end">
                                  <div className="bg-linear-to-br from-[#EAF1FB]/90 via-white to-[#EAF1FB]/60 border border-[#BACEEB] rounded-2xl rounded-tr-xs p-3.5 sm:p-4 text-slate-900 shadow-2xs hover:border-[#96B8E7] transition-all flex-1 text-left">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0B3064] bg-[#EAF1FB] border border-[#BACEEB] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                                          <Bot className="w-2.5 h-2.5 text-[#0B3064]" />
                                          Kural Sevi AI
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0A783C] bg-[#EDF9F1] px-1.5 py-0.5 rounded-md border border-[#BBE8CB]/80">
                                          <Sparkles className="w-2.5 h-2.5 text-[#0A783C]" />
                                          TTS Voice
                                        </span>
                                      </div>
                                      {turn.timestamp && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          {turn.timestamp}
                                        </span>
                                      )}
                                    </div>
                                    <p className="leading-relaxed font-sans text-xs sm:text-[13.5px] text-slate-900 font-medium">
                                      {turn.assistant}
                                    </p>
                                  </div>
                                  <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#0B3064] to-[#144282] border border-[#144282]/40 flex items-center justify-center text-white shrink-0 shadow-2xs mt-0.5">
                                    <Bot className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-white rounded-xl border border-slate-200">
                            <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-xs font-semibold text-slate-500">
                              No audio transcript turns available for this call session.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Transcript Footer Info & Action */}
                      <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#0A783C]" />
                          <span className="font-medium text-slate-600">Vernacular Telephony Ingestion</span>
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <span className="hidden sm:inline">Indic-ASR Realtime Telephony Stream</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyTranscript(call)}
                          className="inline-flex items-center gap-1.5 font-bold text-[#0B3064] hover:text-[#144282] transition-colors py-1 px-2.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer shadow-2xs hover:shadow-xs"
                        >
                          {copiedSessionId === call.session_id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#0A783C]" />
                              <span className="text-[#0A783C]">Transcript Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Full Dialogue</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Telephony Outbound Dispatcher Modal (Single Dial & Bulk CSV Campaign) */}
      {isDialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="bg-linear-to-r from-[#0B3064] to-[#144282] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-inner">
                  <PhoneOutgoing className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Telephony Outbound Dispatcher</h3>
                  <p className="text-xs text-blue-100 font-medium">
                    Direct Beneficiary Calling & Campaign Management via Twilio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDialModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Single vs Bulk */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setDialModalTab('single')}
                className={cn(
                  'pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer',
                  dialModalTab === 'single'
                    ? 'border-[#0B3064] text-[#0B3064]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <PhoneOutgoing className="w-3.5 h-3.5" />
                <span>Single Direct Dial</span>
              </button>

              <button
                type="button"
                onClick={() => setDialModalTab('bulk')}
                className={cn(
                  'pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer',
                  dialModalTab === 'bulk'
                    ? 'border-[#0B3064] text-[#0B3064]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Beneficiary List (CSV)</span>
                {bulkItems.length > 0 && (
                  <span className="text-[10px] bg-[#0B3064] text-white px-1.5 py-0.5 rounded-full font-bold">
                    {bulkItems.filter((b) => b.valid).length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: Single Direct Dial Form */}
            {dialModalTab === 'single' && (
              <form onSubmit={handleTriggerDial} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Beneficiary Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      🇮🇳
                    </span>
                    <input
                      type="tel"
                      value={dialPhone}
                      onChange={(e) => setDialPhone(e.target.value)}
                      placeholder="+919342900638 or 9342900638"
                      required
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064] focus:border-[#0B3064] transition-all shadow-2xs"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-slate-500">Country code (+91) added automatically if omitted</span>
                    <button
                      type="button"
                      onClick={() => setDialPhone('+919342900638')}
                      className="text-[11px] font-bold text-[#0B3064] hover:underline cursor-pointer"
                    >
                      Use Verified Test Phone
                    </button>
                  </div>
                </div>

                {/* Auto-Language Detection Notice */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F0F5FD] border border-[#C5D8F6] text-xs text-slate-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <p className="leading-snug">
                    <strong className="text-[#0B3064] font-bold">Dynamic Language Auto-Switch:</strong> The call starts with an English greeting and automatically switches to Tamil, Hindi, Telugu, or Malayalam as the beneficiary speaks.
                  </p>
                </div>

                {/* Dial Result Banner */}
                {dialResult && (
                  <div
                    className={cn(
                      'p-3 rounded-xl border text-xs leading-relaxed animate-in fade-in-50 duration-200',
                      dialResult.success
                        ? 'bg-[#EDF9F1] border-[#BBE8CB] text-[#0A783C]'
                        : 'bg-[#FFF4ED] border-[#FDD8C2] text-[#C24810]'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {dialResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#C24810] shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="font-bold">
                          {dialResult.success ? 'Call Successfully Dispatched!' : 'Dial Execution Notice'}
                        </p>
                        <p>{dialResult.message || dialResult.error}</p>
                        {dialResult.call_sid && (
                          <p className="font-mono text-[11px] text-slate-600">
                            Twilio Call SID: {dialResult.call_sid}
                          </p>
                        )}
                        {dialResult.success && (
                          <p className="text-[11px] font-semibold text-[#0A783C] mt-1">
                            The beneficiary&apos;s phone is ringing. As they speak, conversational intake and NSQF recommendations will stream here live.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsDialModalOpen(false)}
                    className="text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isDialing || !dialPhone.trim()}
                    size="sm"
                    className="text-xs font-bold gap-1.5 bg-[#0B3064] hover:bg-[#144282] text-white shadow-sm cursor-pointer"
                  >
                    {isDialing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dialing via Twilio...</span>
                      </>
                    ) : (
                      <>
                        <PhoneOutgoing className="w-3.5 h-3.5" />
                        <span>Dial Call Now</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* TAB 2: Bulk CSV Upload & Calling Campaign */}
            {dialModalTab === 'bulk' && (
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Upload Zone & Sample Template */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-[#0B3064]" />
                      <span>Upload Beneficiary List (.CSV, .TXT, .TSV)</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Columns format: <code className="font-mono text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700">phone, name, language, district</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSampleCsv}
                      className="text-xs font-semibold text-[#0B3064] hover:bg-blue-50 border border-[#BACEEB] bg-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#0B3064]" />
                      <span>Sample CSV</span>
                    </button>

                    <label className="text-xs font-bold text-white bg-[#0B3064] hover:bg-[#144282] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Select File</span>
                      <input
                        type="file"
                        accept=".csv,.txt,.tsv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Or Paste Numbers Directly */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Or Paste Phone Numbers / Roster Lines
                    </label>
                    {rawText && (
                      <button
                        type="button"
                        onClick={() => {
                          setRawText('');
                          setBulkItems([]);
                        }}
                        className="text-[10px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={rawText}
                    onChange={(e) => {
                      setRawText(e.target.value);
                      parseBeneficiaryText(e.target.value);
                    }}
                    placeholder="+919342900638, Ravi Kumar, ta, Namakkal&#10;+919876543210, Priya S, ta, Salem&#10;9123456780, Murugan M, ta, Namakkal"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl p-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064] focus:border-[#0B3064] transition-all resize-none shadow-2xs"
                  />
                </div>

                {/* Parsed Summary & Validation Badges */}
                {bulkItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2.5 py-0.5 rounded-full shadow-2xs">
                          <Check className="w-3 h-3 text-[#0A783C]" />
                          {bulkItems.filter((b) => b.valid).length} Valid Numbers
                        </span>

                        {bulkItems.filter((b) => !b.valid).length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C24810] bg-[#FFF4ED] border border-[#FDD8C2] px-2.5 py-0.5 rounded-full shadow-2xs">
                            <AlertCircle className="w-3 h-3 text-[#E05A1B]" />
                            {bulkItems.filter((b) => !b.valid).length} Skipped
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-500 font-medium">
                        Total {bulkItems.length} entries parsed
                      </span>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-inner">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="p-2 pl-3">Beneficiary</th>
                            <th className="p-2">Phone Number</th>
                            <th className="p-2">Language</th>
                            <th className="p-2">District</th>
                            <th className="p-2 text-right pr-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {bulkItems.map((item, idx) => (
                            <tr
                              key={item.id}
                              className={cn(
                                'hover:bg-slate-50/80 transition-colors',
                                !item.valid && 'bg-rose-50/50 text-rose-700'
                              )}
                            >
                              <td className="p-2 pl-3 font-semibold text-slate-800 truncate max-w-[120px]">
                                {item.name}
                              </td>
                              <td className="p-2 font-mono text-[11px] text-slate-700 font-bold">
                                {item.phone}
                                {item.error && (
                                  <span className="block text-[9px] text-rose-500 font-normal">{item.error}</span>
                                )}
                              </td>
                              <td className="p-2">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                                  {item.language}
                                </span>
                              </td>
                              <td className="p-2 text-slate-600 truncate max-w-[90px]">
                                {item.district}
                              </td>
                              <td className="p-2 text-right pr-3">
                                <button
                                  type="button"
                                  onClick={() => setBulkItems((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Campaign Settings: Interval Pacing */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <label className="font-bold text-slate-800 block">Outbound Dial Interval Pacing</label>
                        <p className="text-[11px] text-slate-500">Delay between calls to balance Twilio IVR concurrency</p>
                      </div>
                      <select
                        value={campaignInterval}
                        onChange={(e) => setCampaignInterval(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B3064]"
                      >
                        <option value="5">Fast (5s delay)</option>
                        <option value="15">Balanced (15s delay)</option>
                        <option value="30">Safe (30s delay)</option>
                        <option value="60">Conservative (60s delay)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Execution Result Alert */}
                {bulkResult && (
                  <div
                    className={cn(
                      'p-3.5 rounded-xl border text-xs leading-relaxed animate-in fade-in-50 duration-200',
                      bulkResult.success
                        ? 'bg-[#EDF9F1] border-[#BBE8CB] text-[#0A783C]'
                        : 'bg-[#FFF4ED] border-[#FDD8C2] text-[#C24810]'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {bulkResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-[#0A783C] shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#C24810] shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="font-bold">
                          {bulkResult.success ? 'Calling Campaign Dispatched Successfully!' : 'Campaign Launch Notice'}
                        </p>
                        <p>{bulkResult.message || bulkResult.error}</p>
                        {bulkResult.success && (
                          <p className="text-[11px] text-slate-600">
                            Calls have been added to the telephony queue and are now visible live in your Call Records table below.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsDialModalOpen(false)}
                    className="text-xs font-bold cursor-pointer"
                  >
                    Close
                  </Button>

                  <Button
                    type="button"
                    disabled={isBulkSubmitting || bulkItems.filter((b) => b.valid).length === 0}
                    onClick={handleLaunchCampaign}
                    size="sm"
                    className="text-xs font-bold gap-1.5 bg-[#0B3064] hover:bg-[#144282] text-white shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isBulkSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Launching Calling Campaign...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          Launch Campaign ({bulkItems.filter((b) => b.valid).length} Numbers)
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Citizen Course & Intake Dispatcher Modal */}
      <WhatsAppCourseModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        initialCall={activeWhatsAppCall}
        allCalls={calls}
        onDispatched={handleManualRefresh}
      />
    </div>
  );
}
