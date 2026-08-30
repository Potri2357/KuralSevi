// Supported pilot languages — Tamil, Hindi, Telugu (FR-1)
export const SUPPORTED_LANGUAGES = [
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    sarvamCode: 'ta-IN',
    bcp47: 'ta-IN',
    states: ['Tamil Nadu', 'Puducherry'],
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    sarvamCode: 'hi-IN',
    bcp47: 'hi-IN',
    states: ['Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Chhattisgarh'],
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    sarvamCode: 'te-IN',
    bcp47: 'te-IN',
    states: ['Andhra Pradesh', 'Telangana'],
  },
] as const;

export type LanguageCode = 'ta' | 'hi' | 'te';

export function getLanguageByCode(code: string) {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

// Consent text per language (DPDP-compliant)
export const CONSENT_TEXT: Record<LanguageCode, string> = {
  ta: `நீங்கள் PM-AJAY GIA திட்டத்தின் கீழ் வாழ்வாதார தரவு சேகரிப்பிற்கு சம்மதிக்கிறீர்கள். உங்கள் தகவல்கள் NSQF-சீரமைக்கப்பட்ட திறன் பரிந்துரைகளுக்கும் மாவட்ட திட்டமிடலுக்கும் மட்டுமே பயன்படுத்தப்படும். நீங்கள் எந்த நேரத்திலும் திரும்பப் பெறலாம்.`,
  hi: `आप PM-AJAY GIA योजना के तहत आजीविका डेटा संग्रह के लिए सहमति दे रहे हैं। आपकी जानकारी केवल NSQF-संरेखित कौशल अनुशंसाओं और जिला योजना के लिए उपयोग की जाएगी। आप किसी भी समय सहमति वापस ले सकते हैं।`,
  te: `మీరు PM-AJAY GIA పథకం కింద జీవనోపాధి డేటా సేకరణకు సమ్మతిస్తున్నారు. మీ సమాచారం NSQF-అనుసంధానిత నైపుణ్య సిఫారసులు మరియు జిల్లా ప్రణాళిక కోసం మాత్రమే ఉపయోగించబడుతుంది. మీరు ఎప్పుడైనా ఉపసంహరించుకోవచ్చు.`,
};

export const FIELD_LABELS: Record<string, Record<LanguageCode, string>> = {
  educational_background: {
    ta: 'கல்வி தகுதி',
    hi: 'शैक्षिक योग्यता',
    te: 'విద్యార్హత',
  },
  family_occupation: {
    ta: 'குடும்பத் தொழில்',
    hi: 'पारिवारिक व्यवसाय',
    te: 'కుటుంబ వృత్తి',
  },
  current_livelihood: {
    ta: 'தற்போதைய வாழ்வாதாரம்',
    hi: 'वर्तमान आजीविका',
    te: 'ప్రస్తుత జీవనాధారం',
  },
  skills_and_interests: {
    ta: 'திறன்கள் மற்றும் ஆர்வங்கள்',
    hi: 'कौशल और रुचियां',
    te: 'నైపుణ్యాలు మరియు ఆసక్తులు',
  },
  mobility_constraints: {
    ta: 'இயக்கம் தொடர்பான கட்டுப்பாடுகள்',
    hi: 'गतिशीलता की बाधाएं',
    te: 'చలనశీలత పరిమితులు',
  },
  employment_preference: {
    ta: 'வேலைவாய்ப்பு விருப்பம்',
    hi: 'रोजगार प्राथमिकता',
    te: 'ఉద్యోగ ప్రాధాన్యత',
  },
  local_economic_context: {
    ta: 'உள்ளூர் பொருளாதார சூழல்',
    hi: 'स्थानीय आर्थिक संदर्भ',
    te: 'స్థానిక ఆర్థిక సందర్భం',
  },
};
