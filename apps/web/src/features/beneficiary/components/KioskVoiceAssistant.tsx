'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  FileCheck,
  Languages,
  Radio,
  UserCheck,
  Bot,
  HelpCircle,
  PhoneCall,
  PhoneOff,
  ListChecks,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MandatedFieldsData } from '../types';

interface Props {
  onApplyExtractedFields: (fields: Partial<MandatedFieldsData>) => void;
  language?: string;
}

interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  checklistTitle: string;
  items: string[];
  micTapAnnouncement: string;
  callWelcome: string;
  callQuestions: {
    question: string;
    tamilMeaning: string;
    quickAnswers: string[];
  }[];
  aiConfirmation: string;
}

const LANGUAGE_DATA: Record<string, LanguageConfig> = {
  'ta-IN': {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    checklistTitle: 'பதிவு செய்ய வேண்டிய 6 முக்கிய விவரங்கள் (Details to Provide):',
    items: [
      '1. தற்போதைய வேலை / தொழில் (Current Livelihood) — எ.கா: மளிகை கடை, தையல், விவசாய கூலி, ஆட்டோ',
      '2. படித்த படிப்பு (Education Level) — எ.கா: 8-ஆம் வகுப்பு, 10-ஆம் வகுப்பு (SSLC), 12-ஆம் வகுப்பு',
      '3. குடும்ப தொழில் (Family Occupation) — எ.கா: நெசவு, விவசாயம், கைவினை, வியாபாரம்',
      '4. உங்களுக்கு தெரிந்த திறன்கள் & ஆர்வங்கள் (Skills & Interests) — எ.கா: தையற்கலை, வாகனம் ஓட்டுதல், விற்பனை',
      '5. வேலை விருப்பம் (Job Preference) — சொந்த தொழிலா? அல்லது மாத சம்பள வேலையா?',
      '6. பயண வரம்பு (Mobility) — உள்ளூர் கிராமத்திலா? அல்லது மாவட்டத்திற்குள்ளா?',
    ],
    micTapAnnouncement:
      'மேலே உள்ள விவரங்களை நீங்கள் நேரடியாக பேசலாம். அல்லது உதவி தேவைப்பட்டால் உதவி பொத்தானை அல்லது கால் பட்டனை அழுத்தவும். நாங்கள் ஒரு தொலைபேசி அழைப்பு போல உரையாடி பதிவு செய்வோம்.',
    callWelcome:
      'வணக்கம்! நான் குரல் செவி உதவி அதிகாரி. உங்களுடன் ஒரு தொலைபேசி அழைப்பு போல பேசி, 7 விவரங்களையும் பதிவு செய்கிறேன். முதல் கேள்வியுடன் தொடங்குவோம்.',
    callQuestions: [
      {
        question: 'நீங்கள் தற்போது என்ன தொழில் அல்லது வேலை செய்கிறீர்கள்? உங்கள் படிப்பு என்ன?',
        tamilMeaning: 'தற்போதைய வேலை மற்றும் கல்வி நிலை',
        quickAnswers: ['மளிகை கடை (12th Pass)', 'தையல் வேலை (10th Pass)', 'ஆட்டோ டிரைவர் (8th Pass)', 'விவசாய கூலி (Literate)'],
      },
      {
        question: 'உங்கள் குடும்பத்தில் வழக்கமாக என்ன தொழில் செய்கிறார்கள்? உங்களுக்கு வேறு என்ன வேலைகளில் ஆர்வம் அல்லது திறன்கள் உள்ளன?',
        tamilMeaning: 'குடும்ப தொழில் மற்றும் கூடுதல் திறன்கள்',
        quickAnswers: ['நெசவு மற்றும் கைவினை தொழில்', 'விவசாயம் & கால்நடை வளர்ப்பு', 'வாகனம் ஓட்டுதல் & மெக்கானிக்', 'கடை வியாபாரம் & கணக்கு'],
      },
      {
        question: 'உங்களுக்கு சொந்தமாக தொழில் தொடங்க விருப்பமா? அல்லது மாத ஊதியத்தில் சம்பள வேலை வேண்டுமா? உள்ளூரிலேயே செய்ய முடியுமா?',
        tamilMeaning: 'வேலை விருப்பம் மற்றும் இடப்பெயர்வு வரம்பு',
        quickAnswers: ['உள்ளூரில் சொந்த தொழில் (Self-Employed)', 'மாவட்டத்திற்குள் சம்பள வேலை (Wage Job)', 'சொந்த தையல்/மளிகை கடை (Local)'],
      },
    ],
    aiConfirmation: 'நன்றி! உங்கள் உரையாடலின் அடிப்படையில் 7 பரிமாணங்களும் வெற்றிகரமாக தொகுக்கப்பட்டு தயார் செய்யப்பட்டுள்ளன.',
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    checklistTitle: 'दर्ज करने के लिए आवश्यक 6 मुख्य विवरण (Details to Provide):',
    items: [
      '1. वर्तमान आजीविका (Current Livelihood) — जैसे: किराना दुकान, सिलाई, मजदूरी, वाहन चालक',
      '2. शिक्षा का स्तर (Education Level) — जैसे: 8वीं, 10वीं पास, 12वीं पास',
      '3. पारिवारिक व्यवसाय (Family Occupation) — जैसे: बुनाई, कृषि, हस्तशिल्प, व्यापार',
      '4. कौशल और रुचियां (Skills & Interests) — जैसे: सिलाई कला, ड्राइविंग, बिक्री कौशल',
      '5. रोजगार प्राथमिकता (Job Preference) — स्वरोजगार या मासिक वेतन वाली नौकरी?',
      '6. गतिशीलता (Mobility) — गांव के अंदर या जिले के आसपास?',
    ],
    micTapAnnouncement:
      'कृपया ऊपर दिए गए विवरण बोलें। या सहायता के लिए हेल्प बटन या कॉल बटन दबाएं। हम एक फोन कॉल की तरह बातचीत करके इसे भरेंगे।',
    callWelcome:
      'नमस्ते! मैं कुरल सेवी डिजिटल सहायक हूँ। एक कॉल की तरह बातचीत करके आपके सभी विवरण दर्ज करूंगा।',
    callQuestions: [
      {
        question: 'आप वर्तमान में क्या काम या आजीविका करते हैं? और आपकी पढ़ाई कितनी हुई है?',
        tamilMeaning: 'काम और शिक्षा',
        quickAnswers: ['किराना दुकान (12वीं पास)', 'सिलाई का कार्य (10वीं पास)', 'ऑटो चालक (8वीं पास)', 'कृषि मजदूरी'],
      },
      {
        question: 'आपके परिवार का पारंपरिक काम क्या है? और आपमें क्या विशेष कौशल या रुचि है?',
        tamilMeaning: 'पारिवारिक काम और कौशल',
        quickAnswers: ['हथकरघा बुनाई', 'कृषि एवं पशुपालन', 'वाहन चालन व मरम्मत', 'दुकान प्रबंधन'],
      },
      {
        question: 'क्या आप अपना स्वयं का व्यवसाय करना चाहते हैं या मासिक वेतन पर काम? क्या स्थानीय स्तर पर काम कर सकते हैं?',
        tamilMeaning: 'कार्य प्राथमिकता',
        quickAnswers: ['स्थानीय स्तर पर स्वरोजगार', 'वेतन रोजगार (Wage Job)', 'गाँव के अंदर दुकान'],
      },
    ],
    aiConfirmation: 'धन्यवाद! आपकी बातचीत के आधार पर सभी 7 अनिवार्य आयाम सफलता से दर्ज कर लिए गए हैं।',
  },
  'en-IN': {
    code: 'en-IN',
    name: 'English',
    nativeName: 'English (IN)',
    checklistTitle: '6 Key Details to Provide for PM-AJAY Dossier:',
    items: [
      '1. Current Livelihood / Trade — e.g. Grocery shop, tailoring, agricultural labour, driving',
      '2. Educational Attainment — e.g. Class 8, Class 10 (SSLC), Class 12, ITI/Diploma',
      '3. Family Occupation — e.g. Weaving, farming, artisanal work, trade',
      '4. Skills & Technical Interests — e.g. Garment making, commercial driving, retail sales',
      '5. Employment Preference — Self-employment enterprise or regular wage job?',
      '6. Mobility Constraints — Within village panchayat or district-wide?',
    ],
    micTapAnnouncement:
      'Please speak the details listed above. Or tap the Help button to complete this through a guided call conversation.',
    callWelcome:
      'Welcome! I am Kural Sevi AI Assistant. We will complete your profile through an interactive phone-call conversation.',
    callQuestions: [
      {
        question: 'What is your current livelihood or trade, and what is your education level?',
        tamilMeaning: 'Current Trade & Education',
        quickAnswers: ['Retail Grocery (Class 12)', 'Tailoring & Garments (Class 10)', 'Auto Driver (Class 8)', 'Agri Worker'],
      },
      {
        question: 'What is your traditional family occupation, and what skills or interests do you have?',
        tamilMeaning: 'Family Occupation & Skills',
        quickAnswers: ['Handloom Textile Weaving', 'Farming & Dairy', 'Driving & Mechanical', 'Retail Sales & Accounts'],
      },
      {
        question: 'Do you prefer self-employment or wage employment, and what are your mobility preferences?',
        tamilMeaning: 'Employment Preference & Mobility',
        quickAnswers: ['Local Self-Employment', 'District Wage Employment', 'Village Enterprise'],
      },
    ],
    aiConfirmation: 'Thank you! Your responses have been processed across all 7 mandated DPDP dimensions.',
  },
};

