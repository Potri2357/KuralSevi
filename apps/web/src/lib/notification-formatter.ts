// =============================================================================
// Kural Sevi — Omnichannel Citizen Notification Formatter
// Builds bilingual, zero-emoji WhatsApp & SMS receipts using real intake session data.
// =============================================================================

export interface NotificationFields {
  educational_background?: string;
  family_occupation?: string;
  current_livelihood?: string;
  skills_and_interests?: string;
  mobility_constraints?: string;
  employment_preference?: string;
  local_economic_context?: string;
  [key: string]: string | undefined;
}

export interface NotificationCourse {
  qp_code: string;
  qp_name: string;
  ta_name?: string;
  hi_name?: string;
  te_name?: string;
  ml_name?: string;
  nsqf_level?: number;
  duration_hours?: number;
  duration?: string;
  sector?: string;
  [key: string]: any;
}

const FIELD_LABELS: Record<string, Record<string, string>> = {
  ta: {
    title: 'PM-AJAY அரசு நலத்திட்ட பதிவு ரசீது',
    beneficiary: 'விண்ணப்பதாரர்',
    case_id: 'விண்ணப்ப எண் (Case ID)',
    fields_header: 'பதிவு செய்யப்பட்ட விவரங்கள் (Tamil Summary):',
    educational_background: 'கல்வித் தகுதி',
    family_occupation: 'குடும்பத் தொழில்',
    current_livelihood: 'தற்போதைய வேலை',
    skills_and_interests: 'தொழில் ஆர்வம் & திறன்',
    mobility_constraints: 'வேலை பயண வரம்பு',
    employment_preference: 'வேலை விருப்பம்',
    local_economic_context: 'உள்ளூர் வர்த்தக சூழல்',
    courses_header: 'பரிந்துரைக்கப்பட்ட PM-AJAY பயிற்சிகள்:',
    choice_prompt: 'உங்களுக்கு விருப்பமான பயிற்சியைத் தேர்ந்தெடுக்க 1, 2, அல்லது 3 என பதிலளிக்கவும். (அல்லது உறுதிப்படுத்த \'YES\' என பதிலளிக்கவும்).',
    cta: 'இவ்விவரங்கள் சரியென்றால் \'YES\' அல்லது உங்கள் பயிற்சி எண் (1, 2, 3) என பதிலளிக்கவும்.',
  },
  hi: {
    title: 'PM-AJAY कल्याणकारी योजना आवेदन रसीद',
    beneficiary: 'लाभार्थी',
    case_id: 'आवेदन संख्या (Case ID)',
    fields_header: 'दर्ज किया गया विवरण (Hindi Summary):',
    educational_background: 'शैक्षिक योग्यता',
    family_occupation: 'पारिवारिक व्यवसाय',
    current_livelihood: 'वर्तमान कार्य',
    skills_and_interests: 'कौशल और रुचि',
    mobility_constraints: 'कार्य क्षेत्र सीमा',
    employment_preference: 'रोज़गार प्राथमिकता',
    local_economic_context: 'स्थानीय बाजार',
    courses_header: 'आपके लिए अनुशंसित कौशल कोर्स:',
    choice_prompt: 'अपना पसंदीदा कोर्स चुनने के लिए 1, 2, या 3 लिखकर भेजें (या पुष्टि के लिए \'YES\' लिखें)।',
    cta: 'यदि यह विवरण सही है तो \'YES\' या कोर्स नंबर (1, 2, 3) लिखकर भेजें।',
  },
  te: {
    title: 'PM-AJAY సంక్షేమ పథకం దరఖాస్తు రశీదు',
    beneficiary: 'లబ్ధిదారుడు',
    case_id: 'దరఖాస్తు సంఖ్య (Case ID)',
    fields_header: 'నమోదు చేయబడిన వివరాలు (Telugu Summary):',
    educational_background: 'చదువు',
    family_occupation: 'కుటుంబ వృత్తి',
    current_livelihood: 'ప్రస్తుత పని',
    skills_and_interests: 'నైపుణ్యం & ఆసక్తి',
    mobility_constraints: 'ప్రయాణ పరిధి',
    employment_preference: 'ఉపాధి ప్రాధాన్యత',
    local_economic_context: 'స్థానిక మార్కెట్',
    courses_header: 'మీ కోసం సిఫార్సు చేయబడిన కోర్సులు:',
    choice_prompt: 'మీకు నచ్చిన కోర్సును ఎంచుకోవడానికి 1, 2 లేదా 3 అని రిప్లై ఇవ్వండి (లేదా నిర్ధారించడానికి \'YES\' అని పంపండి).',
    cta: 'ఈ వివరాలు సరైనవయితే \'YES\' లేదా కోర్సు నంబర్ (1, 2, 3) అని రిప్లై ఇవ్వండి.',
  },
  en: {
    title: 'PM-AJAY Welfare Scheme Application Receipt',
    beneficiary: 'Beneficiary',
    case_id: 'Case ID',
    fields_header: 'Recorded Intake Profile (Administrative Record):',
    educational_background: 'Education Level',
    family_occupation: 'Family Occupation',
    current_livelihood: 'Current Livelihood',
    skills_and_interests: 'Skills & Trade Interests',
    mobility_constraints: 'Mobility / Work Radius',
    employment_preference: 'Employment Preference',
    local_economic_context: 'Local Economic Context',
    courses_header: 'Recommended Vocational Courses:',
    choice_prompt: 'Reply with 1, 2, or 3 to choose your preferred course, or reply YES to confirm.',
    cta: 'Reply with 1, 2, 3 or YES to confirm your application.',
  },
};

