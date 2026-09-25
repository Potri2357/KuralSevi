"""
Kural Sevi — Omnichannel Citizen Notification Service
Dispatches post-call bilingual confirmation receipts (Spoken Language + Official English)
via both WhatsApp (rich card format) and SMS (accessible feature phone text).
Enables the citizen two-way confirmation feedback loop.
"""
import os
import asyncio
import logging
import urllib.parse
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from config import settings
from services.course_catalog import (
    CATALOG_COURSES,
    get_localized_course_name,
    get_short_english_name,
    find_course_in_catalog,
    format_course_selection_whatsapp,
    format_recommended_course_item,
)
from services.field_normalizer import normalize_field_to_english
import time

logger = logging.getLogger(__name__)

# Global SMS dispatch cooldown tracker to protect wallet balance from repeat sends (phone -> timestamp)
_recent_sms_timestamps: Dict[str, float] = {}

# Native Field Labels across supported language# Native Field Labels across supported languages (Clean, zero emojis)
FIELD_LABELS = {
    "ta": {
        "title": "PM-AJAY அரசு நலத்திட்ட பதிவு ரசீது",
        "beneficiary": "விண்ணப்பதாரர்",
        "case_id": "விண்ணப்ப எண் (Case ID)",
        "fields_header": "பதிவு செய்யப்பட்ட விவரங்கள் (Tamil Summary):",
        "educational_background": "கல்வித் தகுதி",
        "family_occupation": "குடும்பத் தொழில்",
        "current_livelihood": "தற்போதைய வேலை",
        "skills_and_interests": "தொழில் ஆர்வம் & திறன்",
        "mobility_constraints": "வேலை பயண வரம்பு",
        "employment_preference": "வேலை விருப்பம்",
        "local_economic_context": "உள்ளூர் வர்த்தக சூழல்",
        "courses_header": "பரிந்துரைக்கப்பட்ட PM-AJAY பயிற்சிகள்:",
        "choice_prompt": "உங்களுக்கு விருப்பமான பயிற்சியைத் தேர்ந்தெடுக்க 1, 2, அல்லது 3 என பதிலளிக்கவும். (அல்லது உறுதிப்படுத்த 'YES' என பதிலளிக்கவும்).",
        "cta": "இவ்விவரங்கள் சரியென்றால் 'YES' அல்லது உங்கள் பயிற்சி எண் (1, 2, 3) என பதிலளிக்கவும்.",
        "ack": "நன்றி! உங்கள் PM-AJAY விண்ணப்ப விவரங்கள் மற்றும் பயிற்சி விருப்பம் உறுதிப்படுத்தப்பட்டன. மாவட்ட நல அலுவலர் உங்களை விரைவில் தொடர்புகொள்வார்.",
    },
    "ml": {
        "title": "PM-AJAY ക്ഷേമ പദ്ധതി അപേക്ഷ രസീത്",
        "beneficiary": "ഗുണഭോക്താവ്",
        "case_id": "കേസ് ഐഡി (Case ID)",
        "fields_header": "രേഖപ്പെടുത്തിയ വിവരങ്ങൾ (Malayalam Summary):",
        "educational_background": "വിദ്യാഭ്യാസം",
        "family_occupation": "കുടുംബ തൊഴിൽ",
        "current_livelihood": "ഇപ്പോഴത്തെ ജോലി",
        "skills_and_interests": "തൊഴിൽ നൈപുണ്യം",
        "mobility_constraints": "യാത്രാ പരിധി",
        "employment_preference": "തൊഴിൽ മുൻഗണന",
        "local_economic_context": "പ്രദേശിക വിപണി",
        "courses_header": "നിങ്ങൾക്കായി ശുപാർശ ചെയ്ത കോഴ്സുകൾ:",
        "choice_prompt": "നിങ്ങളുടെ മുൻഗണനാ കോഴ്സ് തിരഞ്ഞെടുക്കാൻ 1, 2, അല്ലെങ്കിൽ 3 എന്ന് മറുപടി നൽകുക. (അല്ലെങ്കിൽ സ്ഥിരീകരിക്കാൻ 'YES' എന്ന് നൽകുക).",
        "cta": "വിവരങ്ങൾ ശരിയാണെങ്കിൽ 'YES' അല്ലെങ്കിൽ കോഴ്സ് നമ്പർ (1, 2, 3) എന്ന് മറുപടി നൽകുക.",
        "ack": "നന്ദി! താങ്കളുടെ PM-AJAY അപേക്ഷയും കോഴ്സ് തിരഞ്ഞെടുപ്പും വിജയകരമായി സ്ഥിരീകരിച്ചു. ജില്ലാ ഉദ്യോഗസ്ഥൻ ഉടൻ ബന്ധപ്പെടും.",
    },
    "hi": {
        "title": "PM-AJAY कल्याणकारी योजना आवेदन रसीद",
        "beneficiary": "लाभार्थी",
        "case_id": "आवेदन संख्या (Case ID)",
        "fields_header": "दर्ज किया गया विवरण (Hindi Summary):",
        "educational_background": "शैक्षिक योग्यता",
        "family_occupation": "पारिवारिक व्यवसाय",
        "current_livelihood": "वर्तमान कार्य",
        "skills_and_interests": "कौशल और रुचि",
        "mobility_constraints": "कार्य क्षेत्र सीमा",
        "employment_preference": "रोज़गार प्राथमिकता",
        "local_economic_context": "स्थानीय बाजार",
        "courses_header": "आपके लिए अनुशंसित कौशल कोर्स:",
        "choice_prompt": "अपना पसंदीदा कोर्स चुनने के लिए 1, 2, या 3 लिखकर भेजें (या पुष्टि के लिए 'YES' लिखें)।",
        "cta": "यदि यह विवरण सही है तो 'YES' या कोर्स नंबर (1, 2, 3) लिखकर भेजें।",
        "ack": "धन्यवाद! आपका PM-AJAY आवेदन और कोर्स चयन सफलतापूर्वक सत्यापित कर दिया गया है। जिला अधिकारी जल्द संपर्क करेंगे।",
    },
    "te": {
        "title": "PM-AJAY సంక్షేమ పథకం దరఖాస్తు రశీదు",
        "beneficiary": "లబ్ధిదారుడు",
        "case_id": "దరఖాస్తు సంఖ్య (Case ID)",
        "fields_header": "నమోదు చేయబడిన వివరాలు (Telugu Summary):",
        "educational_background": "చదువు",
        "family_occupation": "కుటుంబ వృత్తి",
        "current_livelihood": "ప్రస్తుత పని",
        "skills_and_interests": "నైపుణ్యం & ఆసక్తి",
        "mobility_constraints": "ప్రయాణ పరిధి",
        "employment_preference": "ఉపాధి ప్రాధాన్యత",
        "local_economic_context": "స్థానిక మార్కెట్",
        "courses_header": "మీ కోసం సిఫార్సు చేయబడిన కోర్సులు:",
        "choice_prompt": "మీకు నచ్చిన కోర్సును ఎంచుకోవడానికి 1, 2 లేదా 3 అని రిప్లై ఇవ్వండి (లేదా నిర్ధారించడానికి 'YES' అని పంపండి).",
        "cta": "ఈ వివరాలు సరైనవయితే 'YES' లేదా కోర్సు నంబర్ (1, 2, 3) అని రిప్లై ఇవ్వండి.",
        "ack": "ధన్యవాదాలు! మీ PM-AJAY దరఖాస్తు మరియు కోర్సు ఎంపిక విజయవంతంగా నిర్ధారించబడింది. జిల్లా సంక్షేమ అధికారి త్వరలో సంప్రదిస్తారు.",
    }
}

