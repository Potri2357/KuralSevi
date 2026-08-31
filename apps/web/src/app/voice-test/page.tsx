'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TopNav } from '@/components/layout/TopNav';
import {
  Mic,
  Square,
  Volume2,
  Sparkles,
  Languages,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export default function VoiceTestPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<'ta' | 'hi' | 'te'>('ta');
  const [speaker, setSpeaker] = useState<string>('kavitha');
  const [recordingTime, setRecordingTime] = useState(0);

  const [userTranscript, setUserTranscript] = useState<string | null>(null);
  const [sttConfidence, setSttConfidence] = useState<number | null>(null);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const actualType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
        const ext = actualType.includes('mp4') ? 'mp4' : actualType.includes('wav') ? 'wav' : 'webm';
        await sendAudioToBackend(audioBlob, `voice_sample.${ext}`, actualType);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMsg('Microphone access denied. Please allow microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const sendAudioToBackend = async (blob: Blob, filename = 'voice_sample.webm', mimeType?: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('audio', blob, filename);
      formData.append('language', language);
      formData.append('speaker', speaker);
      formData.append('session_key', 'browser_voice_demo');
      if (mimeType) {
        formData.append('mime_type', mimeType);
      }


      const res = await fetch('http://localhost:8000/api/voice/process-speech', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.status === 'failed' || data.error) {
        throw new Error(data.error || 'Speech processing failed');
      }

      setUserTranscript(data.user_transcript);
      setSttConfidence(data.stt_confidence);
      setAiResponseText(data.ai_response_text);

      if (data.audio_base64) {
        const audioSrc = `data:${data.audio_mime_type};base64,${data.audio_base64}`;
        setAudioUrl(audioSrc);

        // Auto-play AI response
        setTimeout(() => {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.play().catch((e) => console.log('Audio autoplay prevented:', e));
          }
        }, 300);
      }
    } catch (err: unknown) {
      console.error('Processing error:', err);
      const message = err instanceof Error ? err.message : 'Failed to connect to Voice API';
      setErrorMsg(`${message}. Verify Voice API is running on port 8000.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSession = () => {
    setUserTranscript(null);
    setSttConfidence(null);
    setAiResponseText(null);
    setAudioUrl(null);
    setErrorMsg(null);
    setRecordingTime(0);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <TopNav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF1FB] text-[#0B3064] border border-[#BACEEB] text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stage 1: Real Voice Microphone Verification</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B3064] tracking-tight">
            Live Voice Pipeline Studio
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Speak into your Mac microphone in Tamil, Hindi, or Telugu. Test live speech-to-text with <strong>Sarvam AI</strong> and conversational reasoning with <strong>Gemini 2.5 Flash</strong>.
          </p>
        </div>

        {/* Studio Card */}
        <Card className="p-6 sm:p-8 relative overflow-hidden shadow-md bg-white/90 backdrop-blur-xl">
          {/* Saffron Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#E05A1B]" />

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#0B3064]" />
              <span className="text-xs font-bold text-slate-700">Language:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                {[
                  { code: 'ta', label: 'தமிழ் (Tamil)' },
                  { code: 'hi', label: 'हिंदी (Hindi)' },
                  { code: 'te', label: 'తెలుగు (Telugu)' },
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code as 'ta' | 'hi' | 'te')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      language === l.code
                        ? 'bg-[#0B3064] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Persona Selector */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#E05A1B]" />
              <span className="text-xs font-bold text-slate-700">Voice:</span>
              <select
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-[#0B3064] shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#0B3064]"
              >
                <option value="kavitha">Kavitha (பெண் / Female — Warm Officer)</option>
                <option value="mani">Mani (ஆண் / Male — Community Helper)</option>
                <option value="gokul">Gokul (ஆண் / Male — Young Officer)</option>
                <option value="vijay">Vijay (ஆண் / Male — Confident Guide)</option>
                <option value="shreya">Shreya (பெண் / Female — Soft & Clear)</option>
              </select>
            </div>

            <Button variant="secondary" size="sm" onClick={resetSession} className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>

          {/* Center Mic Action Button */}
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white scale-105 shadow-red-500/30'
                    : isProcessing
                    ? 'bg-slate-300 text-slate-500 cursor-wait'
                    : 'bg-[#0B3064] hover:bg-[#144282] text-white hover:scale-105 shadow-blue-900/20'
                }`}
                title={isRecording ? 'Click to stop' : 'Click to talk'}
              >
                {isRecording ? (
                  <>
                    <Square className="w-8 h-8 animate-pulse" />
                    <span className="text-[11px] font-bold mt-1">{recordingTime}s</span>
                  </>
                ) : isProcessing ? (
                  <span className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Mic className="w-8 h-8" />
                    <span className="text-[11px] font-bold mt-1">Talk</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0F172A]">
                {isRecording
                  ? 'Listening to your microphone... Speak naturally in Tamil'
                  : isProcessing
                  ? 'Processing with Sarvam AI STT & Gemini 2.5 Flash...'
                  : 'Click the microphone and speak in Tamil'}
              </p>
              <p className="text-xs text-slate-500">
                Example prompt: <em>&ldquo;வணக்கம், நான் தையல் வேலை செய்கிறேன், சொந்தமாக கடை வைக்க உதவி தேவை.&rdquo;</em>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Results Display */}
          {(userTranscript || aiResponseText) && (
            <div className="space-y-4 pt-6 border-t border-slate-200/80 animate-in fade-in slide-in-from-bottom-2">
              {/* User Speech Transcription */}
              {userTranscript && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#0B3064]" />
                      You Spoke (Transcribed by Sarvam AI)
                    </span>
                    {sttConfidence && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {Math.round(sttConfidence * 100)}% Confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    &ldquo;{userTranscript}&rdquo;
                  </p>
                </div>
              )}

              {/* AI Tamil Voice Response */}
              {aiResponseText && (
                <div className="p-4 rounded-xl bg-[#EAF1FB]/80 border border-[#BACEEB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B3064] flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#E05A1B]" />
                      Kural Sevi AI Spoken Reply (Gemini + Sarvam Bulbul TTS)
                    </span>
                    <span className="text-[11px] font-bold text-[#0A783C] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Audio Synthesized
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#0B3064] leading-relaxed">
                    {aiResponseText}
                  </p>

                  {/* Audio Player */}
                  {audioUrl && (
                    <div className="pt-2 flex items-center gap-3">
                      <audio ref={audioPlayerRef} src={audioUrl} controls className="w-full h-10 rounded-lg" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Pipeline Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 text-xs space-y-1">
            <p className="font-bold text-[#0B3064] flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-[#E05A1B]" />
              1. Speech-to-Text
            </p>
            <p className="text-slate-600">
              Sarvam AI Saaras v2 handles Indian accented speech, dialects, and disfluencies.
            </p>
          </Card>
          <Card className="p-4 text-xs space-y-1">
            <p className="font-bold text-[#0B3064] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0B3064]" />
              2. LLM Extraction
            </p>
            <p className="text-slate-600">
              Gemini 2.5 Flash maps spoken intent to PM-AJAY mandated qualification registers.
            </p>
          </Card>
          <Card className="p-4 text-xs space-y-1">
            <p className="font-bold text-[#0B3064] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#0A783C]" />
              3. Text-to-Speech
            </p>
            <p className="text-slate-600">
              Sarvam Bulbul V3 produces natural, dignified Tamil voice prompts.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
