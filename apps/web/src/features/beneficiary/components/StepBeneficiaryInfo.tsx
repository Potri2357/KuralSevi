'use client';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowRight, User, Languages, Check } from 'lucide-react';
import type { BeneficiaryFormData } from '../types';

interface Props {
  form: BeneficiaryFormData;
  onChange: (form: BeneficiaryFormData) => void;
  onNext: () => void;
}

const LANGUAGES = [
  { id: 'Tamil', label: 'தமிழ்', sub: 'Tamil', code: 'ta' },
  { id: 'Hindi', label: 'हिन्दी', sub: 'Hindi', code: 'hi' },
  { id: 'Telugu', label: 'తెలుగు', sub: 'Telugu', code: 'te' },
  { id: 'English', label: 'English', sub: 'English (IN)', code: 'en' },
];

const I18N_STEP1: Record<string, {
  headerTitle: string;
  headerSub: string;
  langTitle: string;
  langSub: string;
  districtLabel: string;
  districtOptions: { value: string; label: string }[];
  genderLabel: string;
  genderOptions: { value: string; label: string }[];
  ageLabel: string;
  ageOptions: { value: string; label: string }[];
  phoneLabel: string;
  phonePlaceholder: string;
  phoneSecurityNotice: string;
  nextButton: string;
}> = {
  Tamil: {
    headerTitle: 'படி 1: பயனாளியின் அடிப்படை விவரங்கள் & புள்ளிவிவரங்கள்',
    headerSub: 'பொருத்தமான திட்டப் பொருத்தத்திற்கு மாவட்டம் மற்றும் தாய்மொழியைக் குறிப்பிடவும்',
    langTitle: 'விருப்ப மொழி (Select Preferred Language)',
    langSub: 'முதலில் பேசும் மொழியை தேர்வு செய்யவும். படிவத்தின் அனைத்து விவரங்களும் இந்த மொழியில் மாறும்.',
    districtLabel: 'மாவட்டம் (தமிழ்நாடு)',
    districtOptions: [
      { value: 'Madurai', label: 'மதுரை' },
      { value: 'Namakkal', label: 'நாமக்கல்' },
      { value: 'Tiruppur', label: 'திருப்பூர்' },
      { value: 'Salem', label: 'சேலம்' },
      { value: 'Coimbatore', label: 'கோயம்புத்தூர்' },
      { value: 'Erode', label: 'ஈரோடு' },
      { value: 'Tiruchirappalli', label: 'திருச்சிராப்பள்ளி' },
      { value: 'Dindigul', label: 'திண்டுக்கல்' },
      { value: 'Thanjavur', label: 'தஞ்சாவூர்' },
      { value: 'Chennai', label: 'சென்னை' },
    ],
    genderLabel: 'பாலினம்',
    genderOptions: [
      { value: 'Female', label: 'பெண் (Female)' },
      { value: 'Male', label: 'ஆண் (Male)' },
      { value: 'Transgender', label: 'மூன்றாம் பாலினம் (Transgender)' },
    ],
    ageLabel: 'வயது பிரிவு',
    ageOptions: [
      { value: '18-25', label: '18-25 ஆண்டுகள்' },
      { value: '26-35', label: '26-35 ஆண்டுகள்' },
      { value: '36-45', label: '36-45 ஆண்டுகள்' },
      { value: '46-60', label: '46-60 ஆண்டுகள்' },
    ],
    phoneLabel: 'பயனாளி தொடர்பு தொலைபேசி எண் (விருப்பத்தேர்வு)',
    phonePlaceholder: '+91 98765 43210 (குரல் அழைப்பு மற்றும் பரிந்துரைகள் பெற)',
    phoneSecurityNotice: 'தொலைபேசி எண்கள் AES-256-GCM முறைப்படி குறியாக்கம் செய்யப்பட்டு அமர்வின் போது மட்டுமே பாதுகாக்கப்படும்.',
    nextButton: '7 கட்டாய பரிமாணங்களுக்கு தொடரவும்',
  },
  Hindi: {
    headerTitle: 'चरण 1: लाभार्थी की बुनियादी जानकारी और जनसांख्यिकी',
    headerSub: 'उपयुक्त योजना मिलान के लिए प्रशासनिक जिला और पसंदीदा भाषा चुनें',
    langTitle: 'पसंदीदा भाषा (Select Preferred Language)',
    langSub: 'पहले अपनी पसंदीदा भाषा चुनें। सभी विवरण इसी भाषा में प्रदर्शित होंगे।',
    districtLabel: 'ज़िला (तमिलनाडु)',
    districtOptions: [
      { value: 'Madurai', label: 'मदुरै' },
      { value: 'Namakkal', label: 'नमक्कल' },
      { value: 'Tiruppur', label: 'तिरुपुर' },
      { value: 'Salem', label: 'सलेम' },
      { value: 'Coimbatore', label: 'कोयंबटूर' },
      { value: 'Erode', label: 'ईरोड' },
      { value: 'Tiruchirappalli', label: 'तिरुचिरापल्ली' },
      { value: 'Dindigul', label: 'डिंडीगुल' },
      { value: 'Thanjavur', label: 'तंजावुर' },
      { value: 'Chennai', label: 'चेन्नई' },
    ],
    genderLabel: 'लिंग (Gender)',
    genderOptions: [
      { value: 'Female', label: 'महिला (Female)' },
      { value: 'Male', label: 'पुरुष (Male)' },
      { value: 'Transgender', label: 'अन्य (Transgender)' },
    ],
    ageLabel: 'आयु वर्ग (Age Category)',
    ageOptions: [
      { value: '18-25', label: '18-25 वर्ष' },
      { value: '26-35', label: '26-35 वर्ष' },
      { value: '36-45', label: '36-45 वर्ष' },
      { value: '46-60', label: '46-60 वर्ष' },
    ],
    phoneLabel: 'लाभार्थी संपर्क फोन नंबर (वैकल्पिक)',
    phonePlaceholder: '+91 98765 43210 (वॉयस कॉल व सिफ़ारिशों के लिए)',
    phoneSecurityNotice: 'फ़ोन नंबर AES-256-GCM से एन्क्रिप्ट किए जाते हैं और केवल सक्रिय सत्र के दौरान सुरक्षित रहते हैं।',
    nextButton: '7 अनिवार्य आयामों पर आगे बढ़ें',
  },
  Telugu: {
    headerTitle: 'దశ 1: లబ్ధిదారుని ప్రాథమిక సమాచారం & గణాంకాలు',
    headerSub: 'సరిపోయే పథకాల కోసం జిల్లా మరియు మాట్లాడే భాషను ఎంచుకోండి',
    langTitle: 'ప్రాధాన్య భాష (Select Preferred Language)',
    langSub: 'మొదట మీ భాషను ఎంచుకోండి. అన్ని వివరాలు ఆ భాషలోనే కనిపిస్తాయి.',
    districtLabel: 'జిల్లా (తమిళనాడు)',
    districtOptions: [
      { value: 'Madurai', label: 'మదురై' },
      { value: 'Namakkal', label: 'నమక్కల్' },
      { value: 'Tiruppur', label: 'తిరుప్పూర్' },
      { value: 'Salem', label: 'సేలం' },
      { value: 'Coimbatore', label: 'కోయంబత్తూరు' },
      { value: 'Erode', label: 'ఈరోడ్' },
      { value: 'Tiruchirappalli', label: 'తిరుచిరాపల్లి' },
      { value: 'Dindigul', label: 'దిండిగల్' },
      { value: 'Thanjavur', label: 'తంజావూరు' },
      { value: 'Chennai', label: 'చెన్నై' },
    ],
    genderLabel: 'లింగం (Gender)',
    genderOptions: [
      { value: 'Female', label: 'మహిళ (Female)' },
      { value: 'Male', label: 'పురుషుడు (Male)' },
      { value: 'Transgender', label: 'ఇతర (Transgender)' },
    ],
    ageLabel: 'వయో పరిమితి (Age Category)',
    ageOptions: [
      { value: '18-25', label: '18-25 సంవత్సరాలు' },
      { value: '26-35', label: '26-35 సంవత్సరాలు' },
      { value: '36-45', label: '36-45 సంవత్సరాలు' },
      { value: '46-60', label: '46-60 సంవత్సరాలు' },
    ],
    phoneLabel: 'లబ్ధిదారుని ఫోన్ నంబర్ (ఐచ్ఛికం)',
    phonePlaceholder: '+91 98765 43210 (వాయిస్ కాల్ మరియు సిఫార్సుల కొరకు)',
    phoneSecurityNotice: 'ఫోన్ నంబర్లు AES-256-GCM ద్వారా సురక్షితంగా ఎన్‌క్రిప్ట్ చేయబడతాయి.',
    nextButton: '7 తప్పనిసరి డైమెన్షన్‌లకు కొనసాగండి',
  },
  English: {
    headerTitle: 'Step 1: Beneficiary Basic Information & Demographics',
    headerSub: 'Capture administrative district and spoken dialect for appropriate local matching',
    langTitle: 'Preferred Spoken Language',
    langSub: 'Select language first. All intake questions and voice recitation will use this language.',
    districtLabel: 'District (Tamil Nadu)',
    districtOptions: [
      { value: 'Madurai', label: 'Madurai' },
      { value: 'Namakkal', label: 'Namakkal' },
      { value: 'Tiruppur', label: 'Tiruppur' },
      { value: 'Salem', label: 'Salem' },
      { value: 'Coimbatore', label: 'Coimbatore' },
      { value: 'Erode', label: 'Erode' },
      { value: 'Tiruchirappalli', label: 'Tiruchirappalli' },
      { value: 'Dindigul', label: 'Dindigul' },
      { value: 'Thanjavur', label: 'Thanjavur' },
      { value: 'Chennai', label: 'Chennai' },
    ],
    genderLabel: 'Gender',
    genderOptions: [
      { value: 'Female', label: 'Female' },
      { value: 'Male', label: 'Male' },
      { value: 'Transgender', label: 'Transgender' },
    ],
    ageLabel: 'Age Category',
    ageOptions: [
      { value: '18-25', label: '18-25 years' },
      { value: '26-35', label: '26-35 years' },
      { value: '36-45', label: '36-45 years' },
      { value: '46-60', label: '46-60 years' },
    ],
    phoneLabel: 'Beneficiary Contact Phone (Optional)',
    phonePlaceholder: '+91 98765 43210 (Used solely for IVR dispatch and audio recommendations)',
    phoneSecurityNotice: 'Phone numbers are encrypted using AES-256-GCM and stored only during the active intake session.',
    nextButton: 'Continue to 7 Mandated Dimensions',
  },
};