# English labels for the official PM-AJAY administrative section
ENGLISH_FIELD_LABELS = {
    "educational_background": "Education Level",
    "family_occupation": "Family Occupation",
    "current_livelihood": "Current Livelihood",
    "skills_and_interests": "Skills & Interests",
    "mobility_constraints": "Mobility / Work Radius",
    "employment_preference": "Employment Preference",
    "local_economic_context": "Local Economic Context",
}


def _translate_value_to_vernacular(english_val: str, lang: str) -> str:
    """Helper to convert standardized English values into natural native vernacular phrases."""
    if not english_val or str(english_val).strip().lower() in ("known value", "recorded", "none"):
        return {"ta": "பதிவு செய்யப்பட்டது", "ml": "രേഖപ്പെടുത്തി", "hi": "दर्ज किया गया", "te": "నమోదు చేయబడింది"}.get(lang, "Recorded")

    val_lower = str(english_val).lower()

    # Trades & Skills
    if "tailor" in val_lower or "stitch" in val_lower or "garment" in val_lower:
        return {"ta": "தையல் மற்றும் ஆடை வடிவமைப்பு", "ml": "ടെയ്‌ലറിംഗ് / വസ്ത്ര നിർമ്മാണം", "hi": "सिलाई एवं वस्त्र निर्माण", "te": "టైలరింగ్ / దుస్తుల తయారీ"}.get(lang, english_val)
    if "mechanic" in val_lower or "auto" in val_lower or "two-wheeler" in val_lower or "bike" in val_lower:
        return {"ta": "டூவீலர் மெக்கானிக் / பைக் பழுதுநீக்கம்", "ml": "ടൂവീലർ മെക്കാനിക്ക്", "hi": "दोपहिया वाहन मैकेनिक", "te": "టూవీలర్ మెకానిక్"}.get(lang, english_val)
    if "leather" in val_lower or "shoe" in val_lower or "footwear" in val_lower or "chappal" in val_lower:
        return {"ta": "தோல் மற்றும் காலணி தயாரிப்பு", "ml": "ലെതർ, പാദരക്ഷാ നിർമ്മാണം", "hi": "चमड़ा एवं जूता निर्माण", "te": "లెదర్ మరియు పాదరక్షల తయారీ"}.get(lang, english_val)
    if "poultry" in val_lower or "chicken" in val_lower or "broiler" in val_lower:
        return {"ta": "கோழிப்பண்ணை மற்றும் இறைச்சி விற்பனை", "ml": "കോഴി വളർത്തൽ", "hi": "मुर्गी पालन व्यवसाय", "te": "కోళ్ల పెంపకం"}.get(lang, english_val)
    if "dairy" in val_lower or "milk" in val_lower or "cattle" in val_lower or "livestock" in val_lower:
        return {"ta": "கால்நடை வளர்ப்பு & பால் பண்ணை", "ml": "ക്ഷീരകർഷകനും പാൽ സംസ്കരണവും", "hi": "डेयरी फार्मिंग एवं पशुपालन", "te": "పాడి పరిశ్రమ మరియు పశుపోషణ"}.get(lang, english_val)
    if "beauty" in val_lower or "salon" in val_lower or "parlour" in val_lower or "hair" in val_lower:
        return {"ta": "அழகுக்கலை & சலூன் பயிற்சி", "ml": "ബ്യൂട്ടി പാർലർ & സലൂൺ", "hi": "ब्यूटी पार्लर एवं सैलून", "te": "బ్యూటీ పార్లర్ మరియు సెలూన్"}.get(lang, english_val)
    if "electric" in val_lower or "appliance" in val_lower or "wiring" in val_lower:
        return {"ta": "வீட்டு மின்சாதனங்கள் பழுதுநீக்கம்", "ml": "ഇലക്ട്രിക്കൽ വയറിംഗ് & റിപ്പയർ", "hi": "घरेलू बिजली उपकरण मरम्मत", "te": "ఎలక్ట్రికల్ గృహోపకరణాల మరమ్మతులు"}.get(lang, english_val)
    if "catering" in val_lower or "food" in val_lower or "cooking" in val_lower or "pickle" in val_lower:
        return {"ta": "உணவு தயாரிப்பு, கேட்டரிங் & ஊறுகாய்", "ml": "ഭക്ഷണ നിർമ്മാണവും കാറ്ററിംഗും", "hi": "खाद्य प्रसंस्करण एवं कैटरिंग", "te": "ఫుడ్ కేటరింగ్ మరియు తయారీ"}.get(lang, english_val)
    if "agriculture" in val_lower or "farming" in val_lower or "crop" in val_lower:
        return {"ta": "விவசாயம் / வேளாண்மை", "ml": "കൃഷി", "hi": "कृषि / खेती", "te": "వ్యవసాయం"}.get(lang, english_val)
    if "daily wage" in val_lower or "coolie" in val_lower or "labour" in val_lower:
        return {"ta": "தினக்கூலி வேலை", "ml": "ദിവസവേതന ജോലി", "hi": "दैनिक मजदूरी", "te": "దినసరి కూలీ"}.get(lang, english_val)
    if "weaving" in val_lower or "handloom" in val_lower or "loom" in val_lower:
        return {"ta": "நெசவு மற்றும் கைத்தறி வேலை", "ml": "നെയ്ത്ത് ജോലി", "hi": "बुनकरी एवं हथकरघा", "te": "చేనేత వృత్తి"}.get(lang, english_val)
    if "driver" in val_lower or "driving" in val_lower:
        return {"ta": "ஓட்டுநர் (டிரைவர்)", "ml": "ഡ്രൈവിംഗ്", "hi": "ड्राइविंग / वाहन चालक", "te": "డ్రైవింగ్"}.get(lang, english_val)
    if "grocery" in val_lower or "kirana" in val_lower or "retail" in val_lower or "shopkeeper" in val_lower:
        return {"ta": "மளிகை மற்றும் சில்லறை விற்பனை கடை", "ml": "പലചരക്ക് കട", "hi": "किराना एवं खुदरा दुकान", "te": "కిరాణా మరియు రిటైల్ దుకాణం"}.get(lang, english_val)
    if "vegetable" in val_lower or "fruit" in val_lower:
        return {"ta": "காய்கறி மற்றும் பழங்கள் விற்பனை", "ml": "പച്ചക്കറി കച്ചവടം", "hi": "सब्जी एवं फल विक्रेता", "te": "కూరగాయల వ్యాపారం"}.get(lang, english_val)

    # Education
    if "12th" in val_lower or "class 12" in val_lower or "higher secondary" in val_lower:
        return {"ta": "12-ஆம் வகுப்பு முடித்தது", "ml": "പന്ത്രണ്ടാം ക്ലാസ്", "hi": "12वीं कक्षा उत्तीर्ण", "te": "12వ తరగతి ఉత్తీర్ణత"}.get(lang, english_val)
    if "10th" in val_lower or "class 10" in val_lower or "sslc" in val_lower or "secondary" in val_lower:
        return {"ta": "10-ஆம் வகுப்பு முடித்தது", "ml": "പത്താം ക്ലാസ്", "hi": "10वीं कक्षा उत्तीर्ण", "te": "10వ తరగతి ఉత్తీర్ణత"}.get(lang, english_val)
    if "graduate" in val_lower or "degree" in val_lower or "college" in val_lower:
        return {"ta": "பட்டப்படிப்பு / கல்லூரி", "ml": "ബിരുദം", "hi": "स्नातक / कॉलेज", "te": "డిగ్రీ / గ్రాడ్యుయేట్"}.get(lang, english_val)
    if "8th" in val_lower or "middle" in val_lower:
        return {"ta": "8-ஆம் வகுப்பு வரை", "ml": "എട്ടാം ക്ലാസ്", "hi": "8वीं कक्षा तक", "te": "8వ తరగతి వరకు"}.get(lang, english_val)
    if "5th" in val_lower or "primary" in val_lower:
        return {"ta": "தொடக்கக் கல்வி (5-ஆம் வகுப்பு வரை)", "ml": "പ്രൈമറി വിദ്യാഭ്യാസം", "hi": "प्राथमिक शिक्षा (5वीं तक)", "te": "ప్రాథమిక విద్య"}.get(lang, english_val)
    if "no formal" in val_lower or "literate" in val_lower or "illiterate" in val_lower:
        return {"ta": "பள்ளிக்கல்வி இல்லை / எழுத்தறிவு", "ml": "സ്കൂൾ വിദ്യാഭ്യാസമില്ല", "hi": "साक्षर / अनौपचारिक", "te": "అక్షరాస్యుడు / బడికి వెళ్లలేదు"}.get(lang, english_val)

    # Mobility Constraints
    if "local only" in val_lower or "cannot travel" in val_lower or "within village" in val_lower or "local area" in val_lower:
        return {"ta": "உள்ளூர் / சொந்த ஊருக்குள் மட்டுமே", "ml": "സ്വന്തം നാട്ടിൽ മാത്രം", "hi": "केवल स्थानीय क्षेत्र / गांव में", "te": "సొంత ఊర్లో మాత్రమే"}.get(lang, english_val)
    if "nearby town" in val_lower or "nearby" in val_lower or "travel" in val_lower or "district" in val_lower:
        return {"ta": "அருகிலுள்ள நகரங்களுக்குச் செல்லலாம்", "ml": "അടുത്തുള്ള പട്ടണങ്ങളിൽ പോകാം", "hi": "आस-पास के शहरों तक जा सकते हैं", "te": "సమీప పట్టణాల వరకు వెళ్లగలరు"}.get(lang, english_val)
    if "no constraint" in val_lower or "anywhere" in val_lower:
        return {"ta": "எங்கு வேண்டுமானாலும் பயணம் செய்யலாம்", "ml": "യാത്രാ തടസ്സങ്ങളില്ല", "hi": "कहीं भी यात्रा कर सकते हैं", "te": "ఎక్కడికైనా ప్రయాణించవచ్చు"}.get(lang, english_val)

    # Employment Preference
    if "self-employment" in val_lower or "own shop" in val_lower or "business" in val_lower or "enterprise" in val_lower:
        return {"ta": "சுயதொழில் (சொந்த கடை / தொழில் நிறுவனம்)", "ml": "സ്വയംതൊഴിൽ (സ്വന്തം സംരംഭം)", "hi": "स्वरोज़गार (खुद की दुकान / व्यवसाय)", "te": "స్వయం ఉపాధి (సొంత వ్యాపారం / దుకాణం)"}.get(lang, english_val)
    if "wage" in val_lower or "salary" in val_lower or "job" in val_lower or "monthly" in val_lower:
        return {"ta": "மாத ஊதிய வேலை (நிறுவன பணி)", "ml": "മാസ ശമ്പളമുള്ള ജോലി", "hi": "मासिक वेतन वाली नौकरी", "te": "నెల జీతం ఉద్యోగం"}.get(lang, english_val)

    # Local Economic Context
    if "market" in val_lower or "bazaar" in val_lower or "commerce" in val_lower or "santhai" in val_lower:
        return {"ta": "வாரச்சந்தை மற்றும் கிராம வணிகக் கடைகள்", "ml": "പ്രദേശിക ചന്ത & വ്യാപാരം", "hi": "साप्ताहिक ग्रामीण हाट एवं बाजार", "te": "వారపు సంత మరియు స్థానిక వ్యాపారం"}.get(lang, english_val)
    if "mill" in val_lower or "factory" in val_lower or "industrial" in val_lower:
        return {"ta": "அருகிலுள்ள ஆலைகள் / தொழிற்சாலை சூழல்", "ml": "ഫാക്ടറി / വ്യവസായ മേഖല", "hi": "आस-पास के कारखाने / मिल", "te": "సమీప మిల్లులు / కర్మాగారాలు"}.get(lang, english_val)

    return english_val