const SAMPLE_SPEECHES = [
  {
    label: 'Small Retailer / மளிகை கடை',
    text: 'நான் 12 ஆம் வகுப்பு வரை படிச்சிருக்கேன். எங்க குடும்பத்துல கூலி வேலை தான் செய்றாங்க. நான் இப்போதைக்கு மளிகை கடை வச்சுட்டு இருக்கேன். எனக்கு மளிகை கடை வியாபாரத்துல நல்ல ஆர்வம் இருக்கு. உள்ளூரிலேயே கிராம சந்தையில சொந்த தொழில் பண்ண தான் எனக்கு விருப்பம். வெளியூர் போக முடியாது.',
  },
  {
    label: 'Local Tailor / தையற்கலை',
    text: 'பத்தாம் வகுப்பு முடித்திருக்கிறேன். குடும்பத்துல எல்லாரும் நெசவு மற்றும் தையல் வேலை. நான் சொந்தமா தையல் கடை மற்றும் துணி தைக்கும் தொழில் செய்ய விரும்புகிறேன். கிராமத்துல உள்ளேயே செய்ய ஆசை.',
  },
  {
    label: 'Auto Driver / ஓட்டுநர்',
    text: 'நான் எட்டாம் வகுப்பு வரை படித்தேன். குடும்ப தொழில் விவசாய கூலி வேலை. தற்போது ஆட்டோ ஓட்டி வருகிறேன். மாவட்டத்திற்குள் கமர்ஷியல் வாகனம் ஓட்டும் சம்பள வேலை அல்லது சொந்த ஆட்டோ தொழில் செய்ய தயார்.',
  },
];

