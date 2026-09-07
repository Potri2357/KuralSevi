"""
Kural Sevi — Omnichannel Citizen Notification Service
Dispatches post-call bilingual confirmation receipts (Spoken Language + Official English)
via both WhatsApp (rich card format) and SMS (accessible feature phone text).
Enables the citizen two-way confirmation feedback loop.
"""
import logging
import base64
import urllib.parse
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import httpx

from config import settings

logger = logging.getLogger(__name__)

# Native Field Labels across supported languages
FIELD_LABELS = {
    "ta": {
        "title": "🏛️ PM-AJAY அரசு நலத்திட்ட பதிவு ரசீது",
        "beneficiary": "விண்ணப்பதாரர்",
        "case_id": "விண்ணப்ப எண் (Case ID)",
        "fields_header": "📋 பதிவு செய்யப்பட்ட விவரங்கள் (Tamil Summary):",
        "educational_background": "கல்வித் தகுதி",
        "family_occupation": "குடும்பத் தொழில்",
        "current_livelihood": "தற்போதைய வேலை",
        "skills_and_interests": "தொழில் ஆர்வம் & திறன்",
        "mobility_constraints": "வேலை பயண வரம்பு",
        "employment_preference": "வேலை விருப்பம்",
        "local_economic_context": "உள்ளூர் வர்த்தக சூழல்",
        "cta": "இவ்விவரங்கள் சரியென்றால் 'YES' என பதிலளிக்கவும். மாற்றங்கள் தேவைப்பட்டால் உங்கள் ஊராட்சி அலுவலரை தொடர்பு கொள்ளவும்.",
        "ack": "நன்றி! உங்கள் PM-AJAY விண்ணப்ப விவரங்கள் உறுதிப்படுத்தப்பட்டன. மாவட்ட நல அலுவலர் உங்களை விரைவில் தொடர்புகொள்வார்.",
    },
    "ml": {
        "title": "🏛️ PM-AJAY ക്ഷേമ പദ്ധതി അപേക്ഷ രസീത്",
        "beneficiary": "ഗുണഭോക്താവ്",
        "case_id": "കേസ് ഐഡി (Case ID)",
        "fields_header": "📋 രേഖപ്പെടുത്തിയ വിവരങ്ങൾ (Malayalam Summary):",
        "educational_background": "വിദ്യാഭ്യാസം",
        "family_occupation": "കുടുംബ തൊഴിൽ",
        "current_livelihood": "ഇപ്പോഴത്തെ ജോലി",
        "skills_and_interests": "തൊഴിൽ നൈപുണ്യം",
        "mobility_constraints": "യാത്രാ പരിധി",
        "employment_preference": "തൊഴിൽ മുൻഗണന",
        "local_economic_context": "പ്രദേശിക വിപണി",
        "cta": "വിവരങ്ങൾ ശരിയാണെങ്കിൽ 'YES' എന്ന് മറുപടി നൽകുക. മാറ്റങ്ങൾ ഉണ്ടെങ്കിൽ ഉദ്യോഗസ്ഥനെ ബന്ധപ്പെടുക.",
        "ack": "നന്ദി! താങ്കളുടെ PM-AJAY അപേക്ഷ വിജയകരമായി സ്ഥിരീകരിച്ചു. ജില്ലാ ഉദ്യോഗസ്ഥൻ ഉടൻ ബന്ധപ്പെടും.",
    },
    "hi": {
        "title": "🏛️ PM-AJAY कल्याणकारी योजना आवेदन रसीद",
        "beneficiary": "लाभार्थी",
        "case_id": "आवेदन संख्या (Case ID)",
        "fields_header": "📋 दर्ज किया गया विवरण (Hindi Summary):",
        "educational_background": "शैक्षिक योग्यता",
        "family_occupation": "पारिवारिक व्यवसाय",
        "current_livelihood": "वर्तमान कार्य",
        "skills_and_interests": "कौशल और रुचि",
        "mobility_constraints": "कार्य क्षेत्र सीमा",
        "employment_preference": "रोज़गार प्राथमिकता",
        "local_economic_context": "स्थानीय बाजार",
        "cta": "यदि यह विवरण सही है तो 'YES' लिखकर भेजें। सुधार के लिए अपने ग्राम अधिकारी से संपर्क करें।",
        "ack": "धन्यवाद! आपका PM-AJAY आवेदन सफलतापूर्वक सत्यापित कर दिया गया है। जिला अधिकारी जल्द संपर्क करेंगे।",
    },
    "te": {
        "title": "🏛️ PM-AJAY సంక్షేమ పథకం దరఖాస్తు రశీదు",
        "beneficiary": "లబ్ధిదారుడు",
        "case_id": "దరఖాస్తు సంఖ్య (Case ID)",
        "fields_header": "📋 నమోదు చేయబడిన వివరాలు (Telugu Summary):",
        "educational_background": "చదువు",
        "family_occupation": "కుటుంబ వృత్తి",
        "current_livelihood": "ప్రస్తుత పని",
        "skills_and_interests": "నైపుణ్యం & ఆసక్తి",
        "mobility_constraints": "ప్రయాణ పరిధి",
        "employment_preference": "ఉపాధి ప్రాధాన్యత",
        "local_economic_context": "స్థానిక మార్కెట్",
        "cta": "ఈ వివరాలు సరైనవయితే 'YES' అని సమాధానం ఇవ్వండి. మార్పుల కోసం అధికారిని సంప్రదించండి.",
        "ack": "ధన్యవాదాలు! మీ PM-AJAY దరఖాస్తు విజయవంతంగా నిర్ధారించబడింది. జిల్లా సంక్షేమ అధికారి త్వరలో సంప్రదిస్తారు.",
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
        return {"ta": "காய்கறி விற்பனை", "ml": "പച്ചക്കറി കച്ചവടം", "hi": "सब्जी विक्रेता", "te": "కూరగాయల వ్యాపారం"}.get(lang, english_val)
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
        caller_name: Optional[str] = None
    ) -> str:
        """Generates rich-formatted WhatsApp message containing Spoken + English sections."""
        lang = language_code if language_code in FIELD_LABELS else "ta"
        labels = FIELD_LABELS[lang]
        name = caller_name or "Beneficiary"

        lines = [
            f"*{labels['title']}*",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"🆔 *{labels['case_id']}:* `{case_id}`",
            f"👤 *{labels['beneficiary']}:* {name}",
            f"📞 *Phone:* {phone}",
            "",
            f"*{labels['fields_header']}*",
        ]

        # 1. Native Spoken Language Section
        for fn in [
            "educational_background", "family_occupation", "current_livelihood",
            "skills_and_interests", "mobility_constraints", "employment_preference",
            "local_economic_context"
        ]:
            if fn in confirmed_fields:
                eng_val = confirmed_fields[fn]
                native_val = _translate_value_to_vernacular(eng_val, lang)
                lbl = labels.get(fn, fn.replace("_", " ").title())
                lines.append(f"• *{lbl}:* {native_val}")

        lines.extend([
            "",
            "*📄 Official Administrative Record (English):*",
        ])

        # 2. Administrative English Section
        for fn in [
            "educational_background", "family_occupation", "current_livelihood",
            "skills_and_interests", "mobility_constraints", "employment_preference",
            "local_economic_context"
        ]:
            if fn in confirmed_fields:
                eng_lbl = ENGLISH_FIELD_LABELS.get(fn, fn.replace("_", " ").title())
                lines.append(f"• *{eng_lbl}:* {confirmed_fields[fn]}")

        lines.extend([
            "• *Application Status:* SUBMITTED FOR DISTRICT OFFICER VERIFICATION",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            f"👉 *{labels['cta']}*",
            "👉 *Reply 'YES' to confirm this application.*"
        ])

        return "\n".join(lines)

    def build_bilingual_sms_message(
        self,
        phone: str,
        language_code: str,
        case_id: str,
        confirmed_fields: Dict[str, str],
        caller_name: Optional[str] = None
    ) -> str:
        """
        Generates concise single-segment SMS (<160 chars) compatible with Twilio trial accounts
        and Indian telecom DLT regulation limits. Prevents Twilio error 30044 (length exceeded).
        """
        cid = (case_id or "N/A")[:8]
        edu = confirmed_fields.get("educational_background", "Recorded")[:14]
        job = confirmed_fields.get("employment_preference", confirmed_fields.get("current_livelihood", "Recorded"))[:14]

        # Dual confirmation prompt (English + Romanized Vernacular) fitting in single 160-char GSM segment
        vernacular_confirm = {
            "ta": "Seriyenral YES ena reply seiyyavum",
            "ml": "Sariyaanenkil YES ennu reply cheyyuka",
            "hi": "Sahi hai toh YES likhkar bhejein",
            "te": "Sarinainacho YES ani reply ivvandi",
        }.get(language_code, "Reply YES to confirm")

        msg = f"PM-AJAY Ref:{cid} Edu:{edu} Job:{job}. {vernacular_confirm} / Reply YES to confirm."
        if len(msg) > 155:
            msg = msg[:152] + "..."
        return msg

    async def dispatch_bilingual_confirmation(
        self,
        phone: str,
        language_code: str,
        case_id: str,
        confirmed_fields: Dict[str, str],
        caller_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Dispatches bilingual confirmation through BOTH WhatsApp and SMS asynchronously.
        Guarantees zero interruption to the phone call.
        """
        results = {"whatsapp": "SKIPPED", "sms": "SKIPPED"}
        target_phone = phone.strip()
        if not target_phone.startswith("+"):
            target_phone = f"+91{target_phone}" if len(target_phone) == 10 else f"+{target_phone}"

        wa_text = self.build_bilingual_whatsapp_message(target_phone, language_code, case_id, confirmed_fields, caller_name)
        sms_text = self.build_bilingual_sms_message(target_phone, language_code, case_id, confirmed_fields, caller_name)

        # 1. Dispatch WhatsApp (Twilio WhatsApp Sandbox or Production Number)
        wa_from = self.twilio_whatsapp_number
        if not wa_from.startswith("whatsapp:"):
            wa_from = f"whatsapp:{wa_from}"

        results["whatsapp"] = await self._send_twilio_message(
            to_number=f"whatsapp:{target_phone}",
            from_number=wa_from,
            body=wa_text
        )

        # 2. Dispatch SMS (Twilio Programmable SMS)
        results["sms"] = await self._send_twilio_message(
            to_number=target_phone,
            from_number=self.twilio_phone,
            body=sms_text
        )

        logger.info(f"Dispatched bilingual confirmations to {target_phone} (Case {case_id}): {results}")
        return results

    async def _send_twilio_message(self, to_number: str, from_number: str, body: str) -> str:
        """Sends an SMS or WhatsApp message via Twilio REST API with robust error reporting."""
        if not self.twilio_account_sid or not self.twilio_auth_token or "dummy" in self.twilio_account_sid.lower():
            logger.info(f"[SIMULATED DISPATCH] To: {to_number} | Body preview: {body[:60]}...")
            return "SIMULATED_SENT"

        api_url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_account_sid}/Messages.json"
        credentials = f"{self.twilio_account_sid}:{self.twilio_auth_token}"
        auth_header = f"Basic {base64.b64encode(credentials.encode('utf-8')).decode('utf-8')}"

        payload = {
            "To": to_number,
            "From": from_number,
            "Body": body,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    api_url,
                    headers={
                        "Authorization": auth_header,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    data=payload,
                )
                if resp.status_code in (200, 201):
                    msg_data = resp.json()
                    logger.info(f"Twilio message sent successfully to {to_number} (SID: {msg_data.get('sid')})")
                    return f"SENT:{msg_data.get('sid')}"
                else:
                    err_info = ""
                    try:
                        err_json = resp.json()
                        err_code = err_json.get("code")
                        err_info = f":{err_code}" if err_code else f":{resp.status_code}"
                    except Exception:
                        err_info = f":{resp.status_code}"
                    logger.warning(f"Twilio API responded with status {resp.status_code} for {to_number}: {resp.text[:140]}")
                    return f"FAILED{err_info}"
        except Exception as e:
            logger.error(f"Failed to dispatch Twilio message to {to_number}: {e}")
            return f"ERROR:{str(e)[:30]}"
