'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  LayoutList,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MandatedFieldsData } from '../types';

interface Props {
  fields: MandatedFieldsData;
  onChange: (fields: MandatedFieldsData) => void;
  onBack: () => void;
  onNext: () => void;
  language?: string;
}

interface QuestionDef {
  key: keyof MandatedFieldsData;
  dimensionNum: number;
  label: Record<string, string>;
  question: Record<string, string>;
  helper: Record<string, string>;
  placeholder: Record<string, string>;
  suggestions: Record<string, string[]>;
  isPreference?: boolean;
}

const QUESTIONS: QuestionDef[] = [
  {
    key: 'current_livelihood',
    dimensionNum: 1,
    label: {
      Tamil: '1. தற்போதைய தொழில் & வருமானம்',
      Hindi: '1. वर्तमान आजीविका और आय',
      Telugu: '1. ప్రస్తుత జీవనోపాధి & ఆదాయం',
      English: '1. Current Livelihood & Earnings',
    },
    question: {
      Tamil: 'நீங்கள் தற்போது என்ன வேலை அல்லது தொழில் செய்கிறீர்கள்? உங்கள் தோராயமான மாத வருமானம் என்ன?',
      Hindi: 'आप वर्तमान में क्या काम या आजीविका करते हैं? और आपकी अनुमानित मासिक आय कितनी है?',
      Telugu: 'మీరు ప్రస్తుతం ఏమి పని లేదా జీవనోపాధి చేస్తున్నారు? మీ నెలవారీ ఆదాయం ఎంత?',
      English: 'What is your current livelihood, trade, or daily work, and what are your approximate earnings?',
    },
    helper: {
      Tamil: 'முதன்மை வருமான ஆதாரம், பருவகால மாற்றங்கள், மற்றும் மாத வருமானத்தைக் குறிப்பிடவும்.',
      Hindi: 'प्राथमिक आय का स्रोत, मौसमी बदलाव और मासिक आय का विवरण दें।',
      Telugu: 'ప్రధాన ఆదాయ వనరు మరియు సుమారు నెలవారీ సంపాదనను తెలపండి.',
      English: 'State primary source of income, seasonal fluctuations, and estimated monthly income.',
    },
    placeholder: {
      Tamil: 'எ.கா: மளிகை கடை வியாபாரம், மாத வருமானம் சுமார் ₹8,000...',
      Hindi: 'उदा: किराना दुकान, अनुमानित मासिक आय ₹8,000...',
      Telugu: 'ఉదా: కిరాణా దుకాణం, నెలవారీ ఆదాయం ₹8,000...',
      English: 'e.g. Small retail grocery shop, monthly earnings approx ₹8,000...',
    },
    suggestions: {
      Tamil: [
        'மளிகை கடை வியாபாரம் (~₹8,000/மாதம்)',
        'விவசாய கூலி வேலை (~₹5,000/மாதம்)',
        'ஆட்டோ ஓட்டுநர் (~₹10,000/மாதம்)',
        'தையல் வேலை (~₹7,000/மாதம்)',
      ],
      Hindi: [
        'किराना दुकान (~₹8,000/माह)',
        'कृषि मजदूरी (~₹5,000/माह)',
        'ऑटो चालक (~₹10,000/माह)',
        'सिलाई का काम (~₹7,000/माह)',
      ],
      Telugu: [
        'కిరాణా దుకాణం (~₹8,000/నెల)',
        'వ్యవసాయ కూలీ (~₹5,000/నెల)',
        'ఆటో డ్రైవర్ (~₹10,000/నెల)',
      ],
      English: [
        'Small Grocery Store (~₹8,000/mo)',
        'Daily Wage Agricultural Labour (~₹5,000/mo)',
        'Commercial Auto Driver (~₹10,000/mo)',
        'Home Tailoring (~₹7,000/mo)',
      ],
    },
  },
  {
    key: 'skills_and_interests',
    dimensionNum: 2,
    label: {
      Tamil: '2. திறன்கள் மற்றும் ஆர்வங்கள்',
      Hindi: '2. कौशल और रुचियां',
      Telugu: '2. నైపుణ్యాలు & ఆసక్తులు',
      English: '2. Skills & Vocational Interests',
    },
    question: {
      Tamil: 'உங்களுக்கு தெரிந்த கைவினை அல்லது தொழில் திறன்கள் என்ன? எதிர்காலத்தில் என்ன தொழில் செய்ய ஆர்வம் உள்ளது?',
      Hindi: 'आपके पास कौन से व्यावहारिक कौशल हैं? और आप भविष्य में क्या काम या व्यापार करना चाहते हैं?',
      Telugu: 'మీకున్న వృత్తి నైపుణ్యాలు ఏమిటి? భవిష్యత్తులో ఏ రంగంలో పనిచేయడానికి ఆసక్తి ఉంది?',
      English: 'What practical skills do you have, and what vocational trades or enterprise are you interested in?',
    },
    helper: {
      Tamil: 'தையல், ஓட்டுநர், சமையல், எலக்ட்ரிக்கல், விற்பனை போன்ற திறன்களை கூறவும்.',
      Hindi: 'सिलाई, ड्राइविंग, मरम्मत, बिक्री या हस्तकला जैसे कौशल बताएं।',
      Telugu: 'కుట్టుపని, డ్రైవింగ్, వ్యాపారం వంటి నైపుణ్యాలను తెలపండి.',
      English: 'Identify mechanical skills, trade exposures, cooking, driving, stitching, etc.',
    },
    placeholder: {
      Tamil: 'எ.கா: தையல் தொழில் தெரியும்; சொந்தமாக துணிக்கடை அல்லது ரெடிமேட் ஆடை தைக்க ஆர்வம்...',
      Hindi: 'उदा: सिलाई का काम आता है; कपड़े की दुकान या बुटीक शुरू करने में रुचि...',
      Telugu: 'ఉదా: కుట్టుపని వచ్చు; సొంతంగా టైలరింగ్ షాప్ పెట్టాలని ఉంది...',
      English: 'e.g. Basic garment tailoring; interested in commercial apparel or boutique...',
    },
    suggestions: {
      Tamil: [
        'தையல் மற்றும் ஆடை தயாரித்தல்',
        'வணிக வாகன ஓட்டுநர் & மெக்கானிக்',
        'சில்லறை விற்பனை & கணக்கு மேலாண்மை',
        'உணவு பதப்படுத்துதல் & கேட்டரிங்',
      ],
      Hindi: [
        'सिलाई एवं परिधान निर्माण',
        'वाहन चालन व मरम्मत',
        'दुकान प्रबंधन व बिक्री',
        'खाद्य प्रसंस्करण',
      ],
      Telugu: [
        'టైలరింగ్ & దుస్తుల తయారీ',
        'డ్రైవింగ్ & మెకానిక్',
        'రిటైల్ వ్యాపారం',
      ],
      English: [
        'Apparel Tailoring & Stitching',
        'Commercial Driving & Fleet Maintenance',
        'Retail Sales & Inventory Management',
        'Food Processing & Value Addition',
      ],
    },
  },
  {
    key: 'mobility_constraints',
    dimensionNum: 3,
    label: {
      Tamil: '3. பயண வரம்பு & இடப்பெயர்வு',
      Hindi: '3. गतिशीलता और पारिवारिक सीमाएं',
      Telugu: '3. ప్రయాణ పరిమితులు',
      English: '3. Mobility Constraints & Caregiving',
    },
    question: {
      Tamil: 'வேலை அல்லது பயிற்சிக்காக உங்களால் எவ்வளவு தூரம் பயணிக்க முடியும்? குடும்ப கவனிப்பு பொறுப்புகள் உள்ளதா?',
      Hindi: 'काम या प्रशिक्षण के लिए आप कितनी दूर जा सकते हैं? क्या परिवार की कोई देखभाल संबंधी जिम्मेदारी है?',
      Telugu: 'పని కోసం మీరు ఎంత దూరం ప్రయాణించగలరు? కుటుంబ బాధ్యతలు ఏమైనా ఉన్నాయా?',
      English: 'How far can you travel for work or training, and do you have childcare or eldercare responsibilities?',
    },
    helper: {
      Tamil: 'கிராமத்திற்குள் மட்டுமா அல்லது தாலுகா / மாவட்டம் முழுவதும் பயணிக்க முடியுமா என்பதைக் குறிப்பிடவும்.',
      Hindi: 'गांव तक सीमित या ब्लॉक/जिले तक यात्रा करने में सक्षम?',
      Telugu: 'గ్రామం వరకా లేదా జిల్లా కేంద్రం వరకు వెళ్లగలరా?',
      English: 'Specify physical travel limits (km from habitation) or flexible within district.',
    },
    placeholder: {
      Tamil: 'எ.கா: கிராமத்திற்குள் அல்லது 8 கி.மீ தாலுகா மையம் வரை; குழந்தைகள் பராமரிப்பு உள்ளது...',
      Hindi: 'उदा: गाँव के भीतर या 8 किमी ब्लॉक मुख्यालय तक; बच्चों की देखभाल...',
      Telugu: 'ఉదా: గ్రామం లోపల లేదా 8 కిమీ దూరం వరకు...',
      English: 'e.g. Within 8km from village block; childcare responsibilities at home...',
    },
    suggestions: {
      Tamil: [
        'சொந்த கிராமத்திற்குள்ளேயே தொழில் செய்ய வேண்டும்',
        'அருகிலுள்ள வட்டார மையம் வரை செல்லலாம் (8-10 கி.மீ)',
        'மாவட்டம் முழுவதும் எங்கும் செல்ல தயார்',
      ],
      Hindi: [
        'गाँव के भीतर ही कार्य करना संभव',
        'ब्लॉक केंद्र तक जा सकते हैं (8-10 किमी)',
        'पूरे जिले में कहीं भी जाने को तैयार',
      ],
      Telugu: [
        'గ్రామం లోపలే పని కావాలి',
        'సమీప మండల కేంద్రం వరకు (8-10 కిమీ)',
        'జిల్లా వ్యాప్తంగా ఎక్కడికైనా వెళ్లగలను',
      ],
      English: [
        'Within home village habitation only',
        'Can travel up to block center (8-10 km)',
        'Flexible for employment across district',
      ],
    },
  },
  {
    key: 'educational_background',
    dimensionNum: 4,
    label: {
      Tamil: '4. கல்வித் தகுதி & எழுத்தறிவு',
      Hindi: '4. शैक्षणिक योग्यता और साक्षरता',
      Telugu: '4. విద్యార్హత & అక్షరాస్యత',
      English: '4. Educational Background & Literacy',
    },
    question: {
      Tamil: 'நீங்கள் என்ன வகுப்பு வரை படித்துள்ளீர்கள்? தாய்மொழியில் சரளமாக எழுதப் படிக்க தெரியுமா?',
      Hindi: 'आपकी शिक्षा कहाँ तक हुई है? क्या आप मातृभाषा में पढ़ और लिख सकते हैं?',
      Telugu: 'మీరు ఏ తరగతి వరకు చదువుకున్నారు? చదవడం మరియు రాయడం వచ్చా?',
      English: 'What formal schooling have you completed, and can you read and write fluently in your language?',
    },
    helper: {
      Tamil: 'பள்ளி நிலை (8th, 10th SSLC, 12th) அல்லது தொழிற்கல்வி (ITI / Diploma) குறிப்பிடவும்.',
      Hindi: 'स्कूल स्तर (8वीं, 10वीं, 12वीं) या आईटीआई/डिप्लोमा का उल्लेख करें।',
      Telugu: 'పాఠశాల స్థాయి (8వ, 10వ, 12వ) లేదా ఐటీఐ గురించి తెలపండి.',
      English: 'Record formal schooling, secondary certificates, or technical diplomas.',
    },
    placeholder: {
      Tamil: 'எ.கா: 10-ஆம் வகுப்பு (SSLC) முடித்துள்ளேன், தமிழில் சரளமாக வாசிக்க தெரியும்...',
      Hindi: 'उदा: 10वीं कक्षा उत्तीर्ण, हिंदी में धाराप्रवाह पढ़-लिख सकते हैं...',
      Telugu: 'ఉదా: 10వ తరగతి పాస్, తెలుగు బాగా వచ్చు...',
      English: 'e.g. Class 10 SSLC completed; fluent reading and writing in regional language...',
    },
    suggestions: {
      Tamil: [
        '10-ஆம் வகுப்பு முடித்தவர் (SSLC Pass)',
        '12-ஆம் வகுப்பு முடித்தவர் (HSC Pass)',
        '8-ஆம் வகுப்பு வரை படித்தவர்',
        'ஐடிஐ (ITI) தொழிற்கல்வி முடித்தவர்',
      ],
      Hindi: [
        '10वीं कक्षा उत्तीर्ण (Class 10)',
        '12वीं कक्षा उत्तीर्ण (Class 12)',
        '8वीं कक्षा तक',
        'आईटीआई (ITI Diploma)',
      ],
      Telugu: [
        '10వ తరగతి ఉత్తీర్ణత',
        '12వ తరగతి (ఇంటర్మీడియట్)',
        '8వ తరగతి వరకు',
      ],
      English: [
        'Class 10 completed (SSLC)',
        'Class 12 completed (Higher Secondary)',
        'Up to Class 8',
        'ITI Vocational Certification',
      ],
    },
  },
  {
    key: 'family_occupation',
    dimensionNum: 5,
    label: {
      Tamil: '5. பாரம்பரிய குடும்ப தொழில்',
      Hindi: '5. पारिवारिक व्यवसाय और विरासत',
      Telugu: '5. కుటుంబ సాంప్రదాయ వృత్తి',
      English: '5. Family & Generational Occupation',
    },
    question: {
      Tamil: 'உங்கள் குடும்பத்தில் வழக்கமாக அல்லது பாரம்பரியமாக என்ன தொழில் செய்கிறார்கள்?',
      Hindi: 'आपके परिवार में पारंपरिक या मुख्य रूप से क्या काम किया जाता है?',
      Telugu: 'మీ కుటుంబంలో సాంప్రదాయకంగా ఏ వృత్తిని కొనసాగిస్తున్నారు?',
      English: 'What is your family’s generational trade, craft, artisanal heritage, or agricultural background?',
    },
    helper: {
      Tamil: 'நெசவு, விவசாயம், மண்பாண்டம், வணிகம் அல்லது கைவினைப் பணிகளைக் குறிப்பிடவும்.',
      Hindi: 'बुनाई, कृषि, हस्तशिल्प, धातु कार्य या व्यापार का उल्लेख करें।',
      Telugu: 'చేనేత, వ్యవసాయం, చేతివృత్తులు మొదలైనవి తెలపండి.',
      English: 'Identify generational handloom, pottery, carpentry, agriculture, or trade.',
    },
    placeholder: {
      Tamil: 'எ.கா: பாரம்பரிய கைத்தறி நெசவு குடும்பம்; பெற்றோர் மற்றும் தாத்தா பாட்டி நெசவாளர்கள்...',
      Hindi: 'उदा: पारंपरिक हथकरघा बुनाई परिवार; माता-पिता बुनकर रहे हैं...',
      Telugu: 'ఉదా: సాంప్రదాయ చేనేత కుటుంబం...',
      English: 'e.g. Traditional handloom weaving family; parents and grandparents were artisans...',
    },
    suggestions: {
      Tamil: [
        'பாரம்பரிய கைத்தறி / நெசவுத் தொழில்',
        'விவசாயம் மற்றும் கால்நடை வளர்ப்பு',
        'சில்லறை வணிகம் & கடை வியாபாரம்',
        'பாரம்பரிய கைவினை கலை',
      ],
      Hindi: [
        'पारंपरिक हथकरघा / बुनाई',
        'कृषि एवं पशुपालन',
        'स्थानीय व्यापार एवं दुकान',
        'हस्तशिल्प कला',
      ],
      Telugu: [
        'చేనేత వృత్తి',
        'వ్యవసాయం & పాడి పరిశ్రమ',
        'వ్యాపార రంగం',
      ],
      English: [
        'Traditional Handloom Weaving',
        'Agriculture & Livestock Farming',
        'Local Retail Trade & Merchant',
        'Artisanal Crafts & Pottery',
      ],
    },
  },
  {
    key: 'employment_preference',
    dimensionNum: 6,
    isPreference: true,
    label: {
      Tamil: '6. வேலை விருப்ப முறை',
      Hindi: '6. रोजगार प्राथमिकता',
      Telugu: '6. ఉపాధి ప్రాధాన్యత',
      English: '6. Preferred Mode of Work',
    },
    question: {
      Tamil: 'உங்களுக்கு சொந்தமாக சுயதொழில் தொடங்க விருப்பமா? அல்லது மாத சம்பளத்தில் வேலை செய்ய விருப்பமா?',
      Hindi: 'क्या आप अपना स्वयं का व्यवसाय शुरू करना चाहते हैं या नियमित वेतन वाली नौकरी करना चाहते हैं?',
      Telugu: 'మీరు స్వయం ఉపాధి ప్రారంభించాలనుకుంటున్నారా లేదా నెలవారీ జీతం ఉద్యోగం చేయాలనుకుంటున్నారా?',
      English: 'Do you prefer self-employment (setting up micro-enterprise) or salaried wage employment?',
    },
    helper: {
      Tamil: 'சுயதொழில், ஊதிய வேலை அல்லது இரண்டிற்கும் விருப்பம் உள்ளதா என்பதை தேர்வு செய்யவும்.',
      Hindi: 'स्वरोजगार, वेतन वाली नौकरी या दोनों के लिए खुला विकल्प चुनें।',
      Telugu: 'స్వయం ఉపాధి లేదా వేతన ఉద్యోగాన్ని ఎంచుకోండి.',
      English: 'Select self-employment, structured wage job, or either.',
    },
    placeholder: {
      Tamil: '',
      Hindi: '',
      Telugu: '',
      English: '',
    },
    suggestions: {
      Tamil: [],
      Hindi: [],
      Telugu: [],
      English: [],
    },
  },
  {
    key: 'local_economic_context',
    dimensionNum: 7,
    label: {
      Tamil: '7. உள்ளூர் பொருளாதார சூழல்',
      Hindi: '7. स्थानीय आर्थिक परिवेश',
      Telugu: '7. స్థానిక ఆర్థిక వాతావరణం',
      English: '7. Local Village Economic Context',
    },
    question: {
      Tamil: 'உங்கள் கிராமத்தில் அல்லது அருகில் உள்ள சந்தை வசதிகள், தொழில் தொகுப்புகள் அல்லது மகளிர் குழுக்கள் பற்றி கூறுங்கள்.',
      Hindi: 'आपके गाँव या आसपास के बाज़ार, औद्योगिक क्लस्टर या स्वयं सहायता समूहों की क्या स्थिति है?',
      Telugu: 'మీ గ్రామంలో లేదా సమీపంలో ఉన్న మార్కెట్లు, ఎంఎస్ఎంఈ క్లస్టర్లు లేదా స్వయం సహాయక సంఘాల గురించి తెలపండి.',
      English: 'What local markets, weekly shandies, MSME clusters, or active SHG groups exist in your area?',
    },
    helper: {
      Tamil: 'ஜவுளி ஆலைகள், கோழிப்பண்ணை, வாரச்சந்தை, சுயஉதவிக் குழுக்கள் போன்ற சூழல்.',
      Hindi: 'साप्ताहिक हाट, कपड़ा क्लस्टर, कृषि मंडी या महिला स्वयं सहायता समूह।',
      Telugu: 'వారపు సంత, పరిశ్రమలు లేదా స్వయం సహాయక సంఘాలు.',
      English: 'Availability of weekly markets, manufacturing units, or SHG federations.',
    },
    placeholder: {
      Tamil: 'எ.கா: கிராமத்தில் திங்கட்கிழமை வாரச்சந்தை; அருகில் ஜவுளி மற்றும் கோழிப்பண்ணை தொழிற்சாலைகள் உள்ளன...',
      Hindi: 'उदा: गाँव में साप्ताहिक बाज़ार; निकटवर्ती कपड़ा क्लस्टर और सक्रिय स्वयं सहायता समूह...',
      Telugu: 'ఉదా: సమీపంలో టెక్స్‌టైల్ పరిశ్రమలు, వారపు సంత...',
      English: 'e.g. Nearby textile and poultry MSME cluster; weekly Monday market in village...',
    },
    suggestions: {
      Tamil: [
        'அருகில் ஜவுளி & கோழிப்பண்ணை MSME தொகுப்பு',
        'கிராம வாரச்சந்தை மற்றும் உள்ளூர் வணிக மையம்',
        'செயலில் உள்ள மகளிர் சுயஉதவி குழு (SHG)',
      ],
      Hindi: [
        'निकटवर्ती कपड़ा एवं एमएसएमई क्लस्टर',
        'गाँव का साप्ताहिक बाज़ार व व्यापार केंद्र',
        'सक्रिय महिला स्वयं सहायता समूह (SHG)',
      ],
      Telugu: [
        'సమీప టెక్స్‌టైల్ ఎంఎస్ఎంఈ క్లస్టర్',
        'గ్రామ వారపు సంత & వాణిజ్య కేంద్రం',
      ],
      English: [
        'Nearby Textile & Poultry MSME Cluster',
        'Weekly Monday Village Market & CSC Hub',
        'Active Women Self-Help Group (SHG) Federation',
      ],
    },
  },
];

