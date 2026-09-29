'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Phone,
  Check,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  User,
  GraduationCap,
  Briefcase,
  Building,
  CheckCircle2,
  FileText,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { IndicEar } from '@/components/icons/indic';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isVoice?: boolean;
}

interface KioskWhatsAppPlatformProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVerify?: (caseId: string) => void;
}

export function KioskWhatsAppPlatform({
  isOpen,
  onClose,
  onOpenVerify,
}: KioskWhatsAppPlatformProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationState, setConversationState] = useState<any>({ stage: 0 });
  const [completedCase, setCompletedCase] = useState<any>(null);
  const [realPhone, setRealPhone] = useState('');
  const [dispatchMode, setDispatchMode] = useState<'simulator' | 'real_phone'>('simulator');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Start conversation on open
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setConversationState({ stage: 0 });
      setCompletedCase(null);
      return;
    }

    // Trigger Initial Welcome
    setIsTyping(true);
    fetch('/api/kiosk/whatsapp/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage: '', state: { stage: 0 } }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsTyping(false);
        if (data.success) {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMessages([
            {
              id: 'init-1',
              sender: 'bot',
              text: data.botReply,
              time: now,
            },
          ]);
          setQuickReplies(data.quickReplies || []);
          setConversationState(data.state);
        }
      })
      .catch(() => setIsTyping(false));
  }, [isOpen]);

  // Send message handler
  const handleSendMessage = async (textToSend: string, isVoiceNote = false) => {
    const text = textToSend.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: isVoiceNote ? `🎤 आवाज संदेश / Voice Note: "${text}"` : text,
      time: now,
      isVoice: isVoiceNote,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setQuickReplies([]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/kiosk/whatsapp/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          state: conversationState,
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      if (data.success) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
        setQuickReplies(data.quickReplies || []);
        setConversationState(data.state);

        if (data.completedCase) {
          setCompletedCase(data.completedCase);

          // If real phone is provided, send real WhatsApp
          if (realPhone.trim().length >= 10) {
            fetch('/api/calls/whatsapp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: realPhone,
                language: 'hi',
                mode: 'sanction',
                caseId: data.completedCase.caseId,
                beneficiaryName: data.completedCase.name,
              }),
            }).catch(() => {});
          }
        }
      }
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: 'क्षमा करें, कनेक्शन में त्रुटि हुई। कृपया पुनः प्रयास करें।',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleSimulateVoiceNote = () => {
    setIsRecordingVoice(true);
    setTimeout(() => {
      setIsRecordingVoice(false);
      const defaultSamples = [
        'मेरा नाम रमेश कुमार, जिला सलेम, ग्राम मेलपाड़ी।',
        'मैंने 10वीं कक्षा उत्तीर्ण की है।',
        'मुझे सिलाई और वस्त्र निर्माण में 1 वर्ष का अनुभव है।',
        'मैं स्वयं की सिलाई दुकान (स्वरोजगार) शुरू करना चाहता हूँ।',
        'हाँ, मैं जिला ITI कौशल केंद्र जा सकता हूँ।',
        'मैं विकल्प संख्या 2 (सिलाई एवं वस्त्र उद्यम) चुनता हूँ।',
      ];
      const stageIdx = Math.min(conversationState.stage || 0, defaultSamples.length - 1);
      handleSendMessage(defaultSamples[stageIdx] || 'हाँ, पंजीकरण आगे बढ़ाएं', true);
    }, 1200);
  };

  const handleRestart = () => {
    setMessages([]);
    setConversationState({ stage: 0 });
    setCompletedCase(null);
    setIsTyping(true);

    fetch('/api/kiosk/whatsapp/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage: '', state: { stage: 0 } }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsTyping(false);
        if (data.success) {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setMessages([
            {
              id: `init-${Date.now()}`,
              sender: 'bot',
              text: data.botReply,
              time: now,
            },
          ]);
          setQuickReplies(data.quickReplies || []);
          setConversationState(data.state);
        }
      })
      .catch(() => setIsTyping(false));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* WHATSAPP TOP HEADER BAR */}
        <div className="bg-[#075E54] text-white p-3.5 sm:p-4 px-5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-[#128C7E] border-2 border-white/40 flex items-center justify-center shadow-inner">
                <IndicEar className="w-6 h-6 text-white" strokeWidth={2.4} />
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#25D366] border-2 border-[#075E54]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base font-display tracking-tight leading-tight">
                  Kural Sevi · कुराल सेवी
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#25D366] text-slate-900 font-mono">
                  Official AI Bot
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-mono">
                {isTyping ? 'टाइप कर रहे हैं / typing…' : 'Online · PM-AJAY Livelihood Intake'}
              </p>
            </div>
          </div>

          {/* Mode Switcher & Close */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-black/20 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDispatchMode('simulator')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dispatchMode === 'simulator' ? 'bg-white text-[#075E54] shadow-xs' : 'text-white/80'
                }`}
              >
                Kiosk Simulator
              </button>
              <button
                type="button"
                onClick={() => setDispatchMode('real_phone')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dispatchMode === 'real_phone' ? 'bg-white text-[#075E54] shadow-xs' : 'text-white/80'
                }`}
              >
                Real Phone Outbound
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close WhatsApp platform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real Phone Bar if selected */}
        {dispatchMode === 'real_phone' && (
          <div className="bg-[#E7F8EE] border-b border-[#25D366]/40 p-2.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#075E54] font-medium">
              <Smartphone className="w-4 h-4 text-[#25D366]" />
              <span>Real WhatsApp Dispatch to Citizen Phone:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={realPhone}
                onChange={(e) => setRealPhone(e.target.value)}
                placeholder="1234567890"
                className="px-3 py-1.5 rounded-lg bg-white border border-[#25D366]/60 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#075E54]"
              />
              <button
                type="button"
                onClick={() => {
                  if (realPhone.length >= 10) {
                    const text = encodeURIComponent(
                      'नमस्ते! Kural Sevi PM-AJAY सहायता केंद्र में आपका स्वागत है। सहायता: 1800-11-2001'
                    );
                    window.open(`https://wa.me/91${realPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs transition-all shadow-2xs cursor-pointer"
              >
                Open in WhatsApp Web
              </button>
            </div>
          </div>
        )}

        {/* SPLIT LAYOUT: CHAT WINDOW (LEFT) + REAL-TIME PROFILE EXTRACTION (RIGHT) */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: WHATSAPP CHAT CONVERSATION */}
          <div className="flex-1 flex flex-col bg-[#EFEAE2] relative overflow-hidden">
            {/* Chat background wallpaper pattern overlay */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 10px 10px, rgba(0,0,0,0.04) 2px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Chat Messages Scrollable Box */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Official Date Badge */}
              <div className="flex justify-center my-1">
                <span className="bg-white/80 backdrop-blur-xs text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs font-mono uppercase">
                  Today · PM-AJAY Official Kiosk Intake
                </span>
              </div>

              {messages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl shadow-xs text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-none'
                          : 'bg-white text-slate-900 rounded-tl-none border border-black/5'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans break-words">{m.text}</pre>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                        <span>{m.time}</span>
                        {isUser && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bot Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white border border-black/5 w-20 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* QUICK REPLY SUGGESTION CHIPS (One-Touch Kiosk Interaction) */}
            {quickReplies.length > 0 && !isTyping && (
              <div className="relative z-10 px-4 py-2 bg-white/90 backdrop-blur-xs border-t border-slate-200 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Reply:
                </span>
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(qr)}
                    className="px-3 py-1.5 rounded-full bg-[#E7F8EE] hover:bg-[#d0f3dd] text-[#075E54] border border-[#25D366]/40 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* INPUT & VOICE NOTE BAR */}
            <div className="relative z-10 p-3 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-2">
              {/* Voice Note Simulation Button */}
              <button
                type="button"
                onClick={handleSimulateVoiceNote}
                disabled={isTyping}
                title="Send Voice Note (आवाज संदेश)"
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-xs cursor-pointer shrink-0 ${
                  isRecordingVoice
                    ? 'bg-red-600 animate-pulse'
                    : 'bg-[#128C7E] hover:bg-[#075E54]'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage(inputText);
                  }
                }}
                placeholder="Type your reply or tap quick options above… (उत्तर टाइप करें)"
                disabled={isTyping}
                className="flex-1 px-4 py-2.5 rounded-full bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#128C7E]/30 focus:border-[#128C7E]"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-[#128C7E] hover:bg-[#075E54] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT: REAL-TIME BENEFICIARY PROFILE EXTRACTION DOSSIER */}
          <div className="hidden lg:flex w-80 bg-white border-l border-slate-200 p-5 flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0B3064]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-display">
                    Live Profile Extraction
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EDF9F1] text-[#0A783C]">
                  Stage {conversationState.stage || 0}/6
                </span>
              </div>

              {/* 7 Dimensions Extracted Cards */}
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">1. Citizen Name</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {conversationState.name || <span className="text-slate-400 font-normal italic">Waiting for intake…</span>}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">2. District & Habitation</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {conversationState.district ? `${conversationState.district} · ${conversationState.village || 'Melpadi'}` : <span className="text-slate-400 font-normal italic">Pending…</span>}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">3. Education</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {conversationState.education || <span className="text-slate-400 font-normal italic">Pending…</span>}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">4. Prior Skills / Trade</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {conversationState.skills || <span className="text-slate-400 font-normal italic">Pending…</span>}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">5. Employment Preference</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {conversationState.employmentPreference ? (
                      conversationState.employmentPreference === 'self' ? 'Self-Employment / Shop' : 'Wage Employment'
                    ) : (
                      <span className="text-slate-400 font-normal italic">Pending…</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#EAF1FB] border border-[#BACEEB]">
                  <span className="text-[10px] text-[#0B3064] uppercase font-mono">6. Matched NSQF Course</span>
                  <div className="font-bold text-[#0B3064] mt-0.5">
                    {conversationState.selectedCourseName || <span className="text-slate-400 font-normal italic">AI Matching in progress…</span>}
                  </div>
                </div>

                {completedCase && (
                  <div className="p-3 rounded-xl bg-[#EDF9F1] border-2 border-[#0A783C] space-y-1 animate-in zoom-in-95">
                    <div className="flex items-center gap-1.5 text-[#0A783C] font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Case Enrolled!</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-700">
                      ID: <strong>{completedCase.caseId}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Synced to District Welfare Officer queue.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {completedCase && onOpenVerify && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVerify(completedCase.caseId);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0A783C] hover:bg-[#086231] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Verify Case Sanction Order</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Start New Beneficiary</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