const ENGLISH_FIELD_LABELS: Record<string, string> = {
  educational_background: 'Education Level',
  family_occupation: 'Family Occupation',
  current_livelihood: 'Current Livelihood',
  skills_and_interests: 'Skills & Interests',
  mobility_constraints: 'Mobility / Work Radius',
  employment_preference: 'Employment Preference',
  local_economic_context: 'Local Economic Context',
};

export function translateValueToVernacular(englishVal: string, lang: string): string {
  if (!englishVal || ['known value', 'recorded', 'none', 'n/a'].includes(englishVal.trim().toLowerCase())) {
    const defaultRecorded: Record<string, string> = {
      ta: 'பதிவு செய்யப்பட்டது',
      ml: 'രേഖപ്പെടുത്തി',
      hi: 'दर्ज किया गया',
      te: 'నమోదు చేయబడింది',
      en: 'Recorded',
    };
    return defaultRecorded[lang] || 'Recorded';
  }

  const v = englishVal.toLowerCase();

  // Trades & Skills
  if (v.includes('tailor') || v.includes('stitch') || v.includes('garment') || v.includes('sewing')) {
    return {
      ta: 'தையல் மற்றும் ஆடை வடிவமைப்பு',
      ml: 'ടെയ്‌ലറിംഗ് / വസ്ത്ര നിർമ്മാണം',
      hi: 'सिलाई एवं वस्त्र निर्माण',
      te: 'టైలరింగ్ / దుస్తుల తయారీ',
      en: 'Tailoring & Garment Construction',
    }[lang] || englishVal;
  }
  if (v.includes('mechanic') || v.includes('auto') || v.includes('two-wheeler') || v.includes('bike')) {
    return {
      ta: 'டூவீலர் மெக்கானிக் / பைக் பழுதுநீக்கம்',
      ml: 'ടൂവീലർ മെക്കാനിക്ക്',
      hi: 'दोपहिया वाहन मैकेनिक',
      te: 'టూవీలర్ మెకానిక్',
      en: 'Two-Wheeler Service Technician',
    }[lang] || englishVal;
  }
  if (v.includes('leather') || v.includes('shoe') || v.includes('footwear') || v.includes('chappal')) {
    return {
      ta: 'தோல் மற்றும் காலணி தயாரிப்பு',
      ml: 'ലെതർ, പാദരക്ഷാ നിർമ്മാണം',
      hi: 'चमड़ा एवं जूता निर्माण',
      te: 'లెదర్ మరియు పాదరక్షల తయారీ',
      en: 'Footwear & Leather Goods',
    }[lang] || englishVal;
  }
  if (v.includes('poultry') || v.includes('chicken') || v.includes('broiler')) {
    return {
      ta: 'கோழிப்பண்ணை மற்றும் இறைச்சி விற்பனை',
      ml: 'കോഴി വളർത്തൽ',
      hi: 'मुर्गी पालन व्यवसाय',
      te: 'కోళ్ల పెంపకం',
      en: 'Poultry Farming & Retail',
    }[lang] || englishVal;
  }
  if (v.includes('dairy') || v.includes('milk') || v.includes('cattle') || v.includes('livestock')) {
    return {
      ta: 'கால்நடை வளர்ப்பு & பால் பண்ணை',
      ml: 'ക്ഷീരകർഷകൻ',
      hi: 'डेयरी फार्मिंग एवं पशुपालन',
      te: 'పాడి పరిశ్రమ మరియు పశుపోషణ',
      en: 'Dairy Farming & Livestock',
    }[lang] || englishVal;
  }
  if (v.includes('beauty') || v.includes('salon') || v.includes('parlour') || v.includes('hair')) {
    return {
      ta: 'அழகுக்கலை & சலூன் பயிற்சி',
      ml: 'ബ്യൂട്ടി പാർലർ & സലൂൺ',
      hi: 'ब्यूटी पार्लर एवं सैलून',
      te: 'బ్యూటీ పార్లర్ మరియు సెలూన్',
      en: 'Beauty & Wellness Specialist',
    }[lang] || englishVal;
  }
  if (v.includes('electric') || v.includes('appliance') || v.includes('wiring')) {
    return {
      ta: 'வீட்டு மின்சாதனங்கள் பழுதுநீக்கம்',
      ml: 'ഇലക്ട്രിക്കൽ വയറിംഗ് & റിപ്പയർ',
      hi: 'घरेलू बिजली उपकरण मरम्मत',
      te: 'ఎలక్ట్రికల్ గృహోపకరణాల మరమ్మతులు',
      en: 'Home Appliance Repair & Electrical',
    }[lang] || englishVal;
  }
  if (v.includes('catering') || v.includes('food') || v.includes('cooking') || v.includes('pickle')) {
    return {
      ta: 'உணவு தயாரிப்பு, கேட்டரிங் & ஊறுகாய்',
      ml: 'ഭക്ഷണ നിർമ്മാണവും കാറ്ററിംഗും',
      hi: 'खाद्य प्रसंस्करण एवं कैटरिंग',
      te: 'ఫుడ్ కేటరింగ్ మరియు తయారీ',
      en: 'Food Processing & Catering',
    }[lang] || englishVal;
  }
  if (v.includes('agriculture') || v.includes('farming') || v.includes('crop')) {
    return {
      ta: 'விவசாயம் / வேளாண்மை',
      ml: 'കൃഷി',
      hi: 'कृषि / खेती',
      te: 'వ్యవసాయం',
      en: 'Agriculture / Cultivation',
    }[lang] || englishVal;
  }
  if (v.includes('daily wage') || v.includes('coolie') || v.includes('labour')) {
    return {
      ta: 'தினக்கூலி வேலை',
      ml: 'ദിവസവേതന ജോലി',
      hi: 'दैनिक मजदूरी',
      te: 'దినసరి కూలీ',
      en: 'Daily Wage Labor',
    }[lang] || englishVal;
  }
  if (v.includes('driver') || v.includes('driving')) {
    return {
      ta: 'ஓட்டுநர் (டிரைவர்)',
      ml: 'ഡ്രൈവിംഗ്',
      hi: 'ड्राइविंग / वाहन चालक',
      te: 'డ్రైవింగ్',
      en: 'Commercial Driver',
    }[lang] || englishVal;
  }
  if (v.includes('grocery') || v.includes('kirana') || v.includes('retail') || v.includes('shopkeeper')) {
    return {
      ta: 'மளிகை மற்றும் சில்லறை விற்பனை கடை',
      ml: 'പലചരക്ക് കട',
      hi: 'किराना एवं खुदरा दुकान',
      te: 'కిరాణా మరియు రిటైల్ దుకాణం',
      en: 'Kirana & Retail Shop',
    }[lang] || englishVal;
  }

  // Education
  if (v.includes('12th') || v.includes('class 12') || v.includes('higher secondary')) {
    return {
      ta: '12-ஆம் வகுப்பு முடித்தது',
      ml: 'പന്ത്രണ്ടാം ക്ലാസ്',
      hi: '12वीं कक्षा उत्तीर्ण',
      te: '12వ తరగతి ఉత్తీర్ణత',
      en: 'Higher Secondary (12th Std)',
    }[lang] || englishVal;
  }
  if (v.includes('10th') || v.includes('class 10') || v.includes('sslc') || v.includes('secondary')) {
    return {
      ta: '10-ஆம் வகுப்பு முடித்தது',
      ml: 'പത്താം ക്ലാസ്',
      hi: '10वीं कक्षा उत्तीर्ण',
      te: '10వ తరగతి ఉత్తీర్ణత',
      en: 'Secondary (10th Std)',
    }[lang] || englishVal;
  }
  if (v.includes('graduate') || v.includes('degree') || v.includes('college')) {
    return {
      ta: 'பட்டப்படிப்பு / கல்லூரி',
      ml: 'ബിരുദം',
      hi: 'स्नातक / कॉलेज',
      te: 'డిగ్రీ / గ్రాడ్యుయేట్',
      en: 'Graduate / Degree',
    }[lang] || englishVal;
  }
  if (v.includes('8th') || v.includes('middle')) {
    return {
      ta: '8-ஆம் வகுப்பு வரை',
      ml: 'എട്ടാം ക്ലാസ്',
      hi: '8वीं कक्षा तक',
      te: '8వ తరగతి వరకు',
      en: 'Middle School (8th Std)',
    }[lang] || englishVal;
  }
  if (v.includes('5th') || v.includes('primary')) {
    return {
      ta: 'தொடக்கக் கல்வி (5-ஆம் வகுப்பு வரை)',
      ml: 'പ്രൈമറി വിദ്യാഭ്യാസം',
      hi: 'प्राथमिक शिक्षा (5वीं तक)',
      te: 'ప్రాథమిక విద్య',
      en: 'Primary Education (5th Std)',
    }[lang] || englishVal;
  }
  if (v.includes('no formal') || v.includes('literate') || v.includes('illiterate')) {
    return {
      ta: 'பள்ளிக்கல்வி இல்லை / எழுத்தறிவு',
      ml: 'സ്കൂൾ വിദ്യാഭ്യാസമില്ല',
      hi: 'साक्षर / अनौपचारिक',
      te: 'అక్షరాస్యుడు / బడికి వెళ్లలేదు',
      en: 'No Formal Schooling / Literate',
    }[lang] || englishVal;
  }

  // Mobility
  if (v.includes('local only') || v.includes('cannot travel') || v.includes('within village') || v.includes('local area')) {
    return {
      ta: 'உள்ளூர் / சொந்த ஊருக்குள் மட்டுமே',
      ml: 'സ്വന്തം നാട്ടിൽ മാത്രം',
      hi: 'केवल स्थानीय क्षेत्र / गांव में',
      te: 'సొంత ఊర్లో మాత్రమే',
      en: 'Local Only (Within Village/Town)',
    }[lang] || englishVal;
  }
  if (v.includes('nearby town') || v.includes('nearby') || v.includes('travel') || v.includes('district')) {
    return {
      ta: 'அருகிலுள்ள நகரங்களுக்குச் செல்லலாம்',
      ml: 'അടുത്തുള്ള പട്ടണങ്ങളിൽ പോകാം',
      hi: 'आस-पास के शहरों तक जा सकते हैं',
      te: 'సమీప పట్టణాల వరకు వెళ్లగలరు',
      en: 'Nearby Towns / District Center',
    }[lang] || englishVal;
  }
  if (v.includes('no constraint') || v.includes('anywhere')) {
    return {
      ta: 'எங்கு வேண்டுமானாலும் பயணம் செய்யலாம்',
      ml: 'യാത്രാ തടസ്സങ്ങളില്ല',
      hi: 'कहीं भी यात्रा कर सकते हैं',
      te: 'ఎక్కడికైనా ప్రయాణించవచ్చు',
      en: 'Willing to Relocate / Anywhere',
    }[lang] || englishVal;
  }

  // Employment Preference
  if (v.includes('self-employment') || v.includes('own shop') || v.includes('business') || v.includes('enterprise')) {
    return {
      ta: 'சுயதொழில் (சொந்த கடை / தொழில் நிறுவனம்)',
      ml: 'സ്വയംതൊഴിൽ (സ്വന്തം സംരംഭം)',
      hi: 'स्वरोज़गार (खुद की दुकान / व्यवसाय)',
      te: 'స్వయం ఉపాధి (సొంత వ్యాపారం / దుకాణం)',
      en: 'Self-Employment / Micro-Enterprise',
    }[lang] || englishVal;
  }
  if (v.includes('wage') || v.includes('salary') || v.includes('job') || v.includes('monthly')) {
    return {
      ta: 'மாத ஊதிய வேலை (நிறுவன பணி)',
      ml: 'മാസ ശമ്പളമുള്ള ജോലി',
      hi: 'मासिक वेतन वाली नौकरी',
      te: 'నెల జీతం ఉద్యోగం',
      en: 'Wage Employment (Salaried Job)',
    }[lang] || englishVal;
  }

  // Local Economic Context
  if (v.includes('market') || v.includes('bazaar') || v.includes('commerce') || v.includes('santhai')) {
    return {
      ta: 'வாரச்சந்தை மற்றும் கிராம வணிகக் கடைகள்',
      ml: 'പ്രദേശിക ചന്ത & വ്യാപാരം',
      hi: 'साप्ताहिक ग्रामीण हाट एवं बाजार',
      te: 'వారపు సంత మరియు స్థానిక వ్యాపారం',
      en: 'Rural Weekly Market & Commercial Hub',
    }[lang] || englishVal;
  }
  if (v.includes('mill') || v.includes('factory') || v.includes('industrial')) {
    return {
      ta: 'அருகிலுள்ள ஆலைகள் / தொழிற்சாலை சூழல்',
      ml: 'ഫാക്ടറി / വ്യവസായ മേഖല',
      hi: 'आस-पास के कारखाने / मिल',
      te: 'సమీప మిల్లులు / కర్మాగారాలు',
      en: 'Industrial Clusters & Mills',
    }[lang] || englishVal;
  }

  return englishVal;
}