export function KioskVoiceAssistant({ onApplyExtractedFields, language = 'ta' }: Props) {
  const defaultLangKey = language === 'hi' ? 'hi-IN' : 'ta-IN';
  const [selectedLang, setSelectedLang] = useState<string>(defaultLangKey);

  // General States
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [aiVoiceMuted, setAiVoiceMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<Partial<MandatedFieldsData> | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isKioskFullscreen, setIsKioskFullscreen] = useState(false);

  // Call Conversation Mode States
  const [isCallModeActive, setIsCallModeActive] = useState(false);
  const [callStepIndex, setCallStepIndex] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [callHistory, setCallHistory] = useState<{ role: 'ai' | 'citizen'; text: string }[]>([]);

  // Banner status message
  const [aiAnnouncementText, setAiAnnouncementText] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);

  const langConfig = LANGUAGE_DATA[selectedLang] || LANGUAGE_DATA['ta-IN'];

  // Speech Synthesis TTS Helper
  const speakAIText = useCallback((textToSpeak: string, langCode: string = selectedLang, onFinish?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onFinish) onFinish();
      return;
    }
    if (aiVoiceMuted) {
      if (onFinish) onFinish();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = langCode;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2)));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setIsAISpeaking(true);
      };

      utterance.onend = () => {
        setIsAISpeaking(false);
        if (onFinish) onFinish();
      };

      utterance.onerror = () => {
        setIsAISpeaking(false);
        if (onFinish) onFinish();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsAISpeaking(false);
      if (onFinish) onFinish();
    }
  }, [aiVoiceMuted, selectedLang]);

  const stopAISpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);
  };

  // Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLang;

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          const text = current.trim();
          setTranscript(text);

          if (isCallModeActive) {
            // Update last citizen answer in call history
            setCallHistory((prev) => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].role === 'citizen') {
                updated[updated.length - 1].text = text;
              } else {
                updated.push({ role: 'citizen', text });
              }
              return updated;
            });
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedLang, isCallModeActive]);

  // Actual recording starter
  const startRecordingStream = () => {
    setTranscript('');
    setRecordingSeconds(0);
    setIsListening(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
      } catch (_) {}
    }
  };

  // User taps the main microphone button
  const handleMicTap = () => {
    if (isListening) {
      // User tapped to stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (transcript.trim()) {
        extractFromTranscript(transcript);
      }
      return;
    }

    // Citizen tapped microphone to begin:
    // AI announces: "Please tell the details above, or tap the Help button to fill through a phone-like conversation."
    setAiAnnouncementText(langConfig.micTapAnnouncement);
    speakAIText(langConfig.micTapAnnouncement, selectedLang, () => {
      // After AI finishes speaking instruction, start recording citizen speech!
      startRecordingStream();
    });
  };

  // Call Mode Timer
  useEffect(() => {
    if (isCallModeActive) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isCallModeActive]);

  // Start Guided Call Conversation
  const startGuidedCall = () => {
    stopAISpeech();
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
    }

    setIsCallModeActive(true);
    setCallStepIndex(0);
    setCallHistory([]);
    setExtractedPreview(null);

    // AI begins call with welcoming introduction + question 1
    const firstQuestion = langConfig.callQuestions[0];
    const initialText = `${langConfig.callWelcome} ${firstQuestion.question}`;
    setCallHistory([{ role: 'ai', text: initialText }]);

    speakAIText(initialText, selectedLang, () => {
      // Open mic for citizen's answer to question 1
      startRecordingStream();
    });
  };

  // Next Question in Guided Call
  const handleNextCallTurn = (citizenAnswerOverride?: string) => {
    stopAISpeech();
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
    }

    const answer = citizenAnswerOverride || transcript || 'விவரம் அளிக்கப்பட்டது';
    
    // Add answer to history if provided via button
    if (citizenAnswerOverride) {
      setCallHistory((prev) => [...prev, { role: 'citizen', text: citizenAnswerOverride }]);
    }

    const nextIndex = callStepIndex + 1;
    if (nextIndex < langConfig.callQuestions.length) {
      setCallStepIndex(nextIndex);
      const nextQ = langConfig.callQuestions[nextIndex];
      const aiPromptText = nextQ.question;
      setCallHistory((prev) => [...prev, { role: 'ai', text: aiPromptText }]);

      speakAIText(aiPromptText, selectedLang, () => {
        startRecordingStream();
      });
    } else {
      // Completed all questions! End call and synthesize all answers into 7 dimensions
      endCallAndExtract();
    }
  };

  const endCallAndExtract = () => {
    stopAISpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsListening(false);
    setIsCallModeActive(false);

    // Combine all citizen spoken turns
    const combinedDialogue = callHistory
      .map((c) => (c.role === 'citizen' ? c.text : ''))
      .filter(Boolean)
      .join('. ');

    const textToExtract = combinedDialogue.length > 10 ? combinedDialogue : transcript;
    if (textToExtract) {
      extractFromTranscript(textToExtract);
    }
  };

  const extractFromTranscript = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/voice/kiosk-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speechText: text, language: selectedLang.slice(0, 2) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setExtractedPreview(data.extracted);
        // AI speaks confirmation aloud
        speakAIText(langConfig.aiConfirmation, selectedLang);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToForm = () => {
    if (extractedPreview) {
      onApplyExtractedFields(extractedPreview);
    }
  };

  const toggleFullscreenKiosk = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsKioskFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen().then(() => setIsKioskFullscreen(false)).catch(() => {});
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#BACEEB] shadow-lg overflow-hidden transition-all">
      {/* Kiosk Header */}
      <div className="bg-[#0B3064] text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-xs">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                Gram Panchayat Kiosk Voice Assistant
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                Interactive Voice AI
              </span>
            </div>
            <p className="text-xs text-blue-100/80">
              Speak required details directly or tap &ldquo;Help&rdquo; for a guided phone-like conversation.
            </p>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-2">
          {/* Help Button (Guided Conversation Mode) */}
          <button
            type="button"
            onClick={startGuidedCall}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border',
              isCallModeActive
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                : 'bg-[#E65100] hover:bg-[#D84315] border-amber-400/40 text-white'
            )}
            title="Start interactive guided phone-like conversation"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{isCallModeActive ? 'Active Call...' : 'Help / Voice Call'}</span>
          </button>

          {/* Mute Audio Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isAISpeaking) stopAISpeech();
              setAiVoiceMuted(!aiVoiceMuted);
            }}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border',
              aiVoiceMuted
                ? 'bg-rose-900/40 border-rose-400/30 text-rose-200'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            )}
          >
            {aiVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{aiVoiceMuted ? 'Muted' : 'Sound ON'}</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/20 text-xs">
            <Languages className="w-3.5 h-3.5 text-blue-200" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
            >
              {Object.entries(LANGUAGE_DATA).map(([key, cfg]) => (
                <option key={key} value={key} className="text-slate-900">
                  {cfg.nativeName} ({cfg.name})
                </option>
              ))}
            </select>
          </div>

          {/* Fullscreen Kiosk */}
          <button
            type="button"
            onClick={toggleFullscreenKiosk}
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title={isKioskFullscreen ? 'Exit Fullscreen' : 'Enter Kiosk Fullscreen Mode'}
          >
            {isKioskFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-4 sm:p-6 space-y-5 bg-gradient-to-b from-slate-50/50 to-white">

        {/* 1. Clear Checklist of What Needs to Be Filled */}
        <div className="bg-[#EDF3FC] border border-[#BACEEB] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0B3064] font-extrabold text-xs sm:text-sm">
              <ListChecks className="w-4 h-4 text-[#0B3064]" />
              <span>{langConfig.checklistTitle}</span>
            </div>
            <span className="text-[10px] font-bold text-[#0B3064] bg-white border border-[#BACEEB] px-2 py-0.5 rounded-md">
              7 DPDP Dimensions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
            {langConfig.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-[#BACEEB]/60 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B3064] mt-1.5 shrink-0" />
                <span className="font-medium leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. AI Audio Announcement Banner (When mic is tapped or guidance is given) */}
        {aiAnnouncementText && !isCallModeActive && (
          <div className="bg-amber-50 border-2 border-amber-300/80 rounded-xl p-3.5 flex items-start justify-between gap-3 animate-in fade-in-50">
            <div className="flex items-start gap-2.5">
              <Bot className={cn('w-5 h-5 text-amber-700 shrink-0 mt-0.5', isAISpeaking && 'animate-bounce')} />
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  {isAISpeaking ? 'குரல் செவி AI வழிகாட்டல் (Speaking Aloud...):' : 'AI வழிகாட்டல்:'}
                </span>
                <p className="text-xs sm:text-sm font-medium text-amber-900 mt-0.5">
                  &ldquo;{aiAnnouncementText}&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={startGuidedCall}
              className="px-3 py-1.5 rounded-lg bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>உதவி பொத்தான் (Call Help)</span>
            </button>
          </div>
        )}

        {/* 3A. Guided Voice Call Interface (When Call / Help Mode is Active) */}
        {isCallModeActive ? (
          <div className="bg-gradient-to-b from-[#0B3064] to-[#103D7A] text-white rounded-2xl p-5 shadow-xl border-2 border-blue-400/40 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Call Status Bar */}
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white ring-4 ring-emerald-400/30 animate-pulse">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold tracking-tight">
                    Guided Voice Call with Kural Sevi AI
                  </h4>
                  <p className="text-[11px] text-emerald-300 font-mono">
                    Call Active · {formatTime(callDuration)} · Turn {callStepIndex + 1} of {langConfig.callQuestions.length}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={endCallAndExtract}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call & Auto-Fill</span>
              </button>
            </div>

            {/* Current Question Display */}
            <div className="bg-white/10 rounded-xl p-4 border border-white/15 space-y-2">
              <span className="text-[11px] text-blue-200 uppercase tracking-wider font-bold">
                AI Officer Asks:
              </span>
              <p className="text-sm sm:text-base font-bold text-white">
                {langConfig.callQuestions[callStepIndex]?.question}
              </p>
              {isAISpeaking && (
                <div className="flex items-center gap-1 text-xs text-emerald-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>AI speaking question into call speaker...</span>
                </div>
              )}
            </div>

            {/* Citizen Speaking Section within Call */}
            <div className="bg-black/30 rounded-xl p-4 border border-white/15 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-200 font-semibold flex items-center gap-1.5">
                  <Mic className={cn('w-3.5 h-3.5', isListening ? 'text-rose-400 animate-pulse' : 'text-slate-400')} />
                  Citizen Spoken Reply:
                </span>
                {isListening && (
                  <span className="text-rose-400 font-bold text-[11px] animate-pulse">
                    Listening to your voice...
                  </span>
                )}
              </div>

              <div className="min-h-[50px] p-2.5 rounded-lg bg-black/40 text-xs text-slate-100 font-medium">
                {transcript || (
                  <span className="text-slate-400 italic">
                    Speak into microphone or pick one of the quick responses below...
                  </span>
                )}
              </div>

              {/* Quick Answer Options */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-blue-200 font-semibold uppercase tracking-wider block">
                  Quick Spoken Answers:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {langConfig.callQuestions[callStepIndex]?.quickAnswers.map((ans, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleNextCallTurn(ans)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all font-semibold flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>{ans}</span>
                      <ChevronRight className="w-3 h-3 text-blue-200" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Question / Finish Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleNextCallTurn()}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>
                    {callStepIndex < langConfig.callQuestions.length - 1 ? 'Next Question' : 'Complete & Extract 7 Dimensions'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 3B. Standard Direct Mic Intake Mode */
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Pulsing Mic Button */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleMicTap}
                  className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer relative',
                    isListening
                      ? 'bg-rose-600 text-white ring-8 ring-rose-400/30 scale-105 animate-pulse'
                      : 'bg-[#0A783C] hover:bg-[#086332] text-white ring-4 ring-emerald-200 hover:scale-105'
                  )}
                >
                  {isListening ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                  {isListening && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
                <div className="text-center">
                  <span className={cn(
                    'text-xs font-bold block',
                    isListening ? 'text-rose-600' : 'text-slate-800'
                  )}>
                    {isListening ? `Recording (${formatTime(recordingSeconds)})` : 'Tap to Speak'}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {isListening ? 'Tap again when finished' : 'Speak or tap Help'}
                  </span>
                </div>
              </div>

              {/* Transcript & Presets Box */}
              <div className="flex-1 w-full space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <UserCheck className="w-4 h-4 text-[#0B3064]" />
                    <span>Citizen Spoken Response</span>
                  </div>
                  {isListening && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      <span>Live Tamil Capture Active</span>
                    </div>
                  )}
                </div>

                {/* Speech Output Box */}
                <div className="min-h-[75px] max-h-32 overflow-y-auto p-3.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm leading-relaxed text-slate-900 shadow-2xs">
                  {transcript ? (
                    <p className="font-medium text-slate-800">{transcript}</p>
                  ) : (
                    <p className="text-slate-600 italic">
                      {isListening
                        ? 'Listening to microphone... Speak the 6 details shown above in ' + langConfig.name + '...'
                        : 'Tap the mic above and speak, or click "Help / Voice Call" to answer questions like a phone call.'}
                    </p>
                  )}
                </div>

                {/* Quick Presets for Demo */}
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                      Quick Vernacular Presets:
                    </span>
                    {SAMPLE_SPEECHES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          stopAISpeech();
                          setTranscript(sample.text);
                          extractFromTranscript(sample.text);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-[#EDF3FC] text-[#0B3064] font-semibold transition-all border border-[#BACEEB] hover:border-[#0B3064] shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <Sparkles className="w-3 h-3 text-[#E65100]" />
                        <span>{sample.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Extracted 7 DPDP Dimensions Results */}
        {isProcessing ? (
          <div className="p-6 rounded-xl bg-[#EDF3FC] border border-[#BACEEB] flex items-center justify-center gap-3 text-xs sm:text-sm font-bold text-[#0B3064] animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin text-[#0B3064]" />
            <span>AI is analyzing spoken vernacular audio and extracting 7 DPDP dimensions...</span>
          </div>
        ) : extractedPreview ? (
          <div className="p-5 rounded-xl bg-[#EDF9F1] border-2 border-[#BBE8CB] space-y-4 shadow-sm animate-in fade-in-50">
            {/* Header of Results */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#BBE8CB] pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#0A783C]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>7 Mandated Profile Dimensions Extracted from Voice</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakAIText(langConfig.aiConfirmation, selectedLang)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#BBE8CB] hover:bg-slate-50 text-[#0A783C] font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Re-play AI Voice Confirmation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Re-hear AI</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  className="px-4 py-2 rounded-lg bg-[#0A783C] hover:bg-[#086332] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Auto-Fill Wizard Form</span>
                </button>
              </div>
            </div>

            {/* Grid of 7 Mandated Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-[#BBE8CB] shadow-2xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider">
                  1. Current Livelihood
                </span>
                <span className="text-slate-900 font-bold block mt-0.5">
                  {extractedPreview.current_livelihood || 'Not stated'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#BBE8CB] shadow-2xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider">
                  2. Skills & Interests
                </span>
                <span className="text-slate-900 font-bold block mt-0.5">
                  {extractedPreview.skills_and_interests || 'Not stated'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#BBE8CB] shadow-2xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider">
                  3. Mobility Constraints
                </span>
                <span className="text-slate-900 font-bold block mt-0.5">
                  {extractedPreview.mobility_constraints || 'Not stated'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#BBE8CB] shadow-2xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider">
                  4. Educational Background
                </span>
                <span className="text-slate-900 font-bold block mt-0.5">
                  {extractedPreview.educational_background || 'Not stated'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#BBE8CB] shadow-2xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider">
                  5. Family Occupation
                </span>
                <span className="text-slate-900 font-bold block mt-0.5">
                  {extractedPreview.family_occupation || 'Not stated'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#BBE8CB] shadow-2xs">
                <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider">
                  6. Employment Preference
                </span>
                <span className="text-[#0B3064] font-extrabold uppercase font-mono block mt-0.5">
                  {extractedPreview.employment_preference === 'self'
                    ? 'Self-Employment'
                    : extractedPreview.employment_preference === 'wage'
                    ? 'Wage Employment'
                    : 'Either'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#BBE8CB] shadow-2xs sm:col-span-2 md:col-span-3">
                <span className="text-[10px] text-slate-600 block uppercase font-bold tracking-wider">
                  7. Local Economic Context
                </span>
                <span className="text-slate-900 font-bold block mt-0.5">
                  {extractedPreview.local_economic_context || 'Identified based on district livelihood cluster'}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
