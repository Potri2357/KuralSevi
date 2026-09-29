'use client';

import React, { useState } from 'react';
import { Search, X, CheckCircle2, Clock, AlertTriangle, FileText, Download, Phone, RefreshCw } from 'lucide-react';
import { KuralSeviIcon } from '@/components/common/KuralSeviLogo';

interface KioskStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVerify?: (sanctionId: string) => void;
}

export function KioskStatusModal({ isOpen, onClose, onOpenVerify }: KioskStatusModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`/api/kiosk/status?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (res.ok && data.found) {
        setResults(data.cases);
      } else {
        setError(data.message || data.error || 'No records found matching that query.');
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      {/* Background ambient glow */}
      <div className="absolute w-80 h-80 rounded-full bg-[#0B3064]/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-xl neuro-glass rounded-3xl overflow-hidden flex flex-col max-h-[90vh] z-10 border border-white/60 shadow-[0_25px_60px_-15px_rgba(11,48,100,0.35)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B3064] via-[#113a75] to-[#144282] text-white p-5 flex items-center justify-between shadow-[0_4px_16px_rgba(11,48,100,0.2)] border-b border-white/20">
          <div className="flex items-center gap-3">
            <KuralSeviIcon size="md" className="border border-white/30" />
            <div>
              <h3 className="font-bold text-lg font-display tracking-tight">
                आवेदन स्थिति जांच · Application Status
              </h3>
              <p className="text-xs text-white/80">
                Check PM-AJAY registration & approval status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-white/40">
          <form onSubmit={handleSearch} className="space-y-3">
            <label
              htmlFor="kiosk-status-query"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Enter Beneficiary Mobile Number or Case Reference ID
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="kiosk-status-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. 1234567890 or case-17408"
                  className="w-full px-4 py-3 rounded-xl neuro-inset bg-slate-100/80 border border-slate-200/80 text-slate-900 font-medium text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064]/30 focus:border-[#0B3064] transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-5 py-3 rounded-xl bg-[#0B3064] hover:bg-[#144282] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-[0_2px_8px_rgba(11,48,100,0.3)] flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 neuro-btn"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Check Status</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              लाभार्थी का 10 अंकों का मोबाइल नंबर (1234567890) या आवेदन संदर्भ संख्या दर्ज करें।
            </p>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Results List */}
          {results && results.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Matching Case Records ({results.length})
              </h4>
              {results.map((c, idx) => {
                const isApproved = c.officer_action === 'approved';
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_4px_16px_-4px_rgba(11,48,100,0.08)] space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono font-bold text-[#0B3064]">{c.case_id}</div>
                        <div className="text-xs text-slate-500 mt-0.5">District: {c.district || 'Tamil Nadu'}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 glass-pill ${
                          isApproved
                            ? 'bg-emerald-50/80 text-[#0A783C] border-emerald-300'
                            : 'bg-amber-50/80 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-[#0A783C]" />
                            <span>Approved & Sanctioned</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Under DWO Review</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-xs">
                      <div className="text-slate-500 font-medium">Recommended Livelihood Trade:</div>
                      <div className="font-bold text-slate-900 mt-0.5">{c.trade_name}</div>
                    </div>

                    {isApproved && c.sanction_order_id && (
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-[#0A783C] font-semibold">
                          Order No: <span className="font-mono">{c.sanction_order_id}</span>
                        </div>
                        {onOpenVerify && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenVerify(c.sanction_order_id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#0A783C] hover:bg-[#086231] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            Verify Order QR
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 px-6 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
