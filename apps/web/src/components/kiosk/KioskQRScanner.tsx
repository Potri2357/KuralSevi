'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Building2,
  Award,
  Calendar,
} from 'lucide-react';
import type { SanctionVerificationRecord } from '@/lib/sanction-verification';

interface KioskQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: (record: SanctionVerificationRecord) => void;
}

export function KioskQRScanner({ isOpen, onClose, onVerified }: KioskQRScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [scannerLoading, setScannerLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [verifiedRecord, setVerifiedRecord] = useState<SanctionVerificationRecord | null>(null);

  const scannerRef = useRef<any>(null);
  const readerElementId = 'kiosk-html5-qr-reader';

  // Extract ID from scanned QR content (can be full URL or plain ID)
  const extractIdFromScannedText = (text: string): string => {
    const trimmed = text.trim();
    // Check if it's a verify URL like http://localhost:3000/verify/TN-PMAJAY-2026-10293
    const verifyMatch = trimmed.match(/\/verify\/([^/?#]+)/i);
    if (verifyMatch && verifyMatch[1]) {
      return verifyMatch[1];
    }
    return trimmed;
  };

  // Perform backend lookup against /api/verify/[id]
  const verifySanctionId = async (id: string) => {
    setLookupLoading(true);
    setLookupError(null);
    try {
      const cleanId = encodeURIComponent(id.trim());
      const res = await fetch(`/api/verify/${cleanId}`);
      const data = await res.json();

      if (res.ok && data.verified && data.record) {
        setVerifiedRecord(data.record);
        if (onVerified) onVerified(data.record);
        // Play gentle audio chime if possible
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } catch {
          // ignore audio failure
        }
      } else {
        setLookupError(data.error || 'Sanction document not found in PM-AJAY Registry.');
      }
    } catch (err: any) {
      setLookupError('Network error while verifying sanction record.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Initialize Camera Scanner
  useEffect(() => {
    let isMounted = true;

    if (!isOpen || activeTab !== 'camera' || verifiedRecord) {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
      }
      return;
    }

    setScannerLoading(true);
    setCameraError(null);

    // Dynamically load html5-qrcode
    import('html5-qrcode')
      .then(({ Html5Qrcode }) => {
        if (!isMounted) return;

        // Ensure clean previous instance
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(() => {});
            }
          } catch {}
        }

        const html5QrCode = new Html5Qrcode(readerElementId);
        scannerRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 260, height: 260 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              const detectedId = extractIdFromScannedText(decodedText);
              // Stop camera upon successful detection
              html5QrCode
                .stop()
                .then(() => {
                  verifySanctionId(detectedId);
                })
                .catch(() => {
                  verifySanctionId(detectedId);
                });
            },
            () => {
              // frame parse misses are normal
            }
          )
          .then(() => {
            if (isMounted) setScannerLoading(false);
          })
          .catch((err) => {
            console.warn('[Kiosk QR] Camera start notice:', err);
            if (isMounted) {
              setScannerLoading(false);
              setCameraError(
                'Camera could not be started. Ensure camera permissions are enabled, or use File Upload / Manual ID below.'
              );
            }
          });
      })
      .catch((err) => {
        if (isMounted) {
          setScannerLoading(false);
          setCameraError('Scanner module failed to load. Please try Manual Entry.');
        }
      });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
      }
    };
  }, [isOpen, activeTab, verifiedRecord]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLookupLoading(true);
    setLookupError(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = new Html5Qrcode('kiosk-file-scan-temp');
      const decodedText = await tempScanner.scanFile(file, true);
      const detectedId = extractIdFromScannedText(decodedText);
      await verifySanctionId(detectedId);
    } catch (err: any) {
      setLookupError('Could not detect a valid PM-AJAY QR code in the uploaded image.');
      setLookupLoading(false);
    }
  };

  // Handle Manual Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    verifySanctionId(manualInput.trim());
  };

  const resetScanner = () => {
    setVerifiedRecord(null);
    setLookupError(null);
    setManualInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#0B3064] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <QrCode className="w-5 h-5 text-[#FF9933]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg font-display tracking-tight">
                  PM-AJAY Sanction Verification
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB]">
                  Official Registry
                </span>
              </div>
              <p className="text-xs text-white/70">
                சான்றிதழ் சரிபார்ப்பு மையம் · Scan QR code on beneficiary sanction order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STATE 1: VERIFIED DOSSIER DISPLAY */}
          {verifiedRecord ? (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              {/* Authenticity Badge */}
              <div className="p-5 rounded-2xl bg-[#EDF9F1] border-2 border-[#0A783C] flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#0A783C] text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0A783C]">
                      உண்மையான சான்றிதழ் · AUTHENTIC DOCUMENT
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 font-display">
                      Verified PM-AJAY Sanction Order
                    </h4>
                    <p className="text-xs text-slate-600">
                      Digitally authenticated against the Ministry of Social Justice Registry.
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white text-[#0A783C] border border-[#0A783C]/30">
                    STATUS: {verifiedRecord.status}
                  </span>
                </div>
              </div>

              {/* Sanction Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium">Sanction Order No.</div>
                  <div className="font-bold text-slate-900 font-mono text-sm mt-0.5 break-all">
                    {verifiedRecord.sanction_order_id}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium">Case Reference</div>
                  <div className="font-bold text-slate-900 font-mono text-sm mt-0.5">
                    {verifiedRecord.case_id}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium">Beneficiary Name (DPDP Masked)</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {verifiedRecord.beneficiary_name_masked}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-medium">District & Habitation</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {verifiedRecord.district} · {verifiedRecord.block_village}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#EAF1FB] border border-[#BACEEB] sm:col-span-2">
                  <div className="text-[#0B3064] font-medium">Approved Livelihood / NSQF Trade</div>
                  <div className="font-bold text-[#0B3064] text-base mt-0.5">
                    {verifiedRecord.trade_name}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-1">
                    QP Code: <span className="font-mono font-semibold">{verifiedRecord.qp_code}</span> · NSQF Level {verifiedRecord.nsqf_level} · Duration: {verifiedRecord.course_duration}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF4ED] border border-[#FDD8C2] sm:col-span-2 flex items-center justify-between">
                  <div>
                    <div className="text-[#C24810] font-bold text-xs">Total Sanction Entitlement Grant</div>
                    <div className="text-2xl font-black text-[#C24810] font-display mt-0.5">
                      ₹{verifiedRecord.total_entitlement.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                      {verifiedRecord.total_in_words}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Disbursement Mode
                    </span>
                    <div className="text-xs font-bold text-slate-800">Direct Benefit Transfer (DBT)</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={`/verify/${verifiedRecord.sanction_order_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0B3064] hover:bg-[#144282] text-white font-bold text-xs transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Full Official Verification Dossier</span>
                </a>

                <a
                  href={`/api/cases/${verifiedRecord.case_id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sanction PDF</span>
                </a>

                <button
                  type="button"
                  onClick={resetScanner}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* STATE 2: SCANNER / UPLOAD / MANUAL TABS */
            <div className="space-y-5">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('camera');
                    setLookupError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'camera'
                      ? 'bg-white text-[#0B3064] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upload');
                    setLookupError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white text-[#0B3064] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manual');
                    setLookupError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'manual'
                      ? 'bg-white text-[#0B3064] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Enter ID</span>
                </button>
              </div>

              {/* Error Banner */}
              {lookupError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-bold text-red-800">Verification Lookup Failed</p>
                    <p className="mt-0.5">{lookupError}</p>
                  </div>
                </div>
              )}

              {/* TAB 1: LIVE CAMERA */}
              {activeTab === 'camera' && (
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden bg-slate-950 border-4 border-slate-800 shadow-inner flex items-center justify-center">
                    {/* Html5Qrcode target div */}
                    <div id={readerElementId} className="w-full h-full" />

                    {/* Camera Loading Overlay */}
                    {scannerLoading && (
                      <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white gap-3 p-4 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-[#FF9933]" />
                        <p className="text-xs font-semibold">Starting Kiosk Camera Feed…</p>
                        <p className="text-[11px] text-slate-400">Please grant camera permissions if prompted.</p>
                      </div>
                    )}

                    {/* Laser line overlay when scanning */}
                    {!scannerLoading && !cameraError && (
                      <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse" />
                    )}

                    {/* Camera Error Overlay */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center text-center text-white gap-3">
                        <AlertTriangle className="w-8 h-8 text-amber-400" />
                        <p className="text-xs font-semibold text-slate-200">{cameraError}</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('manual')}
                          className="px-4 py-2 rounded-lg bg-[#0B3064] text-xs font-bold text-white mt-1 hover:bg-[#144282]"
                        >
                          Switch to Manual ID Entry
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 font-medium text-center mt-3">
                    Hold the QR code on the PM-AJAY Sanction Order in front of the camera lens.
                  </p>
                </div>
              )}

              {/* TAB 2: UPLOAD IMAGE */}
              {activeTab === 'upload' && (
                <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/60 transition-colors p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs mb-3 text-[#0B3064]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Upload QR Image or Sanction Scan</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                    Select a photo of the sanction letter taken from your phone camera (.png, .jpg, .webp).
                  </p>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] text-white text-xs font-bold cursor-pointer transition-all shadow-xs">
                    <Camera className="w-4 h-4" />
                    <span>Choose File from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={lookupLoading}
                    />
                  </label>
                  {/* Invisible div for Html5Qrcode scanFile */}
                  <div id="kiosk-file-scan-temp" className="hidden" />
                </div>
              )}

              {/* TAB 3: MANUAL ENTRY */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
                  <div>
                    <label
                      htmlFor="manual-sanction-id"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Sanction Order ID or Case Reference Number
                    </label>
                    <div className="relative">
                      <input
                        id="manual-sanction-id"
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="e.g. TN-PMAJAY-2026-92812 or case-17408"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064]/20 focus:border-[#0B3064] focus:bg-white transition-all shadow-2xs uppercase"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Enter the alphanumeric Order No. printed on top-right of your official PM-AJAY sanction certificate.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={lookupLoading || !manualInput.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0B3064] hover:bg-[#144282] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
                  >
                    {lookupLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying with PM-AJAY Registry…</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Verify Sanction Record</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A783C]" />
            <span>National Verification Registry · DPDP Act 2023 Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