def clean_indian_phone(raw_phone: str) -> str:
    """Normalizes phone number to strict +91XXXXXXXXXX format, removing leading trunk zero."""
    if not raw_phone:
        return ""
    digits = "".join(c for c in str(raw_phone) if c.isdigit())
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    if digits.startswith("0") and len(digits) == 11:
        return f"+91{digits[1:]}"
    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) > 10:
        return f"+91{digits[-10:]}"
    return f"+{digits}" if not str(raw_phone).startswith("+") else str(raw_phone)


class NotificationService:
    """Manages dispatch of bilingual confirmation receipts and citizen confirmation tracking."""

    def __init__(self):
        self.sms_gateway_url = getattr(settings, "sms_gateway_url", "http://localhost:5005") or os.getenv("SMS_GATEWAY_URL", "http://localhost:5005")
        self.android_gateway_url = getattr(settings, "android_sms_gateway_url", None) or os.getenv("ANDROID_SMS_GATEWAY_URL")
        self.android_gateway_login = getattr(settings, "android_sms_gateway_login", None) or os.getenv("ANDROID_SMS_GATEWAY_LOGIN")
        self.android_gateway_password = getattr(settings, "android_sms_gateway_password", None) or os.getenv("ANDROID_SMS_GATEWAY_PASSWORD")
        self.sms_provider = getattr(settings, "sms_provider", "open-source") or os.getenv("SMS_PROVIDER", "open-source")
        self.whatsapp_bot_url = getattr(settings, "whatsapp_bot_url", None) or os.getenv("WHATSAPP_BOT_URL", "http://localhost:5005")
        self.fast2sms_api_key = getattr(settings, "fast2sms_api_key", None) or os.getenv("FAST2SMS_API_KEY")

    def build_bilingual_whatsapp_message(
        self,
        phone: str,
        language_code: str,
        case_id: str,
        confirmed_fields: Dict[str, str],
        caller_name: Optional[str] = None,
        recommended_courses: Optional[list] = None,
        selected_course: Optional[str] = None,
    ) -> str:
        """Generates clean formatted WhatsApp message containing Spoken Vernacular + English Profile + Selected/Top Courses."""
        lang = language_code if language_code in FIELD_LABELS else "ta"
        labels = FIELD_LABELS[lang]
        
        raw_name = str(caller_name or "").strip()
        if not raw_name or raw_name.lower().strip(" .,!?:;") in ("beneficiary", "citizen", "சரி", "ஆம்", "ம்", "ஹலோ", "வணக்கம்", "yes", "ok", "done", "hello", "hi") or len(raw_name) < 2:
            name = "குடிமகன் (Beneficiary)" if lang == "ta" else "Beneficiary"
        else:
            name = raw_name

        clean_phone = clean_indian_phone(phone)
        lines = [
            f"*{labels['title']}*",
            "--------------------------------------------------",
            f"*{labels['case_id']}:* {case_id}",
            f"*{labels['beneficiary']}:* {name}",
            f"*Phone:* {clean_phone}",
            "",
            f"*{labels['fields_header']}*",
        ]

        # ALL 7 PS-Mandated Intake Summary Fields in Vernacular
        all_ordered_fields = [
            ("educational_background", "கல்வித் தகுதி"),
            ("family_occupation", "குடும்பத் தொழில்"),
            ("current_livelihood", "தற்போதைய வேலை"),
            ("skills_and_interests", "தொழில் ஆர்வம் & திறன்"),
            ("mobility_constraints", "வேலை பயண வரம்பு"),
            ("employment_preference", "வேலை விருப்பம்"),
            ("local_economic_context", "உள்ளூர் வர்த்தக சூழல்"),
        ]

        for fn, fallback_lbl in all_ordered_fields:
            if fn in confirmed_fields and confirmed_fields[fn]:
                raw_citizen_val = str(confirmed_fields[fn]).strip()
                has_indic = any(ord(c) > 127 for c in raw_citizen_val)
                if has_indic:
                    native_val = raw_citizen_val
                else:
                    native_val = _translate_value_to_vernacular(raw_citizen_val, lang)
                lbl = labels.get(fn, fallback_lbl)
                lines.append(f"• *{lbl}:* {native_val}")

        # English Administrative Verification Block
        lines.extend([
            "",
            "*Official Administrative Record (English):*",
        ])
        for fn, _ in all_ordered_fields:
            if fn in confirmed_fields and confirmed_fields[fn]:
                raw_citizen_val = str(confirmed_fields[fn]).strip()
                eng_val = normalize_field_to_english(fn, raw_citizen_val, lang)
                eng_lbl = ENGLISH_FIELD_LABELS.get(fn, fn.replace("_", " ").title())
                lines.append(f"• {eng_lbl}: {eng_val}")

        # Course Information Section
        if selected_course:
            hdr, bold_line, details_line = format_course_selection_whatsapp(
                selected_course,
                lang=lang,
                recommended_courses=recommended_courses
            )
            lines.extend([
                "",
                f"*{hdr}*",
                bold_line,
                details_line,
            ])

            cd = find_course_in_catalog(str(selected_course))
            if not cd and recommended_courses:
                for rc in recommended_courses:
                    if str(selected_course).strip().lower() in rc.get("qp_name", "").lower():
                        cd = rc
                        break
            if cd:
                qp_code = cd.get("qp_code", "N/A")
                nsqf = cd.get("nsqf_level", 4)
                lines.append(f"• QP Code: {qp_code} | NSQF Level: {nsqf}")
                if cd.get("duration_hours"):
                    lines.append(f"• Training Duration: {cd.get('duration_hours')} Hours")

            status_text = {
                "ta": "• *விண்ணப்ப நிலை:* குரல் அழைப்பு மூலம் வெற்றிகரமாக உறுதி செய்யப்பட்டுள்ளது (BENEFICIARY_CONFIRMED)",
                "hi": "• *आवेदन स्थिति:* वॉइस कॉल के माध्यम से सत्यापित (BENEFICIARY_CONFIRMED)",
                "ml": "• *അപേക്ഷാ നില:* വോയ്‌സ് കോൾ വഴി സ്ഥിരീകരിച്ചു (BENEFICIARY_CONFIRMED)",
                "te": "• *దరఖాస్తు స్థితి:* వాయిస్ కాల్ ద్వారా నిర్ధారించబడింది (BENEFICIARY_CONFIRMED)",
            }.get(lang, "• *Application Status:* Confirmed via Voice Call (BENEFICIARY_CONFIRMED)")

            officer_text = {
                "ta": "அடுத்த 3 வேலை நாட்களில் உங்கள் மாவட்ட சமூக நல அலுவலர் நேரடி சரிபார்ப்பிற்கு உங்களைத் தொடர்புகொள்வார்.",
                "hi": "अगले 3 कार्यदिवसों में जिला कल्याण अधिकारी आपसे संपर्क करेंगे।",
                "ml": "അടുത്ത 3 പ്രവൃത്തി ദിവസങ്ങൾക്കുള്ളിൽ ജില്ലാ ഓഫീസർ ബന്ധപ്പെടും.",
                "te": "వచ్చే 3 పనిదినాల్లో జిల్లా సంక్షేమ అధికారి మిమ్మల్ని సంప్రదిస్తారు.",
            }.get(lang, "District Welfare Officer will contact you within 3 working days.")

            lines.extend([
                status_text,
                "--------------------------------------------------",
                officer_text,
            ])
        else:
            # Top 3 Recommended NSQF Courses
            courses = recommended_courses or []
            if courses:
                c_hdr = labels.get("courses_header", "Recommended Courses:")
                c_prompt = labels.get("choice_prompt", "Reply with 1, 2, or 3 to choose your preferred course.")
                lines.extend([
                    "",
                    f"*{c_hdr}*",
                ])
                for i, c in enumerate(courses[:3], 1):
                    lines.append(format_recommended_course_item(i, c, lang=lang))

                lines.extend([
                    "",
                    f"*{c_prompt}*",
                ])

            cta = labels.get("cta", "Reply with 1, 2, 3 or YES")
            lines.extend([
                "--------------------------------------------------",
                f"*{cta}*",
                "*Reply 1, 2, or 3 to select your course, or reply 'YES' to confirm.*"
            ])

        msg = "\n".join(lines)
        if len(msg) > 1500:
            msg = msg[:1480] + "\n..."
        return msg

    def build_bilingual_sms_message(
        self,
        phone: str,
        language_code: str,
        case_id: str,
        confirmed_fields: Dict[str, str],
        caller_name: Optional[str] = None,
        recommended_courses: Optional[list] = None,
        selected_course: Optional[str] = None,
    ) -> str:
        """
        Generates cleanly aligned, 100% GSM-7 / ASCII SMS with real profile fields.
        Ensures exact citizen details are included without non-ASCII distortion.
        """
        cid = (case_id or "N/A")[:8].upper()
        clean_phone = clean_indian_phone(phone)
        display_phone = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone

        def to_ascii_val(field_key: str, fallback_txt: str = "Recorded", max_len: int = 24) -> str:
            raw_v = confirmed_fields.get(field_key, "")
            if not raw_v:
                return fallback_txt
            eng_v = normalize_field_to_english(field_key, str(raw_v), language_code)
            clean_v = "".join(c for c in eng_v if ord(c) < 128).split("(")[0].strip(" ,.-/")
            return clean_v[:max_len] or fallback_txt

        clean_edu = to_ascii_val("educational_background", "Recorded", 22)
        clean_work = to_ascii_val("current_livelihood", to_ascii_val("family_occupation", "Recorded", 22), 22)
        clean_skills = to_ascii_val("skills_and_interests", "", 22)

        lines = [
            f"Kural Sevi Ref: {cid}",
            f"Citizen: {display_phone}",
            f"Edu: {clean_edu}",
            f"Work: {clean_work}",
        ]
        if clean_skills and clean_skills != "Recorded":
            lines.append(f"Skill: {clean_skills}")

        if selected_course:
            cd = find_course_in_catalog(str(selected_course))
            course_str = cd.get("qp_name", str(selected_course)) if cd else str(selected_course)
            clean_c = "".join(c for c in course_str if ord(c) < 128).strip(" ,.-") or "Vocational Training"
            lines.append(f"Course: {clean_c[:28]}")
            lines.append("Status: Confirmed via Voice Call")
        else:
            courses = recommended_courses or []
            if courses and len(courses) >= 1:
                c1 = courses[0]
                c_name = get_short_english_name(c1) if isinstance(c1, dict) else str(c1)
                clean_cn = "".join(ch for ch in c_name if ord(ch) < 128).strip(" ,.-")
                lines.append(f"Course: {clean_cn[:28]}")
                lines.append("Status: Recorded via Voice Call")
            else:
                lines.append("Status: Recorded via Voice Call")

        msg = "\n".join(lines)
        clean_ascii = "".join(c for c in msg if ord(c) < 128).strip()
        return clean_ascii

    async def dispatch_bilingual_confirmation(
        self,
        phone: str,
        language_code: str,
        case_id: str,
        confirmed_fields: Dict[str, str],
        caller_name: Optional[str] = None,
        recommended_courses: Optional[list] = None,
        selected_course: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches bilingual confirmation through BOTH WhatsApp and SMS concurrently.
        Includes top recommended courses or verified citizen selection.
        """
        target_phone = clean_indian_phone(phone)

        wa_text = self.build_bilingual_whatsapp_message(
            phone=target_phone,
            language_code=language_code,
            case_id=case_id,
            confirmed_fields=confirmed_fields,
            caller_name=caller_name,
            recommended_courses=recommended_courses,
            selected_course=selected_course,
        )
        sms_text = self.build_bilingual_sms_message(
            phone=target_phone,
            language_code=language_code,
            case_id=case_id,
            confirmed_fields=confirmed_fields,
            caller_name=caller_name,
            recommended_courses=recommended_courses,
            selected_course=selected_course,
        )

        # Exclusively dispatch via Self-Hosted WhatsApp Bot and Open-Source SMS Gateway (Android Gateway / Hub)
        wa_task = self._send_local_bot_whatsapp(target_phone, wa_text)
        sms_task = self._send_open_source_sms(target_phone, sms_text)

        results_list = await asyncio.gather(wa_task, sms_task, return_exceptions=True)
        wa_res = results_list[0] if not isinstance(results_list[0], Exception) else f"EXC:{results_list[0]}"
        sms_res = results_list[1] if not isinstance(results_list[1], Exception) else f"EXC:{results_list[1]}"

        clean_digits = "".join(c for c in target_phone if c.isdigit())
        wa_link = f"https://wa.me/{clean_digits}?text={urllib.parse.quote(wa_text)}"

        results = {
            "whatsapp": str(wa_res),
            "sms": str(sms_res),
            "whatsapp_link": wa_link,
            "sms_text": sms_text,
            "wa_text": wa_text,
        }
        logger.info(f"Dispatched bilingual confirmations to {target_phone} (Case {case_id}): {results}")
        return results

    async def _send_open_source_sms(self, to_number: str, body: str) -> str:
        """Sends a real cellular SMS via Android SMS Gateway or local hub with zero delays."""
        target_phone = clean_indian_phone(to_number)

        def _sync_open_source_sms():
            import urllib.request
            import urllib.error
            import json
            import base64

            # Attempt 1: Direct dispatch to Android SMS Gateway (Fastest, zero intermediate hops)
            if self.android_gateway_url:
                try:
                    gw_url = self.android_gateway_url.rstrip("/") + "/message"
                    gw_payload = json.dumps({
                        "message": body[:160],
                        "phoneNumbers": [target_phone]
                    }).encode("utf-8")
                    gw_req = urllib.request.Request(gw_url, data=gw_payload, method="POST")
                    gw_req.add_header("Content-Type", "application/json")
                    if self.android_gateway_login and self.android_gateway_password:
                        creds = f"{self.android_gateway_login}:{self.android_gateway_password}"
                        gw_req.add_header("Authorization", f"Basic {base64.b64encode(creds.encode()).decode()}")
                    with urllib.request.urlopen(gw_req, timeout=3.0) as resp:
                        resp_data = json.loads(resp.read().decode("utf-8"))
                        msg_id = resp_data.get("id", "sent")
                        logger.info(f"Direct Android Cellular SMS dispatched to {target_phone} (ID: {msg_id})")
                        return f"ANDROID_GW_SENT:{resp.status}:{msg_id}"
                except Exception as direct_err:
                    logger.warning(f"Direct Android gateway attempt notice ({direct_err}), falling back to hub...")

            # Attempt 2: Local Gateway Hub (:5005)
            try:
                hub_url = f"{self.sms_gateway_url.rstrip('/')}/sms/send"
                clean_digits = "".join(c for c in target_phone if c.isdigit())
                payload = json.dumps({
                    "to": clean_digits,
                    "message": body[:160],
                    "mirrorWhatsApp": False
                }).encode("utf-8")

                req = urllib.request.Request(hub_url, data=payload, method="POST")
                req.add_header("Content-Type", "application/json")
                req.add_header("User-Agent", "KuralSevi/1.0")

                with urllib.request.urlopen(req, timeout=6.0) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    if resp_data.get("success"):
                        method = resp_data.get("method", "open-source")
                        msg_id = resp_data.get("messageId", "sent")
                        logger.info(f"Open-source SMS dispatched to {clean_digits} via {method} (ID: {msg_id})")
                        return f"OPEN_SOURCE_SMS_SENT:{method}:{msg_id}"
            except Exception as hub_err:
                logger.warning(f"SMS Hub dispatch notice: {hub_err}")

            return "SMS_LOGGED_LOCAL"

        return await asyncio.to_thread(_sync_open_source_sms)


    async def _send_fast2sms(self, to_number: str, body: str) -> str:
        """Sends a single-credit GSM-7 SMS via Fast2SMS with urllib and curl fallback in thread pool."""
        if not self.fast2sms_api_key:
            logger.info(f"[SIMULATED FAST2SMS] To: {to_number} | Body: {body[:60]}...")
            return "SIMULATED_SENT"

        clean_digits = "".join(c for c in to_number if c.isdigit())
        if clean_digits.startswith("91") and len(clean_digits) == 12:
            clean_digits = clean_digits[2:]

        now = time.time()
        last_sent = _recent_sms_timestamps.get(clean_digits, 0.0)
        # Protect wallet balance from accidental rapid double-firing (8s debounce window)
        if (now - last_sent) < 8.0:
            logger.info(f"[SMS COOLDOWN GUARD] Skipping repeat SMS to {clean_digits} (last sent {now - last_sent:.1f}s ago). Fast2SMS balance protected!")
            return "FAST2SMS_SENT:debounced"
        _recent_sms_timestamps[clean_digits] = now

        def _sync_fast2sms():
            import json
            import subprocess
            import urllib.request
            import urllib.error

            api_url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": self.fast2sms_api_key,
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
            # Ensure pure ASCII and <= 160 chars to strictly consume 1 SMS credit (GSM-7 standard)
            ascii_msg = "".join(c for c in body if ord(c) < 128).strip()[:160]
            payload_str = json.dumps({
                "route": "q",
                "message": ascii_msg,
                "language": "english",
                "flash": 0,
                "numbers": clean_digits,
            })
            payload_bytes = payload_str.encode("utf-8")

            # Attempt 1: urllib.request (direct TLS connection)
            try:
                import ssl
                ctx = ssl.create_default_context()
                try:
                    ctx.set_ciphers("DEFAULT@SECLEVEL=1")
                except Exception:
                    pass
                req = urllib.request.Request(api_url, data=payload_bytes, headers=headers, method="POST")
                with urllib.request.urlopen(req, context=ctx, timeout=6.0) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    if resp_data.get("return") or resp_data.get("status_code") == 200:
                        req_id = resp_data.get("request_id", "sent")
                        ret_msg = resp_data.get("message", ["Sent"])[0] if isinstance(resp_data.get("message"), list) else resp_data.get("message", "Sent")
                        logger.info(f"Fast2SMS message sent to {clean_digits} (ReqID: {req_id}, Msg: {ret_msg})")
                        return f"FAST2SMS_SENT:{req_id}"
                    else:
                        logger.warning(f"Fast2SMS response notice: {resp_data}")
                        return f"FAST2SMS_NOTICE:{resp_data.get('message', 'error')}"
            except Exception as urr_err:
                logger.warning(f"Fast2SMS urllib attempt notice ({urr_err}), trying curl subprocess fallback...")

            # Attempt 2: curl subprocess fallback (handles edge-case TLS/Cloudflare environments)
            try:
                curl_cmd = [
                    "curl", "--tlsv1.2", "--http1.1", "-s", "-X", "POST", api_url,
                    "-H", f"authorization: {self.fast2sms_api_key}",
                    "-H", "Content-Type: application/json",
                    "-H", "User-Agent: curl/8.7.1",
                    "-d", payload_str,
                    "--max-time", "6"
                ]
                proc = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=7)
                if proc.returncode == 0 and proc.stdout:
                    resp_data = json.loads(proc.stdout)
                    if resp_data.get("return") or resp_data.get("status_code") == 200:
                        req_id = resp_data.get("request_id", "sent")
                        logger.info(f"Fast2SMS curl fallback sent to {clean_digits} (ReqID: {req_id})")
                        return f"FAST2SMS_SENT:{req_id}"
                    else:
                        logger.warning(f"Fast2SMS curl response: {resp_data}")
                        return f"FAST2SMS_NOTICE:{resp_data.get('message', 'error')}"
            except Exception as curl_err:
                logger.warning(f"Fast2SMS curl fallback failed: {curl_err}")

            return "FAST2SMS_FAILED:error"

        return await asyncio.to_thread(_sync_fast2sms)

    async def _send_local_bot_whatsapp(self, to_number: str, body: str) -> str:
        """Sends an automated WhatsApp message via the self-hosted Baileys WhatsApp bot (Option B)."""
        if not self.whatsapp_bot_url:
            return "BOT_NOT_CONFIGURED"

        def _sync_bot_post():
            import urllib.request
            import urllib.error
            import json

            clean_digits = "".join(c for c in to_number if c.isdigit())
            api_url = f"{self.whatsapp_bot_url.rstrip('/')}/send"
            payload = json.dumps({
                "to": clean_digits,
                "message": body
            }).encode("utf-8")

            req = urllib.request.Request(api_url, data=payload, method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("User-Agent", "KuralSevi/1.0")

            try:
                with urllib.request.urlopen(req, timeout=8.0) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    if resp_data.get("success"):
                        msg_id = resp_data.get("messageId", "sent")
                        logger.info(f"Local WhatsApp Bot dispatched to {clean_digits} (ID: {msg_id})")
                        return f"BOT_SENT:{msg_id}"
                    return f"BOT_FAILED:{resp_data.get('error', 'unknown')}"
            except Exception as ex:
                return f"BOT_UNAVAILABLE:{str(ex)[:40]}"

        return await asyncio.to_thread(_sync_bot_post)