export function StepBeneficiaryInfo({ form, onChange, onNext }: Props) {
  const currentLang = form.language in I18N_STEP1 ? form.language : 'Tamil';
  const t = I18N_STEP1[currentLang] || I18N_STEP1.Tamil;

  const handleChange = (key: keyof BeneficiaryFormData, value: string) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <Card className="bg-white border-2 border-[#BACEEB] shadow-sm">
      <CardHeader className="bg-[#EDF3FC] border-b border-[#BACEEB] pb-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-[#0B3064]" />
          <h2 className="font-extrabold text-base text-[#0B3064]">
            {t.headerTitle}
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          {t.headerSub}
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* FIRST: Interactive Language Selection Cards */}
        <div className="bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B3064]">
              <Languages className="w-4 h-4 text-[#0B3064]" />
              <span>{t.langTitle}</span>
              <span className="text-rose-600">*</span>
            </div>
            <span className="text-[11px] font-bold text-[#0A783C] bg-[#EDF9F1] border border-[#BBE8CB] px-2 py-0.5 rounded-full">
              {form.language} Active
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {t.langSub}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {LANGUAGES.map((lang) => {
              const isSelected = form.language === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleChange('language', lang.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${
                    isSelected
                      ? 'bg-[#0B3064] text-white border-[#0B3064] shadow-sm ring-2 ring-blue-300'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-[#0B3064] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-sm tracking-tight">{lang.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className={`text-[11px] font-semibold mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {lang.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Remaining Demographic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* District */}
          <div>
            <label
              htmlFor="field-district"
              className="text-xs text-slate-900 font-bold uppercase tracking-wider mb-1.5 block"
            >
              {t.districtLabel} <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-district"
              name="district"
              value={form.district}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3064] cursor-pointer min-h-[44px] shadow-2xs"
            >
              {t.districtOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="field-gender"
              className="text-xs text-slate-900 font-bold uppercase tracking-wider mb-1.5 block"
            >
              {t.genderLabel} <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-gender"
              name="gender"
              value={form.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3064] cursor-pointer min-h-[44px] shadow-2xs"
            >
              {t.genderOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Age Category */}
          <div>
            <label
              htmlFor="field-age-group"
              className="text-xs text-slate-900 font-bold uppercase tracking-wider mb-1.5 block"
            >
              {t.ageLabel} <span className="text-rose-500">*</span>
            </label>
            <select
              id="field-age-group"
              name="age_group"
              value={form.age_group}
              onChange={(e) => handleChange('age_group', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3064] cursor-pointer min-h-[44px] shadow-2xs"
            >
              {t.ageOptions.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Beneficiary Contact Phone */}
          <div>
            <label
              htmlFor="field-phone"
              className="text-xs text-slate-900 font-bold uppercase tracking-wider mb-1.5 block"
            >
              {t.phoneLabel}
            </label>
            <input
              id="field-phone"
              name="phone"
              type="tel"
              placeholder={t.phonePlaceholder}
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3064] min-h-[44px] shadow-2xs"
            >
            </input>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          {t.phoneSecurityNotice}
        </p>
      </CardContent>

      <CardFooter className="bg-slate-50 border-t border-[#BACEEB] py-4">
        <div className="flex justify-end w-full">
          <Button
            id="step1-next"
            onClick={onNext}
            className="bg-[#0B3064] hover:bg-[#144282] text-white font-extrabold px-6 py-2.5 text-sm shadow-sm flex items-center gap-2"
          >
            <span>{t.nextButton}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