export function StepMandatedFields({
  fields,
  onChange,
  onBack,
  onNext,
  language = 'Tamil',
}: Props) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'stepper' | 'all'>('stepper');

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeLang = language in QUESTIONS[0].label ? language : 'Tamil';
  const langCode =
    activeLang === 'Hindi'
      ? 'hi-IN'
      : activeLang === 'Telugu'
      ? 'te-IN'
      : activeLang === 'English'
      ? 'en-IN'
      : 'ta-IN';

  const currentQ = QUESTIONS[currentQIndex];

  const setField = <K extends keyof MandatedFieldsData>(key: K, value: MandatedFieldsData[K]) => {
    onChange({ ...fields, [key]: value });
  };

  const stopVoice = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (_) {}
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    setIsSpeaking(false);
  }, []);

  const speakQuestion = useCallback(
    async (questionText: string) => {
      if (typeof window === 'undefined') return;
      if (isAudioMuted) return;

      stopVoice();

      // Attempt 1: Call high-fidelity Edge Neural TTS backend via Next.js proxy
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: questionText,
            language: activeLang,
          }),
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.audio_base64) {
            const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
            activeAudioRef.current = audio;

            audio.onplay = () => setIsSpeaking(true);
            audio.onended = () => {
              setIsSpeaking(false);
              activeAudioRef.current = null;
            };
            audio.onerror = () => {
              setIsSpeaking(false);
              activeAudioRef.current = null;
            };

            try {
              await audio.play();
            } catch (playErr) {
              console.warn('Audio playback prevented by autoplay policy:', playErr);
              setIsSpeaking(false);
            }
            return;
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.warn('Neural TTS request failed, falling back to browser synthesis:', err);
      }

      // Attempt 2: Fallback to browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(questionText);
          utterance.lang = langCode;
          utterance.rate = 0.95;
          utterance.pitch = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const matched = voices.find(
            (v) => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2))
          );
          if (matched) utterance.voice = matched;

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis notice:', err);
          setIsSpeaking(false);
        }
      }
    },
    [isAudioMuted, activeLang, langCode, stopVoice]
  );

  useEffect(() => {
    if (viewMode === 'stepper') {
      const qText = currentQ.question[activeLang] || currentQ.question.Tamil;
      speakQuestion(qText);
    }
    return () => {
      stopVoice();
    };
  }, [currentQIndex, viewMode, activeLang, speakQuestion]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langCode;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const cleaned = currentTranscript.trim();
          if (cleaned) {
            setField(currentQ.key, cleaned as any);
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
    };
  }, [langCode, currentQ.key]);

  const toggleListening = () => {
    stopVoice();

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
    } else {
      setIsListening(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = langCode;
          recognitionRef.current.start();
        } catch (_) {}
      }
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleNext = () => {
    stopVoice();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      onNext();
    }
  };

  const handlePrev = () => {
    stopVoice();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  const currentAnswer = (fields[currentQ.key] as string) || '';

  return (
    <Card className="bg-white border-2 border-[#BACEEB] shadow-sm overflow-hidden">
      <CardHeader className="bg-[#EDF3FC] border-b border-[#BACEEB] py-3.5 px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B3064] text-white flex items-center justify-center shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-[#0B3064]">
                  Step 2: 7 PM-AJAY Mandated Profile Dimensions
                </h2>
                <span className="text-[10px] font-bold bg-white text-[#0B3064] border border-[#BACEEB] px-2 py-0.5 rounded-md">
                  {activeLang}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Voice-guided intake with live speech transcription into each dimension
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopVoice();
                setViewMode(viewMode === 'stepper' ? 'all' : 'stepper');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs cursor-pointer"
              title="Toggle between one-by-one voice stepper and all fields list view"
            >
              {viewMode === 'stepper' ? (
                <>
                  <LayoutList className="w-3.5 h-3.5 text-[#0B3064]" />
                  <span>View All 7 Fields</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-3.5 h-3.5 text-[#0B3064]" />
                  <span>Voice Stepper View</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (isSpeaking) stopVoice();
                setIsAudioMuted(!isAudioMuted);
              }}
              className={cn(
                'p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors',
                isAudioMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
              title={isAudioMuted ? 'Unmute voice recitation' : 'Mute voice recitation'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#0A783C]" />}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {viewMode === 'stepper' ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#0B3064] tracking-tight">
                  Question {currentQIndex + 1} of 7: {currentQ.label[activeLang] || currentQ.label.Tamil}
                </span>
                <span className="text-[11px] font-bold text-slate-600">
                  {Math.round(((currentQIndex + 1) / 7) * 100)}% Completed
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0B3064] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentQIndex + 1) / 7) * 100}%` }}
                />
              </div>
            </div>

            <div className={cn(
              'p-4 rounded-xl border-2 transition-all space-y-2',
              isSpeaking
                ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300/30 shadow-xs'
                : 'bg-[#F8FAFC] border-slate-200'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0B3064]">
                    AI Voice Question ({activeLang}):
                  </span>
                  {isSpeaking && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A783C]">
                      <span className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 h-2 bg-[#0A783C] animate-bounce" />
                        <span className="w-0.5 h-3 bg-[#0A783C] animate-bounce delay-75" />
                        <span className="w-0.5 h-1.5 bg-[#0A783C] animate-bounce delay-150" />
                      </span>
                      Reciting Aloud...
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => speakQuestion(currentQ.question[activeLang] || currentQ.question.Tamil)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-[#0B3064] shadow-2xs transition-colors cursor-pointer"
                  title="Re-play audio question"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Re-read Voice</span>
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                &ldquo;{currentQ.question[activeLang] || currentQ.question.Tamil}&rdquo;
              </h3>

              <p className="text-xs text-slate-500 font-medium">
                {currentQ.helper[activeLang] || currentQ.helper.Tamil}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <label htmlFor={`question-input-${currentQ.key}`}>
                  Your Response / உங்கள் பதில்:
                </label>
                {isListening && (
                  <span className="flex items-center gap-1 text-rose-600 font-bold text-[11px] animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    Listening & Transcribing in {activeLang}...
                  </span>
                )}
              </div>

              {currentQ.isPreference ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'self', label: 'Self-Employment (சுயதொழில்)' },
                    { id: 'wage', label: 'Wage Employment (மாத சம்பளம்)' },
                    { id: 'either', label: 'Either / Both (இரண்டும்)' },
                  ].map((opt) => {
                    const isSelected = fields.employment_preference === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setField('employment_preference', opt.id as any)}
                        className={`p-3.5 rounded-xl border-2 text-left font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B3064] text-white border-[#0B3064] shadow-sm ring-2 ring-blue-300'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-[#0B3064] hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="relative rounded-xl border-2 border-slate-300 focus-within:border-[#0B3064] focus-within:ring-2 focus-within:ring-blue-200 transition-all bg-white shadow-2xs">
                  <textarea
                    ref={inputRef}
                    id={`question-input-${currentQ.key}`}
                    rows={3}
                    value={currentAnswer}
                    onChange={(e) => setField(currentQ.key, e.target.value as any)}
                    placeholder={
                      isListening
                        ? 'Listening to your voice... Spoken words will appear here in real-time...'
                        : currentQ.placeholder[activeLang] || currentQ.placeholder.Tamil
                    }
                    className="w-full p-3.5 pr-28 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none resize-none leading-relaxed"
                  />

                  <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer',
                        isListening
                          ? 'bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse'
                          : 'bg-[#0A783C] hover:bg-[#086332] text-white active:scale-95'
                      )}
                      title={isListening ? 'Stop Speaking' : 'Speak to Transcribe into Textbox'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isListening ? 'Stop' : 'Speak'}</span>
                    </button>
                  </div>
                </div>
              )}

              {currentQ.suggestions[activeLang]?.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Quick Suggestions (Click to Fill):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentQ.suggestions[activeLang].map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const existing = currentAnswer ? `${currentAnswer}, ${sug}` : sug;
                          setField(currentQ.key, existing as any);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#EDF3FC] text-slate-800 hover:text-[#0B3064] border border-slate-200 hover:border-[#BACEEB] transition-all font-medium cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
                      >
                        <Sparkles className="w-3 h-3 text-[#E65100]" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {QUESTIONS.map((q) => (
              <div key={q.key} className="space-y-1.5 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                <label className="text-xs text-slate-900 font-bold uppercase tracking-wider block">
                  {q.label[activeLang] || q.label.Tamil}
                </label>
                <p className="text-xs text-slate-500">{q.question[activeLang] || q.question.Tamil}</p>
                {q.isPreference ? (
                  <select
                    value={fields.employment_preference}
                    onChange={(e) => setField('employment_preference', e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                  >
                    <option value="self">Self-Employment (சுயதொழில்)</option>
                    <option value="wage">Wage Employment (மாத சம்பளம்)</option>
                    <option value="either">Either / Both (இரண்டும்)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={(fields[q.key] as string) || ''}
                    onChange={(e) => setField(q.key, e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
                    placeholder={q.placeholder[activeLang] || q.placeholder.Tamil}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-slate-50 border-t border-[#BACEEB] py-3.5 px-4 sm:px-6 flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePrev}
          className="border-slate-300 text-slate-700 hover:bg-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>{currentQIndex === 0 ? 'Back to Step 1' : 'Previous Question'}</span>
        </Button>

        <div className="flex items-center gap-2">
          {viewMode === 'all' ? (
            <Button
              type="button"
              onClick={onNext}
              className="bg-[#0B3064] hover:bg-[#144282] text-white font-extrabold text-xs px-5 shadow-sm"
            >
              <span>Continue to DPDP Consent</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#0B3064] hover:bg-[#144282] text-white font-extrabold text-xs px-5 shadow-sm flex items-center gap-1.5"
            >
              <span>
                {currentQIndex < QUESTIONS.length - 1
                  ? 'Next Question ➔'
                  : 'Complete & Continue to Consent'}
              </span>
              {currentQIndex === QUESTIONS.length - 1 && <CheckCircle2 className="w-4 h-4 text-emerald-300 ml-1" />}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
