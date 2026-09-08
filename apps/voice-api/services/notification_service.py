"""
Kural Sevi — Omnichannel Citizen Notification Service
Dispatches post-call bilingual confirmation receipts (Spoken Language + Official English)
via both WhatsApp (rich card format) and SMS (accessible feature phone text).
Enables the citizen two-way confirmation feedback loop.
"""
import asyncio
import logging
import base64
import urllib.parse
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from config import settings

logger = logging.getLogger(__name__)

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
        "courses_header": "आपके लिए अनुशंसित PM-AJAY कोर्स:",
        "choice_prompt": "अपना पसंदीदा कोर्स चुनने के लिए 1, 2, या 3 लिखकर भेजें। (या पुष्टि के लिए 'YES' लिखें)।",
        "cta": "यदि यह विवरण सही है तो 'YES' या कोर्स संख्या (1, 2, 3) लिखकर भेजें।",
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
        "courses_header": "మీ కోసం సిఫార్సు చేయబడిన PM-AJAY కోర్సులు:",
        "choice_prompt": "మీకు నచ్చిన కోర్సు ఎంచుకోవడానికి 1, 2, లేదా 3 అని సమాధానం ఇవ్వండి. (లేదా ధృవీకరించడానికి 'YES' అని పంపండి).",
        "cta": "ఈ వివరాలు సరైనవయితే 'YES' లేదా కోర్సు సంఖ్య (1, 2, 3) అని సమాధానం ఇవ్వండి.",
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
    """Helper to convert standardized English values into native vernacular phrases."""
    val_lower = english_val.lower()
    
    if "agriculture" in val_lower or "farming" in val_lower:
        return {"ta": "விவசாயம்", "ml": "കൃഷി", "hi": "कृषि / खेती", "te": "వ్యవసాయం"}.get(lang, english_val)
    if "10th" in val_lower or "class 10" in val_lower:
        return {"ta": "10-ஆம் வகுப்பு முடித்தது", "ml": "പത്താം ക്ലാസ്", "hi": "10वीं कक्षा उत्तीर्ण", "te": "10వ తరగతి"}.get(lang, english_val)
    if "12th" in val_lower or "class 12" in val_lower:
        return {"ta": "12-ஆம் வகுப்பு முடித்தது", "ml": "പന്ത്രണ്ടാം ക്ലാസ്", "hi": "12वीं कक्षा उत्तीर्ण", "te": "12వ తరగతి"}.get(lang, english_val)
    if "no formal" in val_lower or "literate" in val_lower:
        return {"ta": "பள்ளிக்கல்வி இல்லை / எழுத்தறிவு", "ml": "സ്കൂൾ വിദ്യാഭ്യാസമില്ല", "hi": "साक्षर / अनौपचारिक", "te": "అక్షరాస్యుడు"}.get(lang, english_val)
    if "self-employment" in val_lower or "own shop" in val_lower:
        return {"ta": "சுயதொழில் (சொந்த கடை / தொழில்)", "ml": "സ്വന്തം സംരംഭം / കട", "hi": "स्वरोज़गार (खुद की दुकान)", "te": "స్వయం ఉపాధి (సొంత దుకాణం)"}.get(lang, english_val)
    if "wage" in val_lower or "salary" in val_lower:
        return {"ta": "மாத ஊதிய வேலை", "ml": "മാസ ശമ്പളമുള്ള ജോലി", "hi": "मासिक वेतन वाली नौकरी", "te": "నెల జీతం ఉద్యోగం"}.get(lang, english_val)
    if "local area" in val_lower or "local enterprise" in val_lower or "local only" in val_lower:
        return {"ta": "உள்ளூர் / சொந்த ஊரில் தொழில்", "ml": "സ്വന്തം നാട്ടിൽ ജോലി", "hi": "स्थानीय क्षेत्र / गांव", "te": "స్థానిక ప్రాంతం"}.get(lang, english_val)
    if "nearby town" in val_lower or "travel" in val_lower:
        return {"ta": "அருகிலுள்ள நகரங்களுக்குச் செல்லலாம்", "ml": "അടുത്തുള്ള പട്ടണങ്ങളിൽ പോകാം", "hi": "पास के शहरों में जा सकते हैं", "te": "సమీప పట్టణాలకు వెళ్లవచ్చు"}.get(lang, english_val)
    if "market" in val_lower or "commerce" in val_lower:
        return {"ta": "உள்ளூர் கிராம சந்தை & வர்த்தகம்", "ml": "പ്രദേശിക ചന്ത & വ്യാപാരം", "hi": "स्थानीय ग्रामीण बाजार", "te": "స్థానిక సంత మరియు వ్యాపారం"}.get(lang, english_val)
    if "driving" in val_lower:
        return {"ta": "ஓட்டுநர் / வாகன இயக்கம்", "ml": "ഡ്രൈവിംഗ്", "hi": "ड्राइविंग / वाहन संचालन", "te": "డ్రైవింగ్"}.get(lang, english_val)
    if "cooking" in val_lower or "chef" in val_lower:
        return {"ta": "சமையல் மற்றும் கேட்டரிங்", "ml": "പാചകം / ഹോട്ടൽ ജോലി", "hi": "खाना बनाना / कैटरिंग", "te": "వంటకం"}.get(lang, english_val)
    if "vegetable" in val_lower:
        return {"ta": "காய்கறி விற்பனை", "ml": "பச்சക്കറി കച്ചവടം", "hi": "सब्जी विक्रेता", "te": "కూరగాయల వ్యాపారం"}.get(lang, english_val)
    if "grocery" in val_lower:
        return {"ta": "மளிகைக் கடை", "ml": "പലചരക്ക് കട", "hi": "किराना दुकान", "te": "కిరాణా దుకాణం"}.get(lang, english_val)

    return english_val


