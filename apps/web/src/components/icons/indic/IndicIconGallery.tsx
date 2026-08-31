'use client';
import React, { useState } from 'react';
import {
  IndicEar,
  IndicScroll,
  IndicChakra,
  IndicRupeeDbt,
  IndicHandloom,
  IndicAgriSickle,
  IndicDiya,
  IndicNamaste,
  IndicGopuram,
  IndicGramSabha,
  IndicCertificate,
  IndicVoiceWave,
  IndicToolTrowel,
  type IndicIconProps,
} from './IndicIcons';
import { Sparkles, Copy, Check } from 'lucide-react';

interface IconMeta {
  name: string;
  component: React.ComponentType<IndicIconProps>;
  tamilName: string;
  domain: string;
  description: string;
}


const INDIC_ICONS: IconMeta[] = [
  {
    name: 'IndicEar',
    component: IndicEar,
    tamilName: 'குரல் செவி',
    domain: 'Voice-First Governance',
    description: 'Attentive ear with acoustic resonance listening to rural citizen voices without barriers.',
  },
  {
    name: 'IndicScroll',
    component: IndicScroll,
    tamilName: 'ஓலைச்சுவடி',
    domain: 'Ethical Foundations & Dossiers',
    description: 'Classical palm-leaf manuscript invoking Tirukkural and official case dossiers.',
  },
  {
    name: 'IndicChakra',
    component: IndicChakra,
    tamilName: 'அசோகச் சக்கரம்',
    domain: 'Public Welfare & Law',
    description: 'Wheel of constitutional justice, progress, and PM-AJAY national inclusion.',
  },
  {
    name: 'IndicRupeeDbt',
    component: IndicRupeeDbt,
    tamilName: 'நேரடி மானியம் (DBT)',
    domain: 'Financial Inclusion',
    description: 'Direct Benefit Transfer grant sanctions into Aadhaar-linked beneficiary accounts.',
  },
  {
    name: 'IndicHandloom',
    component: IndicHandloom,
    tamilName: 'கைத்தறி நெசவு',
    domain: 'NSQF Artisan Trades',
    description: 'Traditional flying shuttle and warp threads for weaver and textile crafts.',
  },
  {
    name: 'IndicAgriSickle',
    component: IndicAgriSickle,
    tamilName: 'வேளாண்மை & அறுவடை',
    domain: 'Agrarian Skilling',
    description: 'Crescent sickle with ripe paddy ears for agricultural allied trades.',
  },
  {
    name: 'IndicDiya',
    component: IndicDiya,
    tamilName: 'அகல் விளக்கு',
    domain: 'Dignity & Enlightenment',
    description: 'Auspicious traditional lamp signifying the light of vocational skill education.',
  },
  {
    name: 'IndicNamaste',
    component: IndicNamaste,
    tamilName: 'வணக்கம் (அஞ்சலி)',
    domain: 'Citizen Respect',
    description: 'Anjali mudra representing humble, dignified, citizen-centric administration.',
  },
  {
    name: 'IndicGopuram',
    component: IndicGopuram,
    tamilName: 'கோபுரம்',
    domain: 'Tamil Nadu Heritage',
    description: 'Dravidian architectural gateway celebrating civic heritage and regional stature.',
  },
  {
    name: 'IndicGramSabha',
    component: IndicGramSabha,
    tamilName: 'கிராம சபை',
    domain: 'Community Governance',
    description: 'Sacred banyan tree assembly representing village consensus and local livelihood needs.',
  },
  {
    name: 'IndicCertificate',
    component: IndicCertificate,
    tamilName: 'தகுதிச் சான்றிதழ்',
    domain: 'NSQF Credentials',
    description: 'Official National Skills Qualification Framework credential seal and ribbon.',
  },
  {
    name: 'IndicVoiceWave',
    component: IndicVoiceWave,
    tamilName: 'குரல் அலை',
    domain: 'AI Speech Intake',
    description: 'Acoustic waveform processing multilingual Tamil, Hindi, and Telugu speech.',
  },
  {
    name: 'IndicToolTrowel',
    component: IndicToolTrowel,
    tamilName: 'கொத்தனார் கரண்டி',
    domain: 'Construction & Masonry',
    description: 'Masonry trowel representing infrastructure, building, and fabrication trades.',
  },
];

export function IndicIconGallery() {
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(`<${name} className="w-5 h-5" />`);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#BACEEB] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF1FB] border border-[#BACEEB] flex items-center justify-center text-[#0B3064]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-[#0B3064]">
              Custom Indic Icon Set
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Handcrafted SVG icons tailored for Indian public governance, PM-AJAY, and Tamil Nadu livelihoods.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#0B3064] bg-[#EAF1FB] px-3 py-1 rounded-full border border-[#BACEEB]">
          {INDIC_ICONS.length} Custom Icons
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDIC_ICONS.map((icon) => {
          const IconComp = icon.component;
          const isCopied = copiedName === icon.name;
          return (
            <div
              key={icon.name}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#BACEEB] hover:shadow-md transition-all group relative"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 group-hover:border-[#0B3064]/40 flex items-center justify-center text-[#0B3064] shadow-2xs transition-colors">
                  <IconComp className="w-6 h-6 transition-transform group-hover:scale-110" />
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(icon.name)}
                  className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-[#0B3064] hover:border-[#BACEEB] transition-colors"
                  title="Copy JSX component tag"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0A783C]" />
                      <span className="text-[#0A783C] font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>JSX</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-bold text-sm text-slate-900 font-sans flex items-center gap-2">
                <span>{icon.name}</span>
                <span className="text-xs font-normal text-[#E05A1B]">{icon.tamilName}</span>
              </div>
              <div className="text-[11px] font-semibold text-[#0B3064] mt-0.5">
                {icon.domain}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                {icon.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