export function buildRealDataWhatsAppMessage(options: {
  phone: string;
  language: string;
  caseId: string;
  beneficiaryName?: string;
  confirmedFields?: NotificationFields;
  recommendedCourses?: NotificationCourse[];
  selectedCourse?: string;
  customNote?: string;
  isConfirmedStatus?: boolean;
}): string {
  const {
    phone,
    language,
    caseId,
    beneficiaryName = 'Beneficiary',
    confirmedFields = {},
    recommendedCourses = [],
    selectedCourse,
    customNote,
    isConfirmedStatus = false,
  } = options;

  const lang = FIELD_LABELS[language] ? language : 'ta';
  const labels = FIELD_LABELS[lang];

  const hasRealFields = Object.entries(confirmedFields).some(
    ([_, val]) => val && !['none', 'n/a'].includes(String(val).toLowerCase().trim())
  );

  // If no fields recorded yet, provide a respectful intake invitation
  if (!hasRealFields && (!recommendedCourses || recommendedCourses.length === 0) && !selectedCourse) {
    if (lang === 'ta') {
      return [
        `*${labels.title}*`,
        '--------------------------------------------------',
        `விண்ணப்ப எண் (Case ID): ${caseId}`,
        `விண்ணப்பதாரர்: ${beneficiaryName}`,
        `தொலைபேசி: ${phone}`,
        '',
        'வணக்கம்! தமிழ்நாடு அரசு PM-AJAY திட்டத்தின் கீழ் இலவச தொழில் திறன் பயிற்சி பாடநெறிகள், மாதாந்திர உதவித்தொகை (ரூ. 1,500/மாதம்) மற்றும் வாழ்வாதார மானியங்களைப் பெற உங்களை வரவேற்கிறோம்.',
        '',
        'பதிவை தொடங்க:',
        '1. உங்கள் கல்வி தகுதி, தற்போதைய வேலை மற்றும் விருப்பமான தொழில் பயிற்சி பற்றி ஒரு குரல் பதிவு (Voice Note) அல்லது செய்தியை உடனே இங்கு அனுப்பவும்.',
        '2. அல்லது "START" அல்லது "சரி" என்று உடனே பதில் அனுப்பவும்.',
        customNote ? `\nகுறிப்பு: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - தமிழ்நாடு அரசு PM-AJAY தொலைபேசி மற்றும் வாட்ஸ்அப் பதிவு சேவை_',
      ]
        .filter(Boolean)
        .join('\n');
    }
    if (lang === 'hi') {
      return [
        `*${labels.title}*`,
        '--------------------------------------------------',
        `आवेदन संख्या (Case ID): ${caseId}`,
        `लाभार्थी: ${beneficiaryName}`,
        `फोन: ${phone}`,
        '',
        'नमस्ते! पीएम-अजय योजना के तहत मुफ़्त कौशल प्रशिक्षण, मासिक वजीफा (रु. 1,500/माह) और आजीविका सहायता हेतु आपका स्वागत है।',
        '',
        'पंजीकरण शुरू करने के लिए:',
        '1. अपनी शिक्षा, वर्तमान कार्य और पसंदीदा कौशल पाठ्यक्रम के बारे में वॉइस नोट या संदेश भेजें।',
        '2. या तुरंत "START" या "हाँ" लिखकर उत्तर दें।',
        customNote ? `\nनोट: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - पीएम-अजय टेलीफोनी एवं व्हाट्सएप पंजीकरण सेवा_',
      ]
        .filter(Boolean)
        .join('\n');
    }
    if (lang === 'te') {
      return [
        `*${labels.title}*`,
        '--------------------------------------------------',
        `దరఖాస్తు సంఖ్య (Case ID): ${caseId}`,
        `లబ్ధిదారు: ${beneficiaryName}`,
        `ఫోన్: ${phone}`,
        '',
        'నమస్కారం! ప్రభుత్వ PM-AJAY పథకం కింద ఉచిత వృత్తి నైపుణ్య కోర్సులు మరియు నెలవారీ స్టైపెండ్ కొరకు ఆహ్వానిస్తున్నాము.',
        '',
        'నమోదు ప్రారంభించడానికి:',
        '1. మీ విద్యార్హత, ప్రస్తుత పని మరియు ఆసక్తి ఉన్న వృత్తి కోర్సు గురించి వాయిస్ నోట్ లేదా సందేశం పంపండి.',
        '2. లేదా వెంటనే "START" అని రిప్లై ఇవ్వండి.',
        customNote ? `\nగమనిక: ${customNote}` : '',
        '--------------------------------------------------',
        '_Kural Sevi - PM-AJAY టెలిఫోనీ & వాట్సాప్ నమోదు వేదిక_',
      ]
        .filter(Boolean)
        .join('\n');
    }
    return [
      `*${labels.title}*`,
      '--------------------------------------------------',
      `Case ID: ${caseId}`,
      `Beneficiary: ${beneficiaryName}`,
      `Phone: ${phone}`,
      '',
      'Greetings! Welcome to the government PM-AJAY initiative for free vocational skill training courses, monthly DBT stipend (Rs. 1,500/month), and livelihood support.',
      '',
      'To begin your enrollment:',
      '1. Reply with a Voice Note or message sharing your education, current occupation, and desired vocational training trade.',
      '2. Or simply reply "START" or "YES" to this message.',
      customNote ? `\nOfficer Note: ${customNote}` : '',
      '--------------------------------------------------',
      '_Kural Sevi - Government PM-AJAY Telephony & WhatsApp Intake Platform_',
    ]
      .filter(Boolean)
      .join('\n');
  }

  // Rich official confirmation receipt containing real intake profile data
  const lines: string[] = [
    `*${labels.title}*`,
    '--------------------------------------------------',
    `*${labels.case_id}:* ${caseId}`,
    `*${labels.beneficiary}:* ${beneficiaryName}`,
    `*Phone:* ${phone}`,
    '',
    `*${labels.fields_header}*`,
  ];

  const orderedFields: Array<[string, string]> = [
    ['educational_background', 'கல்வித் தகுதி'],
    ['family_occupation', 'குடும்பத் தொழில்'],
    ['current_livelihood', 'தற்போதைய வேலை'],
    ['skills_and_interests', 'தொழில் ஆர்வம் & திறன்'],
    ['mobility_constraints', 'வேலை பயண வரம்பு'],
    ['employment_preference', 'வேலை விருப்பம்'],
    ['local_economic_context', 'உள்ளூர் வர்த்தக சூழல்'],
  ];

  for (const [key, fallbackLabel] of orderedFields) {
    const val = confirmedFields[key];
    if (val && String(val).trim()) {
      const nativeVal = translateValueToVernacular(String(val), lang);
      const lbl = labels[key] || fallbackLabel;
      lines.push(`• *${lbl}:* ${nativeVal}`);
    }
  }

  // Official English Administrative Block
  lines.push('');
  lines.push('*Official Administrative Record (English):*');
  for (const [key] of orderedFields) {
    const val = confirmedFields[key];
    if (val && String(val).trim()) {
      const engLbl = ENGLISH_FIELD_LABELS[key] || key.replace(/_/g, ' ');
      lines.push(`• ${engLbl}: ${val}`);
    }
  }

  // Course Information Section
  if (selectedCourse) {
    const selectedHdr: Record<string, string> = {
      ta: 'உங்களால் தேர்ந்தெடுக்கப்பட்ட பயிற்சி:',
      hi: 'आपके द्वारा चुना गया PM-AJAY कौशल कोर्स:',
      te: 'మీరు ఎంచుకున్న PM-AJAY కోర్సు:',
      en: 'Selected PM-AJAY Vocational Course:',
    };
    lines.push('');
    lines.push(`*${selectedHdr[lang] || selectedHdr.en}*`);
    lines.push(`🎯 *${selectedCourse}*`);

    // Enrich with QP code, NSQF level, duration if found in recommended courses
    const matchedCourse = recommendedCourses.find(
      (c) =>
        c.qp_name?.toLowerCase().trim() === selectedCourse.toLowerCase().trim() ||
        selectedCourse.toLowerCase().includes(c.qp_name?.toLowerCase().trim() || '---')
    );

    if (matchedCourse) {
      lines.push(`• QP Code: ${matchedCourse.qp_code} | NSQF Level: ${matchedCourse.nsqf_level || 4}`);
      if (matchedCourse.duration_hours) {
        lines.push(`• Training Duration: ${matchedCourse.duration_hours} Hours`);
      } else if (matchedCourse.duration) {
        lines.push(`• Training Duration: ${matchedCourse.duration}`);
      }
    }

    const statusText: Record<string, string> = {
      ta: '• *விண்ணப்ப நிலை:* குரல் அழைப்பு மூலம் வெற்றிகரமாக உறுதி செய்யப்பட்டுள்ளது (BENEFICIARY_CONFIRMED)',
      hi: '• *आवेदन स्थिति:* वॉइस कॉल के माध्यम से सत्यापित (BENEFICIARY_CONFIRMED)',
      te: '• *దరఖాస్తు స్థితి:* వాయిస్ కాల్ ద్వారా నిర్ధారించబడింది (BENEFICIARY_CONFIRMED)',
      en: '• *Application Status:* Confirmed via Voice Call (BENEFICIARY_CONFIRMED)',
    };
    lines.push(statusText[lang] || statusText.en);

    if (customNote) {
      lines.push(`• *குறிப்பு / Officer Note:* ${customNote}`);
    }

    const officerText: Record<string, string> = {
      ta: 'அடுத்த 3 வேலை நாட்களில் உங்கள் மாவட்ட சமூக நல அலுவலர் நேரடி சரிபார்ப்பிற்கு உங்களைத் தொடர்புகொள்வார்.',
      hi: 'अगले 3 कार्यदिवसों में जिला कल्याण अधिकारी आपसे संपर्क करेंगे।',
      te: 'వచ్చే 3 పనిదినాల్లో జిల్లా సంక్షేమ అధికారి మిమ్మల్ని సంప్రదిస్తారు.',
      en: 'District Welfare Officer will contact you within 3 working days.',
    };
    lines.push('--------------------------------------------------');
    lines.push(officerText[lang] || officerText.en);
  } else if (recommendedCourses && recommendedCourses.length > 0) {
    lines.push('');
    lines.push(`*${labels.courses_header}*`);
    recommendedCourses.slice(0, 3).forEach((c, idx) => {
      const courseNumber = idx + 1;
      const cleanName = (c.qp_name || `Course ${courseNumber}`).split('-')[0].trim();
      const nsqf = c.nsqf_level ? ` (NSQF Level ${c.nsqf_level})` : '';
      const dur = c.duration_hours ? ` [${c.duration_hours} hrs]` : '';
      lines.push(`${courseNumber}. *${cleanName}*${nsqf}${dur}`);
    });

    lines.push('');
    lines.push(`*${labels.choice_prompt}*`);
    if (customNote) {
      lines.push(`\n• *குறிப்பு / Note:* ${customNote}`);
    }
    lines.push('--------------------------------------------------');
    lines.push(`*${labels.cta}*`);
  } else {
    if (isConfirmedStatus) {
      lines.push('');
      lines.push('• *Status:* Profile Verified via Voice Call (BENEFICIARY_CONFIRMED)');
    }
    if (customNote) {
      lines.push(`• *Note:* ${customNote}`);
    }
    lines.push('--------------------------------------------------');
    lines.push('*Reply YES to confirm your application.*');
  }

  const result = lines.join('\n');
  return result.length > 1500 ? result.slice(0, 1480) + '\n...' : result;
}