class NotificationService:
    """Manages dispatch of bilingual confirmation receipts and citizen confirmation tracking."""

    def __init__(self):
        self.twilio_account_sid = settings.twilio_account_sid
        self.twilio_auth_token = settings.twilio_auth_token
        self.twilio_phone = settings.twilio_phone_number
        self.twilio_whatsapp_number = getattr(settings, "twilio_whatsapp_number", "whatsapp:+14155238886")
        self.whatsapp_token = settings.whatsapp_api_token
        self.whatsapp_phone_id = settings.whatsapp_phone_number_id

    def build_bilingual_whatsapp_message(
        self,
        phone: str,
        language_code: str,
        case_id: str,
        confirmed_fields: Dict[str, str],
        caller_name: Optional[str] = None,
        recommended_courses: Optional[list] = None
    ) -> str:
        """Generates clean formatted WhatsApp message (zero emojis) containing Spoken + English + Top Courses."""
        lang = language_code if language_code in FIELD_LABELS else "ta"
        labels = FIELD_LABELS[lang]
        name = caller_name or "Beneficiary"

        lines = [
            f"*{labels['title']}*",
            "--------------------------------------------------",
            f"*{labels['case_id']}:* {case_id}",
            f"*{labels['beneficiary']}:* {name}",
            f"*Phone:* {phone}",
            "",
            f"*{labels['fields_header']}*",
        ]

        # Key Intake Summary (Spoken native language)
        summary_keys = [
            "educational_background", "current_livelihood", "skills_and_interests",
            "employment_preference", "mobility_constraints"
        ]
        for fn in summary_keys:
            if fn in confirmed_fields:
                eng_val = confirmed_fields[fn]
                native_val = _translate_value_to_vernacular(eng_val, lang)
                lbl = labels.get(fn, fn.replace("_", " ").title())
                lines.append(f"- *{lbl}:* {native_val}")

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
                c_name = c.get("qp_name", f"Course {i}").split("-")[0].strip()
                nsqf_lvl = c.get("nsqf_level", 3)
                lines.append(f"{i}. *{c_name}* (NSQF Level {nsqf_lvl})")

            lines.extend([
                "",
                f"*{c_prompt}*",
            ])

        cta = labels["cta"]
        lines.extend([
            "--------------------------------------------------",
            f"*{cta}*",
            "*Reply 1, 2, or 3 to select your course, or reply 'YES' to confirm.*"
        ])

        msg = "\n".join(lines)
        # Twilio WhatsApp has a strict 1600 character ceiling. Keep message under 1450 chars.
        if len(msg) > 1450:
            msg = msg[:1440] + "\n..."
        return msg

    def build_bilingual_sms_message(
        self,
        phone: str,
        language_code: str,
        case_id: str,
        confirmed_fields: Dict[str, str],
        caller_name: Optional[str] = None,
        recommended_courses: Optional[list] = None
    ) -> str:
        """
        Generates cleanly aligned, professional SMS with zero emojis.
        Properly aligned with line breaks for mobile screens and readable course names.
        """
        cid = (case_id or "N/A")[:8]
        courses = recommended_courses or []
        
        lines = [f"PM-AJAY Ref: {cid}", ""]
        if courses and len(courses) >= 2:
            lines.append("Recommended Courses:")
            for idx, c in enumerate(courses[:3], 1):
                name = c.get("qp_name", f"Course {idx}").split("-")[0].strip()
                if len(name) > 38:
                    name = name[:36].rstrip() + "..."
                lines.append(f"{idx}. {name}")
            lines.append("")
            options_str = "1, 2, or 3" if len(courses) >= 3 else "1 or 2"
            lines.append(f"Reply {options_str} to choose your course, or reply YES to confirm.")
        else:
            edu = confirmed_fields.get("educational_background", "Recorded")[:30]
            job = confirmed_fields.get("employment_preference", confirmed_fields.get("current_livelihood", "Recorded"))[:30]
            lines.append("Profile Details:")
            lines.append(f"- Education: {edu}")
            lines.append(f"- Preference: {job}")
            lines.append("")
            lines.append("Reply YES to confirm your application.")

        return "\n".join(lines)

    async def dispatch_bilingual_confirmation(
        self,
        phone: str,
        language_code: str,
        case_id: str,
        confirmed_fields: Dict[str, str],
        caller_name: Optional[str] = None,
        recommended_courses: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches bilingual confirmation through BOTH WhatsApp and SMS concurrently.
        Includes top 3 recommended courses and prompts citizen for input.
        """
        target_phone = phone.strip()
        if not target_phone.startswith("+"):
            target_phone = f"+91{target_phone}" if len(target_phone) == 10 else f"+{target_phone}"

        wa_text = self.build_bilingual_whatsapp_message(
            target_phone, language_code, case_id, confirmed_fields, caller_name, recommended_courses
        )
        sms_text = self.build_bilingual_sms_message(
            target_phone, language_code, case_id, confirmed_fields, caller_name, recommended_courses
        )

        wa_from = self.twilio_whatsapp_number
        if not wa_from.startswith("whatsapp:"):
            wa_from = f"whatsapp:{wa_from}"

        # Concurrently dispatch WhatsApp and SMS so failure in one never delays or blocks the other
        wa_task = self._send_twilio_message(
            to_number=f"whatsapp:{target_phone}",
            from_number=wa_from,
            body=wa_text
        )
        sms_task = self._send_twilio_message(
            to_number=target_phone,
            from_number=self.twilio_phone,
            body=sms_text
        )

        results_list = await asyncio.gather(wa_task, sms_task, return_exceptions=True)
        wa_res = results_list[0] if not isinstance(results_list[0], Exception) else f"EXC:{results_list[0]}"
        sms_res = results_list[1] if not isinstance(results_list[1], Exception) else f"EXC:{results_list[1]}"

        results = {"whatsapp": str(wa_res), "sms": str(sms_res)}
        logger.info(f"Dispatched bilingual confirmations to {target_phone} (Case {case_id}): {results}")
        return results

    async def _send_twilio_message(self, to_number: str, from_number: str, body: str) -> str:
        """Sends an SMS or WhatsApp message via Twilio REST API using resilient urllib in a thread pool."""
        if not self.twilio_account_sid or not self.twilio_auth_token or "dummy" in self.twilio_account_sid.lower():
            logger.info(f"[SIMULATED DISPATCH] To: {to_number} | Body preview: {body[:60]}...")
            return "SIMULATED_SENT"

        def _sync_twilio_post():
            import urllib.request
            import urllib.parse
            import json

            api_url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json"
            credentials = f"{self.twilio_account_sid}:{self.twilio_auth_token}"
            auth_header = f"Basic {base64.b64encode(credentials.encode('utf-8')).decode('utf-8')}"

            payload = urllib.parse.urlencode({
                "To": to_number,
                "From": from_number,
                "Body": body,
            }).encode("utf-8")

            req = urllib.request.Request(api_url, data=payload, method="POST")
            req.add_header("Authorization", auth_header)
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
            req.add_header("Connection", "close")
            req.add_header("User-Agent", "KuralSevi/1.0")

            last_err = ""
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(req, timeout=12.0) as resp:
                        resp_data = json.loads(resp.read().decode("utf-8"))
                        sid = resp_data.get("sid", "unknown")
                        logger.info(f"Twilio message successfully queued for {to_number} (SID: {sid})")
                        return f"SENT:{sid}"
                except urllib.error.HTTPError as e:
                    err_body = e.read().decode("utf-8", errors="replace")
                    try:
                        err_json = json.loads(err_body)
                        code = err_json.get("code", e.code)
                        msg = err_json.get("message", "")
                        logger.warning(f"Twilio API error {code} sending to {to_number}: {msg}")
                        return f"FAILED:{code}"
                    except Exception:
                        return f"FAILED:{e.code}"
                except Exception as ex:
                    last_err = str(ex)
                    logger.warning(f"Twilio attempt {attempt + 1} to {to_number} failed ({last_err}), retrying...")
                    import time
                    time.sleep(1.0 * (attempt + 1))

            return f"ERROR:{last_err[:40]}"

        return await asyncio.to_thread(_sync_twilio_post)
