"""
Kural Sevi — Interview Coordinator
Application Service / Clean Architecture Boundary:
Coordinates the conversational interview workflow across all channels (IVR, WhatsApp, Field-worker).
Routers are thin protocol adapters; this service handles the business orchestration.
All responses are natively voiced in regional languages (Tamil, Malayalam, Hindi, Telugu) with instant (< 1ms)
response turnaround on IVR calls by leveraging pre-rendered studio audio, semantic multi-field inference,
and asynchronous LLM enrichment.
"""
import os
import io
import time
import wave
import json
import asyncio
import logging
from dataclasses import dataclass
from typing import Optional, Tuple, Dict
from datetime import datetime, timezone
from pathlib import Path

from .session_manager import SessionManager
from .llm_service import GeminiInterviewDriver, LLMExtractionResult
from .interview_fsm import InterviewFSM, InterviewSession, InterviewState, PS_FIELDS_ORDER
from .tts_service import synthesize_speech, TTSResult
from .field_normalizer import normalize_field_to_english, has_indic_characters
from .notification_service import NotificationService, FIELD_LABELS
from prompts.interview_system_prompt import CONSENT_SCRIPTS, WRAP_UP_SCRIPTS, REFUSAL_SCRIPTS
from config import settings

logger = logging.getLogger(__name__)

_STATIC_AUDIO_DIR = Path(__file__).resolve().parent.parent / "static_audio"
_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_DATA_DIR.mkdir(parents=True, exist_ok=True)
_PERSISTENCE_FILE = _DATA_DIR / "completed_calls.json"

def _load_persisted_records() -> list[dict]:
    if _PERSISTENCE_FILE.exists():
        try:
            return json.loads(_PERSISTENCE_FILE.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning(f"Failed to load persisted records: {e}")
    return []

def _save_persisted_records():
    try:
        _PERSISTENCE_FILE.write_text(json.dumps(_completed_calls_records, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as e:
        logger.warning(f"Failed to persist call records: {e}")

# Registry of completed and active call records for dashboard/telephony logs
_completed_calls_records: list[dict] = _load_persisted_records()

def get_completed_calls_records() -> list[dict]:
    sanitized = []
    for r in _completed_calls_records:
        r_copy = dict(r)
        c_fields = dict(r.get("confirmed_fields", {}))
        lang = r.get("language", "ta")
        r_copy["confirmed_fields"] = {
            k: normalize_field_to_english(k, str(v), lang)
            for k, v in c_fields.items()
        }
        sanitized.append(r_copy)
    return sanitized

CATALOG_COURSES = [
    {
        "rank": 1,
        "qp_code": "LSS/Q2301",
        "qp_name": "Footwear & Leather Goods Specialist / Shopkeeper",
        "ta_name": "தோல் மற்றும் காலணி தயாரிப்பு பயிற்சி",
        "hi_name": "चमड़ा और जूता निर्माण प्रशिक्षण",
        "ml_name": "ലെതർ, പാദരക്ഷാ നിർമ്മാണ പരിശീലനം",
        "te_name": "పాదరక్షలు మరియు లెదర్ వస్తువుల తయారీ శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["செருப்பு", "பாதணி", "தோல்", "சப்பல்", "காலணி", "footwear", "shoe", "shoes", "chappal", "leather", "जूता", "चप्पल", "பாதரக்ஷలు"],
        "duration_hours": 240,
    },
    {
        "rank": 2,
        "qp_code": "AGR/Q4301",
        "qp_name": "Small Poultry Farmer & Meat Retailer",
        "ta_name": "கோழிப்பண்ணை மற்றும் இறைச்சி விற்பனை பயிற்சி",
        "hi_name": "मुर्गी पालन और पोल्ट्री व्यवसाय प्रशिक्षण",
        "ml_name": "കോഴി വളർത്തൽ പരിശീലനം",
        "te_name": "కోళ్ల పెంపకం మరియు వ్యాపార శిక్షణ",
        "nsqf_level": 3,
        "keywords": ["poultry", "farmer", "chicken", "farm", "கோழி", "பண்ணை", "கோழிப்பண்ணை", "முட்டை", "broiler", "விவசாயம்", "முட்டை"],
        "duration_hours": 160,
    },
    {
        "rank": 3,
        "qp_code": "RAS/Q0104",
        "qp_name": "Retail Sales Associate / Shopkeeper",
        "ta_name": "மளிகை மற்றும் சில்லறை விற்பனைக் கடை பயிற்சி",
        "hi_name": "किराना दुकान और खुदरा बिक्री प्रशिक्षण",
        "ml_name": "റീട്ടെയിൽ വിൽപന, പലചരക്ക് കട പരിശീലനം",
        "te_name": "కిరాణా దుకాణం మరియు రిటైల్ అమ్మకాల శిక్షణ",
        "nsqf_level": 3,
        "keywords": ["retail", "shop", "grocery", "store", "vendor", "மளிகை", "கடை", "வியாபாரம்", "kirana", "மல்லிகை", "கடைக்காரர்"],
        "duration_hours": 120,
    },
    {
        "rank": 4,
        "qp_code": "AGR/Q4101",
        "qp_name": "Dairy Farmer & Milk Processing Operator",
        "ta_name": "கால்நடை வளர்ப்பு மற்றும் பால் பண்ணை பயிற்சி",
        "hi_name": "डेयरी फार्मिंग और दुग्ध व्यवसाय प्रशिक्षण",
        "ml_name": "ക്ഷീരകർഷക, പാൽ സംസ്കരണ പരിശീലനം",
        "te_name": "పాడి పరిశ్రమ మరియు పాల వ్యాపార శిక్షణ",
        "nsqf_level": 3,
        "keywords": ["பால்", "மாடு", "ஆடு", "dairy", "milk", "cattle", "பண்ணை", "கறவை"],
        "duration_hours": 150,
    },
    {
        "rank": 5,
        "qp_code": "APP/Q0301",
        "qp_name": "Tailor - Garment Construction",
        "ta_name": "தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி",
        "hi_name": "सिलाई और वस्त्र निर्माण प्रशिक्षण",
        "ml_name": "ടെയ്‌ലറിംഗ്, വസ്ത്ര നിർമ്മാണ പരിശീലനം",
        "te_name": "టైలరింగ్ మరియు దుస్తుల తయారీ శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["tailor", "stitching", "garment", "sewing", "தையல்", "ஆடை", "துணி", "dress"],
        "duration_hours": 300,
    },
    {
        "rank": 6,
        "qp_code": "ASC/Q1401",
        "qp_name": "Automotive Service Technician (Two-Wheeler)",
        "ta_name": "டூவீலர் மெக்கானிக் பயிற்சி",
        "hi_name": "दोपहिया वाहन मैकेनिक प्रशिक्षण",
        "ml_name": "ടൂവീലർ മെക്കാനിക്ക് പരിശീലനം",
        "te_name": "టూవీలర్ మెకానిక్ శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["mechanic", "bike", "auto", "மெக்கானிக்", "பைக்", "வண்டி", "டூவீலர்", "workshop"],
        "duration_hours": 240,
    },
    {
        "rank": 7,
        "qp_code": "BWS/Q0201",
        "qp_name": "Beauty Therapist & Salon Stylist",
        "ta_name": "அழகுக்கலை மற்றும் சலூன் பயிற்சி",
        "hi_name": "ब्यूटी पार्लर और सैलून प्रशिक्षण",
        "ml_name": "ബ്യൂട്ടി പാർലർ, സലൂൺ പരിശീലനം",
        "te_name": "బ్యూటీ పార్లర్ మరియు సెలూన్ శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["beauty", "parlour", "salon", "therapy", "makeup", "அழகு", "சலூன்", "skin"],
        "duration_hours": 300,
    },
    {
        "rank": 8,
        "qp_code": "ELE/Q3104",
        "qp_name": "Field Technician - Home Appliances & Wiring",
        "ta_name": "வீட்டு உபயோக மின்சாதனங்கள் பழுதுநீக்கும் பயிற்சி",
        "hi_name": "घरेलू बिजली उपकरण मरम्मत प्रशिक्षण",
        "ml_name": "ഇലക്ട്രിക്കൽ റിപ്പയറിംഗ് പരിശീലനം",
        "te_name": "గృహోపకరణాల ఎలక్ట్రికల్ మరమ్మతు శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["electric", "appliance", "technician", "repair", "motor", "மின்சாரம்", "mechanic", "வயரிங்"],
        "duration_hours": 240,
    },
    {
        "rank": 9,
        "qp_code": "FIC/Q0201",
        "qp_name": "Food Catering & Pickle Making Technician",
        "ta_name": "உணவு தயாரிப்பு மற்றும் கேட்டரிங் பயிற்சி",
        "hi_name": "खाद्य प्रसंस्करण और कैटरिंग प्रशिक्षण",
        "ml_name": "ഭക്ഷണ നിർമ്മാണവും കാറ്ററിംഗും",
        "te_name": "ఫుడ్ కేటరింగ్ మరియు పచ్చళ్ల తయారీ శిక్షణ",
        "nsqf_level": 3,
        "keywords": ["food", "pickle", "cooking", "catering", "உணவு", "ஊறுகாய்", "சமையல்", "ஹோட்டல்", "சாப்பாடு"],
        "duration_hours": 150,
    },
    {
        "rank": 10,
        "qp_code": "MEP/Q0101",
        "qp_name": "Micro-Enterprise & Rural Store Operator",
        "ta_name": "கிராமப்புற சிறுதொழில் மற்றும் சுயதொழில் பயிற்சி",
        "hi_name": "ग्रामीण लघु उद्योग और स्वरोजगार प्रशिक्षण",
        "ml_name": "ചെറുകിട സംരംഭവും സ്വയംതൊഴിലും",
        "te_name": "చిన్న వ్యాపారం మరియు స్వయం ఉపాధి శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["business", "enterprise", "தொழில்", "சொந்த", "வியாபாரம்", "பிசினஸ்", "முதலீடு"],
        "duration_hours": 180,
    },
]

def get_localized_course_name(course: dict, lang: str = "ta") -> str:
    """Returns the natural conversational course name for the given language."""
    key = f"{lang}_name"
    if key in course and course[key]:
        return course[key]
    return course.get("ta_name") or course.get("qp_name", "பயிற்சி").split("-")[0].strip()

def compute_top_recommended_courses(confirmed_fields: dict, transcript: Optional[list] = None) -> list[dict]:
    """Scores NSQF trade catalog against citizen profile fields AND full conversation transcript for genuine personalized recommendations."""
    parts = [str(v).lower() for v in confirmed_fields.values()]
    if transcript:
        for t in transcript:
            if isinstance(t, dict):
                user_say = t.get("user") or ""
                if user_say:
                    parts.append(user_say.lower())
    text_corpus = " ".join(parts)
    
    scored = []
    for c in CATALOG_COURSES:
        score = 0
        for kw in c["keywords"]:
            if kw.lower() in text_corpus:
                score += 10
        scored.append((score, c))
    
    # Sort descending by score, maintaining catalog order as secondary key
    scored.sort(key=lambda x: x[0], reverse=True)
    top3 = [dict(x[1]) for x in scored[:3]]
    for idx, item in enumerate(top3, 1):
        item["rank"] = idx
    return top3

def confirm_case_from_citizen(phone: str, channel: str = "SMS", reply_text: str = "") -> Optional[dict]:
    """
    Two-way feedback loop: Promotes a completed case to BENEFICIARY_CONFIRMED
    when the citizen replies YES / சரி / அல்லது 1, 2, 3 via SMS or WhatsApp.
    Captures citizen's selected course preference if 1, 2, or 3 is provided.
    """
    clean_phone = phone.replace("whatsapp:", "").strip()
    clean_digits = "".join(c for c in clean_phone if c.isdigit())
    text_lower = (reply_text or "").lower().strip()
    
    for rec in reversed(_completed_calls_records):
        rec_phone = rec.get("phone", "").replace("whatsapp:", "").strip()
        rec_digits = "".join(c for c in rec_phone if c.isdigit())
        
        # Match by full phone or last 10 digits
        if rec_digits == clean_digits or (len(clean_digits) >= 10 and rec_digits.endswith(clean_digits[-10:])) or (len(rec_digits) >= 10 and clean_digits.endswith(rec_digits[-10:])):
            rec["status"] = "BENEFICIARY_CONFIRMED"
            rec["citizen_confirmed"] = True
            rec["confirmed_via"] = channel.upper()
            rec["confirmed_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            # Determine citizen course choice (1, 2, 3 or default top course)
            choice_num = 1
            if "3" in text_lower or "three" in text_lower or "மூன்று" in text_lower:
                choice_num = 3
            elif "2" in text_lower or "two" in text_lower or "இரண்டு" in text_lower:
                choice_num = 2
            elif "1" in text_lower or "one" in text_lower or "ஒன்று" in text_lower:
                choice_num = 1

            courses = rec.get("recommended_courses") or compute_top_recommended_courses(rec.get("confirmed_fields", {}))
            selected_course = courses[choice_num - 1]["qp_name"] if len(courses) >= choice_num else "NSQF Vocational Track"
            
            rec["citizen_selected_choice"] = choice_num
            rec["citizen_selected_course"] = selected_course
            rec["recommended_courses"] = courses

            _save_persisted_records()
            logger.info(f"Case {rec.get('case_id')} marked as BENEFICIARY_CONFIRMED (Choice {choice_num}: {selected_course}) via {channel} by {phone}")
            return rec
    return None

def clear_completed_calls_records():
    """Erases all completed call records from memory and disk for fresh start."""
    global _completed_calls_records
    _completed_calls_records = []
    _save_persisted_records()
    logger.info("Erased all completed call records.")

@dataclass
class CoordinatorTurnResult:
    session_id: str
    spoken_response: str
    audio_bytes: Optional[bytes]
    state: InterviewState
    is_completed: bool
    case_id: Optional[str]
    current_field: Optional[str]
    language_code: str = "ta"

# In-memory pre-loaded audio assets for instantaneous zero-latency assembly
_PRELOADED_AUDIO: Dict[str, Tuple[wave._wave_params, bytes]] = {}
_PRELOADED_BYTES: Dict[str, bytes] = {}

def _init_static_audio():
    global _PRELOADED_AUDIO, _PRELOADED_BYTES
    if not _STATIC_AUDIO_DIR.exists():
        return
    for wav_path in _STATIC_AUDIO_DIR.rglob("*.wav"):
        try:
            raw = wav_path.read_bytes()
            _PRELOADED_BYTES[wav_path.name] = raw
            with wave.open(str(wav_path), "rb") as w:
                _PRELOADED_AUDIO[wav_path.name] = (w.getparams(), w.readframes(w.getnframes()))
        except Exception as e:
            logger.warning(f"Failed to preload {wav_path.name}: {e}")

_init_static_audio()

def _get_static_bytes(filename: str) -> Optional[bytes]:
    if not filename:
        return None
    if filename in _PRELOADED_BYTES:
        return _PRELOADED_BYTES[filename]
    for p in [_STATIC_AUDIO_DIR / filename, _STATIC_AUDIO_DIR / "variations" / filename]:
        if p.exists():
            try:
                data = p.read_bytes()
                _PRELOADED_BYTES[filename] = data
                return data
            except Exception:
                pass
    return None

def _infer_semantic_fields_fast(user_speech: str, language_code: str) -> Dict[str, str]:
    """
    Fast semantic helper across rural livelihood domains.
    Provides candidate mappings without prematurely completing unasked questions.
    """
    text = (user_speech or "").lower().strip()
    extracted = {}

    # Farming / Agriculture
    farming_tokens = [
        "விவசாய", "விவசாயம்", "காடு", "பயிர்", "நிலம்", "மாடு", "கழனி", "விவசாய கூலி",
        "കൃഷി", "കർഷക", "പാടം", "പശു", "തോട്ടം",
        "खेती", "किसान", "कृषि", "फसल", "खेत", "मजदूरी",
        "వ్యవసాయం", "రైతు", "పొలం", "కూలి", "పంట"
    ]
    if any(k in text for k in farming_tokens):
        extracted["family_occupation"] = "Agriculture / Farming"

    # Poultry
    poultry_tokens = ["கோழி", "பண்ணை", "கோழிப்பண்ணை", "முட்டை", "broiler", "poultry", "chicken", "farm"]
    if any(k in text for k in poultry_tokens):
        extracted["skills_and_interests"] = "Small Poultry Farming"

    # Weaving / Handloom
    weaving_tokens = ["நெசவு", "கைத்தறி", "చేనేత", "మగ్గం", "बुनकर", "हथकरघा", "നെയ്ത്ത്"]
    if any(k in text for k in weaving_tokens):
        extracted["family_occupation"] = "Weaving / Handloom"

    # Cooking / Catering / Hotel
    cooking_tokens = [
        "பிரியாணி", "சமையல்", "ஹோட்டல்", "சாப்பாடு", "மாஸ்டர்", "கேட்டரிங்",
        "പാചക", "ബിരിയാണി", "ഹോട്ടൽ", "खाना", "होटल", "रसोई", "వంట"
    ]
    if any(k in text for k in cooking_tokens):
        extracted["skills_and_interests"] = "Cooking & Catering"

    # Footwear / Leather Goods
    footwear_tokens = ["செருப்பு", "பாதணி", "சப்பல்", "காலணி", "தோல்", "footwear", "chappal", "shoe", "leather", "shoes", "जूता", "चप्पल", "పాదరక్షలు"]
    if any(k in text for k in footwear_tokens):
        extracted["skills_and_interests"] = "Footwear & Leather Goods Specialist"

    # Grocery / Kirana
    grocery_tokens = ["மளிகை", "கிராணா", "किराना", "కిరాణా", "പലചരക്ക്"]
    if any(k in text for k in grocery_tokens):
        extracted["skills_and_interests"] = "Grocery Store / Retail Trade"

    return extracted

def _get_question_for_field(next_field: str, user_speech: str, session: InterviewSession) -> Tuple[str, str]:
    """
    Selects warm, non-monotonous, appreciative question audio for all supported languages.
    Provides clear conversational reasons for questions asked so beneficiaries never feel
    subjected to repetitive questioning.
    """
    user_lower = (user_speech or "").lower()
    turn_count = getattr(session, "turn_count", 0)
    use_v2 = (turn_count % 2 == 1)
    lang = getattr(session, "language_code", "ta")

    # ── Malayalam Flow (ml) ─────────────────────────────────────────────────────
    if lang == "ml":
        if next_field == "educational_background":
            if use_v2:
                return "q2_education_v2_ml.wav", "നന്നായി! സ്കൂൾ വിദ്യാഭ്യാസം എത്രത്തോളം ഉണ്ടെന്ന് പറയാമോ?"
            return "q2_education_v1_ml.wav", "വളരെ സന്തോഷം! നിങ്ങളുടെ വിദ്യാഭ്യാസം എന്താണ്, സ്കൂളിൽ പോയിട്ടുണ്ടോ?"

        elif next_field == "family_occupation":
            if use_v2:
                return "q3_family_occ_v2_ml.wav", "ശരി! നിങ്ങളുടെ കുടുംബത്തിന്റെ പ്രധാന തൊഴിൽ എന്താണ്?"
            return "q3_family_occ_v1_ml.wav", "വളരെ നല്ലത്! നിങ്ങളുടെ കുടുംബത്തിൽ സാധാരണയായി എന്തൊക്കെ ജോലികളാണ് ചെയ്യുന്നത്?"

        elif next_field == "current_livelihood":
            is_farming = any(k in user_lower for k in ["കൃഷി", "കർഷക", "പാടം", "നിലം", "പശു", "തോട്ടം"])
            if is_farming:
                return "q4_current_work_farming_ml.wav", "കൃഷി ചെയ്യുന്നത് വളരെ വലിയൊരു കാര്യമാണ്! ഇപ്പോൾ പ്രധാനമായും എന്തൊക്കെ ജോലികളാണ് ചെയ്യുന്നത്?"
            return "q4_current_work_gen_ml.wav", "അഭിനന്ദനങ്ങൾ! ഇപ്പോൾ നിങ്ങളുടെ വരുമാനത്തിനായി എന്തൊക്കെ ജോലികളാണ് ചെയ്യുന്നത്?"

        elif next_field == "skills_and_interests":
            if use_v2:
                return "q5_skills_v2_ml.wav", "വളരെ സന്തോഷം! സ്വന്തമായി ചെയ്യാൻ എന്തൊക്കെ ജോലികൾ പഠിച്ചിട്ടുണ്ട്?"
            return "q5_skills_v1_ml.wav", "നന്നായി! നിങ്ങൾക്ക് എന്തൊക്കെ തൊഴിൽ നൈപുണ്യങ്ങളും താൽപ്പര്യങ്ങളുമാണ് ഉള്ളത്?"

        elif next_field == "mobility_constraints":
            is_cooking = any(k in user_lower for k in ["പാചക", "ബിരിയാണി", "ഹോട്ടൽ", "ഷെഫ്", "ഭക്ഷണ"])
            is_driving = any(k in user_lower for k in ["ഡ്രൈവർ", "വണ്ടി", "ഓട്ടോ", "കാർ", "ലോറി"])
            if is_cooking:
                return "q6_mobility_cooking_ml.wav", "നന്നായി, പാചക കല വലിയൊരു വരദാനമാണ്! ജോലിക്കായി അടുത്തുള്ള സ്ഥലങ്ങളിലേക്ക് യാത്ര ചെയ്യാൻ സാധിക്കുമോ?"
            elif is_driving:
                return "q6_mobility_driving_ml.wav", "ഡ്രൈവിംഗ് മികച്ചൊരു തൊഴിലാണ്! ജോലിക്കായി പുറത്തേക്ക് പോകാൻ സാധിക്കുമോ?"
            return "q6_mobility_gen_ml.wav", "ശരി! ജോലിക്കായി പുറത്തേക്കോ അടുത്തുള്ള പട്ടണങ്ങളിലേക്കോ പോകാൻ സാധിക്കുമോ?"

        elif next_field == "employment_preference":
            if use_v2:
                return "q7_pref_v2_ml.wav", "വളരെ നല്ലത്! നിങ്ങൾക്ക് സ്വന്തമായി കട തുടങ്ങാനാണോ അതോ സ്ഥാപനത്തിൽ ജോലി ചെയ്യാനാണോ ആഗ്രഹം?"
            return "q7_pref_v1_ml.wav", "വളരെ സന്തോഷം! നിങ്ങൾക്ക് സ്വന്തമായി ബിസിനസ് തുടങ്ങാനാണോ അതോ മാസ ശമ്പളമുള്ള ജോലിയാണോ താൽപ്പര്യം?"

        elif next_field == "local_economic_context":
            is_business = any(k in user_lower for k in ["കട", "ബിസിനസ്", "സ്ഥാപനം", "ചന്ത", "കച്ചവടം"])
            if is_business:
                return "q8_context_business_ml.wav", "സ്വന്തം സംരംഭ ശ്രമങ്ങൾക്ക് എല്ലാവിധ ആശംസകളും! നിങ്ങളുടെ നാട്ടിൽ എന്തൊക്കെ കടകളോ ചന്തയോ ഉണ്ട്?"
            return "q8_context_gen_ml.wav", "നന്നായി! നിങ്ങളുടെ നാട്ടിൽ പ്രധാനമായും എന്തൊക്കെ കടകളും സ്ഥാപനങ്ങളുമാണ് ഉള്ളത്?"

        return "q2_education_v1_ml.wav", "നിങ്ങളുടെ വിദ്യാഭ്യാസം എന്താണ്, സ്കൂളിൽ പോയിട്ടുണ്ടോ?"

    # ── Hindi Flow (hi) ─────────────────────────────────────────────────────────
    elif lang == "hi":
        if next_field == "educational_background":
            if use_v2:
                return "q2_education_v2_hi.wav", "बहुत बढ़िया! आपकी शिक्षा कितनी तक हुई है, क्या स्कूल की पढ़ाई की है?"
            return "q2_education_v1_hi.wav", "बहुत अच्छा! आपकी पढ़ाई के बारे में बताइए, क्या आप स्कूल गए हैं?"

        elif next_field == "family_occupation":
            if use_v2:
                return "q3_family_occ_v2_hi.wav", "अच्छा! आपके परिवार का मुख्य व्यवसाय या पारंपरिक काम क्या है?"
            return "q3_family_occ_v1_hi.wav", "बिल्कुल सही! आपके परिवार में पारंपरिक रूप से कौन सा काम या व्यवसाय किया जाता है?"

        elif next_field == "current_livelihood":
            is_farming = any(k in user_lower for k in ["खेती", "किसान", "कृषि", "फसल", "खेत"])
            if is_farming:
                return "q4_current_work_farming_hi.wav", "खेती करना बहुत गर्व की बात है! खेती के साथ-साथ क्या आप रोज़ाना कोई अन्य काम भी करते हैं?"
            return "q4_current_work_gen_hi.wav", "बहुत अच्छा! वर्तमान में अपनी दैनिक आजीविका या आमदनी के लिए आप क्या काम करते हैं?"

        elif next_field == "skills_and_interests":
            if use_v2:
                return "q5_skills_v2_hi.wav", "बहुत खूब! खुद का काम करने के लिए आपने कौन सा हुनर या काम सीखा हुआ है?"
            return "q5_skills_v1_hi.wav", "सरकारी कौशल योजना के लिए, आपके पास कौन से विशेष काम या हुनर की जानकारी है?"

        elif next_field == "mobility_constraints":
            is_cooking = any(k in user_lower for k in ["रसोई", "खाना", "होटल", "बावर्ची", "कुक", "बिरयानी"])
            is_driving = any(k in user_lower for k in ["ड्राइवर", "गाड़ी", "ऑटो", "कार", "ट्रक"])
            if is_cooking:
                return "q6_mobility_cooking_hi.wav", "रसोई और खानपान का हुनर बहुत बढ़िया है! क्या काम के लिए आप पास के शहर या कस्बे जा सकते हैं?"
            elif is_driving:
                return "q6_mobility_driving_hi.wav", "ड्राइविंग एक बेहतरीन पेशा है! क्या काम के सिलसिले में आप बाहर यात्रा कर सकते हैं?"
            return "q6_mobility_gen_hi.wav", "अच्छा! क्या काम के लिए आप अपने गांव से बाहर या पास के शहर जा सकते हैं?"

        elif next_field == "employment_preference":
            if use_v2:
                return "q7_pref_v2_hi.wav", "सरकारी सहायता के लिए, आपकी अपनी दुकान शुरू करने में रुचि है या किसी कंपनी में नौकरी करने में?"
            return "q7_pref_v1_hi.wav", "बहुत बढ़िया! आप खुद का कोई छोटा व्यवसाय या दुकान शुरू करना चाहते हैं, या मासिक वेतन वाली नौकरी?"

        elif next_field == "local_economic_context":
            is_business = any(k in user_lower for k in ["दुकान", "व्यापार", "बिजनेस", "खुद का काम"])
            if is_business:
                return "q8_context_business_hi.wav", "आपके नए उद्यम के लिए शुभकामनाएं! आपके गांव या इलाके में कौन-सी दुकानें या बाजार हैं?"
            return "q8_context_gen_hi.wav", "अच्छा! आपके गांव या आसपास रोजगार के क्या अवसर और बाजार उपलब्ध हैं?"

        return "q2_education_v1_hi.wav", "आपकी पढ़ाई के बारे में बताइए, क्या आप स्कूल गए हैं?"

    # ── Telugu Flow (te) ────────────────────────────────────────────────────────
    elif lang == "te":
        if next_field == "educational_background":
            if use_v2:
                return "q2_education_v2_te.wav", "బాగుంది అండీ! మీ చదువు ఎంతవరకు సాగింది, పాఠశాలకు వెళ్లారా?"
            return "q2_education_v1_te.wav", "చాలా సంతోషం అండీ! మీ చదువు వివరాలు చెప్పండి, బడికి వెళ్లారా?"

        elif next_field == "family_occupation":
            if use_v2:
                return "q3_family_occ_v2_te.wav", "సరేనండీ! మీ కుటుంబం యొక్క ప్రధాన వృత్తి లేదా పని ఏమిటి?"
            return "q3_family_occ_v1_te.wav", "మంచిదండీ! మీ కుటుంబంలో సాధారణంగా లేదా సంప్రదాయకంగా ఏ వృత్తి చేస్తారు?"

        elif next_field == "current_livelihood":
            is_farming = any(k in user_lower for k in ["వ్యవసాయం", "రైతు", "పొలం", "కూలి", "పంట"])
            if is_farming:
                return "q4_current_work_farming_te.wav", "వ్యవసాయం చేయడం ఎంతో గొప్ప విషయం అండీ! వ్యవసాయంతో పాటు ప్రస్తుతం మీ రోజువారీ ఆదాయానికి ఏం పని చేస్తున్నారు?"
            return "q4_current_work_gen_te.wav", "చాలా మంచిది అండీ! ప్రస్తుతం మీ రోజువారీ జీవనాధారం కోసం ఏ పని చేస్తున్నారు?"

        elif next_field == "skills_and_interests":
            if use_v2:
                return "q5_skills_v2_te.wav", "చాలా సంతోషం అండీ! స్వయంగా ఏదైనా పని చేయడానికి మీకు ఏ నైపుణ్యం ఉంది?"
            return "q5_skills_v1_te.wav", "ప్రభుత్వ నైపుణ్య శిక్షణ కోసం, మీకు ఏయే వృత్తి నైపుణ్యాలు లేదా ఆసక్తులు ఉన్నాయి?"

        elif next_field == "mobility_constraints":
            is_cooking = any(k in user_lower for k in ["వంట", "హోటల్", "బిర్యానీ", "భోజనం"])
            is_driving = any(k in user_lower for k in ["డ్రైవర్", "బండి", "ఆటో", "కారు", "లారీ"])
            if is_cooking:
                return "q6_mobility_cooking_te.wav", "వంట పని ఎంతో గొప్ప నైపుణ్యం అండీ! పని కోసం పక్క ఊర్లకు లేదా పట్టణాలకు వెళ్లగలరా?"
            elif is_driving:
                return "q6_mobility_driving_te.wav", "డ్రైవింగ్ మంచి వృత్తి అండీ! పని కోసం బయటి ప్రాంతాలకు ప్రయాణం చేయగలరా?"
            return "q6_mobility_gen_te.wav", "సరేనండీ! పని కోసం బయటి ఊర్లకు లేదా పట్టణాలకు ప్రయాణం చేయగలరా?"

        elif next_field == "employment_preference":
            if use_v2:
                return "q7_pref_v2_te.wav", "ప్రభుత్వ సహాయం కోసం, మీకు సొంత వ్యాపారం మొదలుపెట్టాలని ఉందా లేదా కంపెనీలో ఉద్యోగమా?"
            return "q7_pref_v1_te.wav", "చాలా మంచిది అండీ! మీకు సొంతంగా వ్యాపారం లేదా దుకాణం పెట్టడం ఇష్టమా, లేక నెల జీతం ఉద్యోగమా?"

        elif next_field == "local_economic_context":
            is_business = any(k in user_lower for k in ["దుకాణం", "షాపు", "సొంత వ్యాపారం", "బిజినెస్"])
            if is_business:
                return "q8_context_business_te.wav", "మీ సొంత వ్యాపార ప్రయత్నాలకు శుభాకాంక్షలు అండీ! మీ ఊర్లో ఎలాంటి దుకాణాలు లేదా మార్కెట్ ఉన్నాయి?"
            return "q8_context_gen_te.wav", "బాగుంది అండీ! మీ ఊర్లో ఉపాధి అవకాశాలు, దుకాణాలు ఎలా ఉన్నాయి?"

        return "q2_education_v1_te.wav", "మీ చదువు వివరాలు చెప్పండి, బడికి వెళ్లారా?"

    # ── Tamil Flow (ta) ─────────────────────────────────────────────────────────
    else:
        if next_field == "educational_background":
            if use_v2:
                return "q2_education_v2.wav", "அருமைங்க! உங்க படிப்பு விவரம் சொல்லுங்க, பள்ளிக்கூடம் வரை போயிருக்கீங்களா?"
            return "q2_education_v1.wav", "ரொம்ப சந்தோஷம்ங்க! உங்க படிப்பு என்னங்க, பள்ளிக்கூடம் போயிருக்கீங்களா?"

        elif next_field == "family_occupation":
            if use_v2:
                return "q3_family_occ_v2.wav", "சரிங்க! அரசு திட்டத்திற்காக உங்க குடும்பத்துல வழக்கமா என்ன தொழில் செய்றாங்க?"
            return "q3_family_occ_v1.wav", "நல்லதுங்க! அரசு நலத்திட்ட பதிவிற்காக உங்க குடும்ப பாரம்பரிய தொழில் என்னங்க?"

        elif next_field == "current_livelihood":
            is_farming = any(k in user_lower for k in ["விவசாய", "விவசாயம்", "காடு", "பயிர்", "நிலம்", "மாடு", "கழனி"])
            if is_farming:
                return "q4_current_work_farming.wav", "விவசாயம் செய்றது பெருமைக்குரிய விஷயம்ங்க! விவசாயத்தோடு சேர்த்து கூடுதல் வருமானத்திற்கு தினசரி என்ன வேலை செய்றீங்க?"
            return "q4_current_work_gen.wav", "மிகவும் சிறப்புங்க! குடும்ப வருமானத்தை சரியாக திட்டமிட இப்ப தினசரி என்ன வேலை பாக்குறீங்க?"

        elif next_field == "skills_and_interests":
            if use_v2:
                return "q5_skills_v2.wav", "ரொம்ப மகிழ்ச்சிங்க! அரசு திறன் பயிற்சிக்காக சொந்தமா செய்ய என்ன வேலை கத்து வச்சிருக்கீங்க?"
            return "q5_skills_v1.wav", "அருமைங்க! அரசு பயிற்சி உதவிக்கு உங்களுக்கு என்னென்ன தொழில் திறன்கள் அல்லது ஆர்வங்கள் இருக்கு?"

        elif next_field == "mobility_constraints":
            is_cooking = any(k in user_lower for k in ["பிரியாணி", "சமையல்", "ஹோட்டல்", "சாப்பாடு", "மாஸ்டர்", "ரெஸ்டாரன்ட்", "கேட்டரிங்"])
            is_driving = any(k in user_lower for k in ["டிரைவர்", "வண்டி", "ஆட்டோ", "கார்", "ஓட்டுநர்", "லாரி"])
            if is_cooking:
                return "q6_mobility_cooking.wav", "அருமைங்க, சமையல் கைபக்குவம் பெரிய வரம்! வேலைக்காக பக்கத்து ஊருக்கு பயணம் செய்ய முடியுமா?"
            elif is_driving:
                return "q6_mobility_driving.wav", "வாகனம் ஓட்டுவது சிறந்த தொழில்ங்க! வேலைக்காக வெளியூர் போக வாய்ப்பிருக்கா?"
            return "q6_mobility_gen.wav", "சரிங்க! வேலை வாய்ப்புகளுக்காக வெளியூர் அல்லது பக்கத்து ஊர்களுக்கு போக முடியுமா?"

        elif next_field == "employment_preference":
            if use_v2:
                return "q7_pref_v2.wav", "நல்லதுங்க! அரசு கடன் மானிய உதவிக்கு உங்களுக்கு சொந்த கடை வைக்க ஆசையா அல்லது நிறுவன வேலையா?"
            return "q7_pref_v1.wav", "ரொம்ப சந்தோஷம்ங்க! தொழில் வழிகாட்டலுக்கு நீங்க சொந்தமா தொழில் வைக்க விருப்பமா, இல்ல மாத சம்பள வேலையா?"

        elif next_field == "local_economic_context":
            is_business = any(k in user_lower for k in ["கடை", "சொந்த", "வியாபாரம்", "தொழில்", "பிசினஸ்", "பண்ண"])
            if is_business:
                return "q8_context_business.wav", "சூப்பர்ங்க! சொந்த தொழில் வெற்றிக்கு உங்க ஊர்ல அல்லது சந்தையில இந்த தொழிலுக்கு நல்ல ஆதரவு இருக்கா?"
            return "q8_context_gen.wav", "அருமைங்க! உங்க ஊர்ல சுத்துப்பட்டுல வேலை வாய்ப்புகள் மற்றும் சந்தை எப்படி இருக்குங்க?"

        return "q2_education_v1.wav", "ரொம்ப சந்தோஷம்ங்க! உங்க படிப்பு என்னங்க, பள்ளிக்கூடம் போயிருக்கீங்களா?"

class InterviewCoordinator:
    """
    Orchestrates turn-by-turn interviews.
    Keeps state machine, LLM driver, audio synthesis, and persistence in sync.
    """
    def __init__(self):
        self.sm = SessionManager(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
            hmac_secret=settings.consent_hmac_secret,
        )
        self.llm = GeminiInterviewDriver(
            api_key=settings.google_ai_api_key,
            model=settings.gemini_model,
        )
        self.notification_service = NotificationService()
        self._active_sessions: dict[str, dict] = {}

    async def _get_or_create_session(
        self,
        phone: str,
        channel: str,
        language: str = "ta",
        session_key: Optional[str] = None,
        force_fresh: bool = False,
    ):
        key = session_key or f"{channel}_{phone}"
        if not force_fresh and key in self._active_sessions:
            item = self._active_sessions[key]
            return item["session"], item["fsm"], False

        new_session = await self.sm.create_session(
            beneficiary_id=phone,
            channel=channel,
            language_code=language,
            phone=phone,
            call_sid=key,
        )
        fsm = InterviewFSM(new_session)
        if new_session.state == InterviewState.INITIATED:
            fsm.transition("call_connected")
        self._active_sessions[key] = {"session": new_session, "fsm": fsm}
        return new_session, fsm, False

    async def process_turn(
        self,
        phone: str,
        channel: str,
        user_speech: str = "",
        stt_confidence: float = 0.75,
        language: str = "ta",
        session_key: Optional[str] = None,
        is_initial: bool = False,
        speaker: Optional[str] = None,
        force_fresh: bool = False,
    ) -> CoordinatorTurnResult:
        session, fsm, is_new = await self._get_or_create_session(
            phone=phone,
            channel=channel,
            language=language,
            session_key=session_key,
            force_fresh=force_fresh,
        )
        key = session_key or f"{channel}_{phone}"
        user_lower = (user_speech or "").lower().strip()
        lang = session.language_code

        # ── Turn 0: Initial prompt (greeting + consent explanation) ────────────
        if is_initial:
            session.consent_prompted = True
            prompt_text = CONSENT_SCRIPTS.get(lang, CONSENT_SCRIPTS["ta"]).strip()
            # Serve native consent audio without falling back to Tamil
            audio_bytes = _get_static_bytes(f"consent_{lang}.wav") or await self._synthesize_safe(prompt_text, lang, speaker=speaker)
            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response=prompt_text,
                audio_bytes=audio_bytes,
                state=session.state,
                is_completed=False,
                case_id=None,
                current_field=session.current_field,
                language_code=lang,
            )

        # ── Turn 1: Handle Consent Stage ────────────────────────────────────────
        if session.state == InterviewState.CONSENT_PENDING:
            # If caller is silent / empty speech after the greeting was already played
            if not user_speech:
                if lang == "ml":
                    reprompt_text = "നമസ്കാരം, ഞാൻ പറയുന്നത് കേൾക്കാമോ? സംസാരിക്കാമോ?"
                    reprompt_audio = _get_static_bytes("intro_reprompt_ml.wav")
                elif lang == "hi":
                    reprompt_text = "नमस्ते, क्या आप मुझे सुन पा रहे हैं? क्या हम बात कर सकते हैं?"
                    reprompt_audio = _get_static_bytes("intro_reprompt_hi.wav")
                elif lang == "te":
                    reprompt_text = "నమస్కారం, నేను మాట్లాడేది వినిపిస్తోందా అండీ? మాట్లాడవచ్చా?"
                    reprompt_audio = _get_static_bytes("intro_reprompt_te.wav")
                else:
                    reprompt_text = "வணக்கம்ங்க, பேசுவது கேட்கிறதா? பேசலாங்களா?"
                    reprompt_audio = _get_static_bytes("intro_reprompt.wav")

                reprompt_audio = reprompt_audio or await self._synthesize_safe(reprompt_text, lang, speaker=speaker)
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=reprompt_text,
                    audio_bytes=reprompt_audio,
                    state=session.state,
                    is_completed=False,
                    case_id=None,
                    current_field=session.current_field,
                    language_code=lang,
                )

            refusal_keywords = [
                "வேண்டாம்", "விருப்பமில்லை", "முடியாது", "மாட்டேன்", "நேரமில்லை",
                "വേണ്ട", "താൽപ്പര്യമില്ല", "ഇല്ല", "പറ്റില്ല", "നിർത്തൂ", "താൽപര്യമില്ല",
                "नहीं", "मत करो", "बंद करो", "रुको", "समय नहीं", "इच्छा नहीं",
                "వద్దు", "లేదు", "ఆపండి", "ఇష్టం లేదు", "సమయం లేదు",
                "no", "never", "stop", "cancel", "dont", "don't", "nahi", "nah"
            ]
            is_refusal = any(w in user_lower for w in refusal_keywords)

            if is_refusal:
                fsm.transition("consent_refused")
                asyncio.create_task(self.sm.save_consent(
                    beneficiary_id=session.beneficiary_id,
                    session_id=session.session_id,
                    channel=channel,
                    language_code=lang,
                    consent_text=f"Consent refused via {channel}",
                    consent_given=False,
                ))
                spoken_refusal = REFUSAL_SCRIPTS.get(lang, REFUSAL_SCRIPTS["ta"]).strip()
                audio_bytes = await self._synthesize_safe(spoken_refusal, lang, speaker=speaker)
                if key in self._active_sessions:
                    del self._active_sessions[key]
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=spoken_refusal,
                    audio_bytes=audio_bytes,
                    state=session.state,
                    is_completed=True,
                    case_id=None,
                    current_field=None,
                    language_code=lang,
                )
            else:
                # User affirmed or engaged in conversation -> consent granted!
                fsm.transition("consent_given")
                session.consent_given = True
                asyncio.create_task(self.sm.save_consent(
                    beneficiary_id=session.beneficiary_id,
                    session_id=session.session_id,
                    channel=channel,
                    language_code=lang,
                    consent_text=f"Consent given via {channel}",
                    consent_given=True,
                ))

                if getattr(session, "is_known_caller", False) and getattr(session, "caller_name", None):
                    place_str = f"{session.caller_place} " if getattr(session, "caller_place", None) else ""
                    if lang == "ml":
                        q1_text = f"നമസ്കാരം! താങ്കൾ {session.caller_name} ആണോ സംസാരിക്കുന്നത്? താങ്കൾ {place_str}സ്വദേശി ആണോ?"
                    elif lang == "hi":
                        q1_text = f"नमस्ते! क्या आप {session.caller_name} जी बोल रहे हैं? क्या आप {place_str}से हैं?"
                    elif lang == "te":
                        q1_text = f"నమస్కారం! మీరు {session.caller_name} గారేనా? మీరు {place_str}గ్రామం నుంచేనా?"
                    else:
                        q1_text = f"வணக்கம்ங்க! நீங்க {session.caller_name} தானுங்களா? நீங்க {place_str}ஊர்லதான இருக்கீங்க?"
                    q1_audio = await self._synthesize_safe(q1_text, lang, speaker=speaker)
                else:
                    if lang == "ml":
                        q1_text = "വളരെ നന്ദി! ആദ്യം താങ്കളുടെ പേരും ഏത് നാട്ടുകാരനാണ് എന്നും പറയാമോ?"
                        q1_audio = _get_static_bytes("q1_name_village_ml.wav")
                    elif lang == "hi":
                        q1_text = "बहुत-बहुत धन्यवाद! सबसे पहले आपका शुभ नाम और आप किस गांव या शहर से हैं, यह बताइए?"
                        q1_audio = _get_static_bytes("q1_name_village_hi.wav")
                    elif lang == "te":
                        q1_text = "చాలా ధన్యవాదాలు అండీ! ముందుగా మీ పేరు మరియు మీ ఊరు ఏదో చెబుతారా?"
                        q1_audio = _get_static_bytes("q1_name_village_te.wav")
                    else:
                        q1_text = "ரொம்ப சந்தோஷம்ங்க! முதல்ல உங்க பேரு மற்றும் உங்க ஊர் எதுன்னு சொல்லுங்க?"
                        q1_audio = _get_static_bytes("q1_name_village.wav") or _get_static_bytes("q_name_place.wav")

                    q1_audio = q1_audio or await self._synthesize_safe(q1_text, lang, speaker=speaker)

                session.identity_asked = True

                if not hasattr(session, "conversation_history"):
                    session.conversation_history = []
                session.conversation_history.append({"role": "user", "content": user_speech})
                session.conversation_history.append({"role": "assistant", "content": q1_text})

                if not hasattr(session, "transcript_turns"):
                    session.transcript_turns = []
                session.transcript_turns.append({
                    "user": user_speech,
                    "assistant": q1_text,
                    "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
                })

                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=q1_text,
                    audio_bytes=q1_audio,
                    state=session.state,
                    is_completed=False,
                    case_id=None,
                    current_field=session.current_field,
                    language_code=lang,
                )

        # ── Turn: Interactive Course Selection Response ──────────────────────────
        if session.state == InterviewState.COURSE_SELECTION:
            session.turn_count = getattr(session, "turn_count", 0) + 1
            courses = getattr(session, "recommended_courses", []) or compute_top_recommended_courses(
                {k: f.value for k, f in session.fields.items() if f.status == "confirmed"},
                getattr(session, "transcript_turns", [])
            )

            # If user said nothing / empty audio on course question, reprompt warmly
            if not user_speech:
                if lang == "ml":
                    reprompt_course = "ഹലോ, ശുപാർശ ചെയ്ത രണ്ട് കോഴ്സുകളിൽ ഏതിലാണ് താല്പര്യമെന്ന് പറയാമോ?"
                elif lang == "hi":
                    reprompt_course = "नमस्ते, अनुशंसित दो पाठ्यक्रमों में से आपकी किसमें रुचि है, कृपया बताइए?"
                elif lang == "te":
                    reprompt_course = "హలో అండీ, సిఫార్సు చేసిన రెండు కోర్సులలో మీకు ఏది ఇష్టమో చెబుతారా?"
                else:
                    reprompt_course = "ஹலோங்க, பரிந்துரைக்கப்பட்ட இரண்டு பயிற்சிகளில் உங்களுக்கு எதில் விருப்பம்னு சொல்லுங்க?"

                reprompt_audio = await self._synthesize_safe(reprompt_course, lang, speaker=speaker)
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=reprompt_course,
                    audio_bytes=reprompt_audio,
                    state=session.state,
                    is_completed=False,
                    case_id=None,
                    current_field=None,
                    language_code=lang,
                )

            # Determine citizen course choice (1, 2, 3 or matched course keywords)
            choice_idx = 0
            c1_keywords = courses[0].get("keywords", []) if len(courses) >= 1 else []
            c2_keywords = courses[1].get("keywords", []) if len(courses) >= 2 else []
            c3_keywords = courses[2].get("keywords", []) if len(courses) >= 3 else []

            if any(w in user_lower for w in ["3", "three", "மூன்று", "மூணாவது", "மூணு", "மூன்றாவது", "மூன்றாம்", "तीसरा", "മൂന്ന്", "మూడు", "third"]):
                choice_idx = 2 if len(courses) >= 3 else 0
            elif any(w in user_lower for w in ["2", "two", "இரண்டு", "ரெண்டாவது", "இரண்டாவது", "ரெண்டு", "இரண்டாம்", "ரெண்டாம்", "दूसरा", "രണ്ട്", "రెండు", "second"]):
                choice_idx = 1 if len(courses) >= 2 else 0
            elif any(w in user_lower for w in ["1", "one", "ஒன்று", "முதல்", "முதலாவது", "முதலாம்", "ஒன்னு", "पहला", "ഒന്ന്", "ఒకటి", "first"]):
                choice_idx = 0
            elif any(kw.lower() in user_lower for kw in c2_keywords):
                choice_idx = 1 if len(courses) >= 2 else 0
            elif any(kw.lower() in user_lower for kw in c3_keywords):
                choice_idx = 2 if len(courses) >= 3 else 0
            elif any(kw.lower() in user_lower for kw in c1_keywords):
                choice_idx = 0
            else:
                # Default to top recommendation if affirmative / general
                choice_idx = 0

            selected_course_dict = courses[choice_idx] if len(courses) > choice_idx else courses[0]
            selected_course_name = selected_course_dict["qp_name"]
            selected_course_local = get_localized_course_name(selected_course_dict, lang)

            session.citizen_selected_course = selected_course_name
            session.citizen_selected_choice = choice_idx + 1
            session.state = InterviewState.COMPLETED
            fsm.transition("course_selected", selected_course=selected_course_name, choice_idx=choice_idx + 1)
            case_id = session.session_id[:12].upper()

            confirmed_dict = {
                k: normalize_field_to_english(k, f.value or f.raw_transcript or "Recorded", lang)
                for k, f in session.fields.items()
                if f.status == "confirmed"
            }

            # Warm celebratory wrap-up text acknowledging selected course
            if lang == "ml":
                wrap_text = f"വളരെ സന്തോഷം! നിങ്ങൾ തിരഞ്ഞെടുത്ത {selected_course_local} വിജയകരമായി രേഖപ്പെടുത്തി. പൂർണ്ണ വിവരങ്ങൾ വാട്ട്‌സ്ആപ്പിലും അയച്ചിട്ടുണ്ട്. നന്ദി, ശുഭദിനം!"
            elif lang == "hi":
                wrap_text = f"बहुत बढ़िया! आपके पसंदीदा {selected_course_local} का चयन सफलतापूर्वक दर्ज हो गया है। पूरा विवरण व्हाट्सएप पर भेज दिया गया है। धन्यवाद!"
            elif lang == "te":
                wrap_text = f"చాలా మంచిది అండీ! మీరు ఎంచుకున్న {selected_course_local} వివరాలు విజయవంతంగా నమోదయ్యాయి. పూర్తి వివరాలు వాట్సాప్‌లో పంపాము. ధన్యవాదాలు!"
            else:
                c_clean = selected_course_local.replace(" பயிற்சி", "") if selected_course_local.endswith(" பயிற்சி") else selected_course_local
                wrap_text = f"ரொம்ப மகிழ்ச்சிங்க! உங்க விருப்பமான {c_clean} பயிற்சி வெற்றிகரமாக பதிவாகிவிட்டது. இதன் முழு விவரங்களையும் உங்கள் வாட்ஸ்அப்பிற்கும் அனுப்பியுள்ளோம். வாழ்த்துகள்ங்க!"

            wrap_audio = await self._synthesize_safe(wrap_text, lang, speaker=speaker)

            # Record turn in conversation history and transcript FIRST
            if not hasattr(session, "conversation_history"):
                session.conversation_history = []
            session.conversation_history.append({"role": "user", "content": user_speech})
            session.conversation_history.append({"role": "assistant", "content": wrap_text})

            if not hasattr(session, "transcript_turns"):
                session.transcript_turns = []
            session.transcript_turns.append({
                "user": user_speech,
                "assistant": wrap_text,
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
            })

            record = {
                "session_id": session.session_id,
                "case_id": case_id,
                "phone": phone,
                "channel": channel,
                "language": lang,
                "status": "BENEFICIARY_CONFIRMED",
                "citizen_confirmed": True,
                "confirmed_via": "VOICE_CALL",
                "confirmed_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                "notification_status": "DISPATCHED",
                "completed_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                "confirmed_fields": confirmed_dict,
                "turns_count": len(session.transcript_turns),
                "transcript": list(session.transcript_turns),
                "recommended_courses": courses,
                "citizen_selected_choice": choice_idx + 1,
                "citizen_selected_course": selected_course_name,
            }

            _completed_calls_records.insert(0, record)
            if len(_completed_calls_records) > 100:
                _completed_calls_records.pop()
            _save_persisted_records()

            # Asynchronously dispatch post-call bilingual confirmation (WhatsApp + SMS) with pre-confirmed course
            asyncio.create_task(self.notification_service.dispatch_bilingual_confirmation(
                phone=phone,
                language_code=lang,
                case_id=case_id,
                confirmed_fields=confirmed_dict,
                caller_name=getattr(session, "caller_name", None),
                recommended_courses=courses,
                selected_course=selected_course_name,
            ))

            if key in self._active_sessions:
                del self._active_sessions[key]

            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response=wrap_text,
                audio_bytes=wrap_audio,
                state=InterviewState.COMPLETED,
                is_completed=True,
                case_id=case_id,
                current_field=None,
                language_code=lang,
            )

        # ── Turn 2: Identity Response Fast-Path ──────────────────────────────────
        if session.state == InterviewState.FIELD_COLLECTION and getattr(session, "identity_asked", False) and not getattr(session, "identity_confirmed", False):
            session.identity_confirmed = True
            
            # Fast synchronous extraction of name / village from user speech
            session.caller_name = user_speech.split(",")[0].replace("என் பேரு", "").replace("പേര്", "").replace("मेरा नाम", "").replace("నా పేరు", "").strip() or "Beneficiary"

            if lang == "ml":
                q_edu = "വളരെ സന്തോഷം! നിങ്ങളുടെ വിദ്യാഭ്യാസം എന്താണ്, സ്കൂളിൽ പോയിട്ടുണ്ടോ?"
                edu_audio = _get_static_bytes("q2_education_v1_ml.wav")
            elif lang == "hi":
                q_edu = "बहुत अच्छा! आपकी पढ़ाई के बारे में बताइए, क्या आप स्कूल गए हैं?"
                edu_audio = _get_static_bytes("q2_education_v1_hi.wav")
            elif lang == "te":
                q_edu = "చాలా సంతోషం అండੀ! మీ చదువు వివరాలు చెప్పండి, బడికి వెళ్లారా?"
                edu_audio = _get_static_bytes("q2_education_v1_te.wav")
            else:
                q_edu = "ரொம்ப சந்தோஷம்ங்க! அரசு நலத்திட்ட பதிவிற்காக உங்க படிப்பு என்னங்க, பள்ளிக்கூடம் போயிருக்கீங்களா?"
                edu_audio = _get_static_bytes("q2_education_v1.wav") or _get_static_bytes("q1_education_ta.wav") or _get_static_bytes("q_educational_background.wav")

            edu_audio = edu_audio or await self._synthesize_safe(q_edu, lang, speaker=speaker)

            if not hasattr(session, "conversation_history"):
                session.conversation_history = []
            session.conversation_history.append({"role": "user", "content": user_speech})
            session.conversation_history.append({"role": "assistant", "content": q_edu})

            if not hasattr(session, "transcript_turns"):
                session.transcript_turns = []
            session.transcript_turns.append({
                "user": user_speech,
                "assistant": q_edu,
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
            })

            # Fire background extraction for identity without delaying the audio
            asyncio.create_task(self._process_background_extraction(session, fsm, user_speech))

            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response=q_edu,
                audio_bytes=edu_audio,
                state=session.state,
                is_completed=False,
                case_id=None,
                current_field=session.current_field,
                language_code=lang,
            )

        # ── Turn 3+: Standard Field Collection & Zero-Lag Immediate Playback ────────
        if session.state == InterviewState.FIELD_COLLECTION and user_speech:
            session.turn_count = getattr(session, "turn_count", 0) + 1

            # Check if caller asks for clarification or repeats an unclear phrase
            is_clarification = any(q in user_lower for q in [
                "என்னங்க", "புரியல கொஞ்சம் சொல்லுங்க", "சொல்லுங்க", "சொல்லுங்கப்பா",
                "விளங்கலங்க", "கேக்கலங்க", "கேக்கலயா", "ஹலோ", "மன்னிப்பீங்க",
                "ரீபீட்", "மறுபடி", "திரும்ப", "புரியல என்ன சொன்னீங்க", "மறுபடியும் சொல்லுங்க",
                "മനസ്സിലായില്ല", "വ്യക്തമായില്ല", "ഹലോ", "എന്താണ് പറഞ്ഞത്", "വീണ്ടും പറയൂ", "ഒന്നുകൂടി പറയുമോ", "കേൾക്കുന്നില്ല",
                "समझ नहीं आया", "दोबारा बोलिए", "सुनाई नहीं दिया", "क्या कहा", "फिर से बोलो",
                "వినపడలేదు", "మళ్ళీ చెప్పండి", "అర్థం కాలేదు", "ఏమన్నారు", "హలో"
            ])

            if is_clarification:
                if any(q in user_lower for q in [
                    "மறுபடி", "திரும்ப", "சொல்லுங்க", "விளங்கலங்க", "கேக்கலங்க", "புரியல என்ன சொன்னீங்க", "மறுபடியும் சொல்லுங்க",
                    "വീണ്ടും പറയൂ", "ഒന്നുകൂടി പറയുമോ", "വ്യക്തമായില്ല", "കേൾക്കുന്നില്ല",
                    "दोबारा बोलिए", "फिर से बोलो", "सुनाई नहीं दिया", "समझ नहीं आया",
                    "మళ్ళీ చెప్పండి", "వినపడలేదు", "అర్థం కాలేదు"
                ]):
                    if lang == "ml":
                        sorry_audio = _get_static_bytes("sorry_unclear_ml.wav") or _get_static_bytes("sorry_repeat_ml.wav")
                        sorry_text = "ക്ഷമിക്കണം, നിങ്ങൾ പറഞ്ഞത് വ്യക്തമായില്ല. വീണ്ടും പറയാമോ?"
                    elif lang == "hi":
                        sorry_audio = _get_static_bytes("sorry_unclear_hi.wav") or _get_static_bytes("sorry_repeat_hi.wav")
                        sorry_text = "माफ़ कीजिए, आपकी आवाज स्पष्ट नहीं आई। क्या आप दोबारा कह सकते हैं?"
                    elif lang == "te":
                        sorry_audio = _get_static_bytes("sorry_unclear_te.wav") or _get_static_bytes("sorry_repeat_te.wav")
                        sorry_text = "క్షమించండి, మీ స్వరం స్పష్టంగా వినిపించలేదు. దయచేసి మళ్ళీ చెబుతారా?"
                    else:
                        sorry_audio = _get_static_bytes("sorry_unclear.wav") or _get_static_bytes("sorry_repeat.wav")
                        sorry_text = "மன்னிச்சுக்கோங்க, மறுபடியும் சொல்றேன். இன்னும் ஒரு முறை சொல்லுங்களேன்?"

                    sorry_audio = sorry_audio or await self._synthesize_safe(sorry_text, lang, speaker=speaker)
                    return CoordinatorTurnResult(
                        session_id=session.session_id,
                        spoken_response=sorry_text,
                        audio_bytes=sorry_audio,
                        state=session.state,
                        is_completed=False,
                        case_id=None,
                        current_field=session.current_field,
                        language_code=lang,
                    )

                # Dynamic LLM answer for general questions / off-topic inquiries
                llm_result = await self.llm.process_turn(session, fsm, user_speech=user_speech)
                spoken_text = llm_result.spoken_response
                audio_bytes = await self._synthesize_safe(spoken_text, lang, speaker=speaker)
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=spoken_text,
                    audio_bytes=audio_bytes,
                    state=session.state,
                    is_completed=False,
                    case_id=None,
                    current_field=session.current_field,
                    language_code=lang,
                )

            current_field = session.current_field

            # 1. Immediate Synchronous Value Population (Eliminates the 'Yes' bug & normalizes to English)
            if current_field and current_field in session.fields:
                session.fields[current_field].status = "confirmed"
                session.fields[current_field].value = normalize_field_to_english(current_field, user_speech.strip(), lang)
                session.fields[current_field].raw_transcript = user_speech.strip()

            # 2. Fast Multi-Field Semantic Co-Inference
            # Populates candidate values without prematurely marking unasked dimensions as confirmed
            inferred = _infer_semantic_fields_fast(user_speech, lang)
            for inf_key, inf_val in inferred.items():
                if inf_key in session.fields and session.fields[inf_key].status != "confirmed":
                    session.fields[inf_key].value = normalize_field_to_english(inf_key, inf_val, lang)
                    # Keep status as 'pending' so advance_to_next_field asks the citizen!

            # Advance to next uncollected field
            session.advance_to_next_field()
            next_field = session.current_field

            # Dispatch background LLM extraction and Supabase persistence immediately
            asyncio.create_task(self._process_background_extraction(
                session, fsm, user_speech, expected_field=current_field
            ))

            # Check if all fields are completed
            if session.all_fields_collected or not next_field:
                confirmed_dict = {
                    k: normalize_field_to_english(k, f.value or f.raw_transcript or "Recorded", lang)
                    for k, f in session.fields.items()
                    if f.status == "confirmed"
                }
                top_courses = compute_top_recommended_courses(confirmed_dict, getattr(session, "transcript_turns", []))
                session.recommended_courses = top_courses
                session.state = InterviewState.COURSE_SELECTION
                fsm.transition("course_selection_started")

                c1_local = get_localized_course_name(top_courses[0], lang) if len(top_courses) >= 1 else "தொழில் பயிற்சி"
                c2_local = get_localized_course_name(top_courses[1], lang) if len(top_courses) >= 2 else "சுயதொழில் பயிற்சி"

                if lang == "ml":
                    ask_course_text = f"വളരെ നന്ദി! നിങ്ങളുടെ എല്ലാ വിവരങ്ങളും വിജയകരമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്. നിങ്ങളുടെ താല്പര്യപ്രകാരം രണ്ട് മികച്ച കോഴ്സുകൾ ശുപാർശ ചെയ്യുന്നു: ഒന്ന്, {c1_local}. രണ്ട്, {c2_local}. ഇതിൽ ഏതിലാണ് നിങ്ങൾക്ക് കൂടുതൽ താല്പര്യം?"
                elif lang == "hi":
                    ask_course_text = f"बहुत-बहुत धन्यवाद! आपकी सभी जानकारी सफलतापूर्वक दर्ज कर ली गई है। आपके लिए दो बेहतरीन पाठ्यक्रम हैं: पहला, {c1_local}, और दूसरा, {c2_local}। इनमें से आपकी किसमें अधिक रुचि है?"
                elif lang == "te":
                    ask_course_text = f"చాలా ధన్యవాదాలు అండీ! మీ వివరాలన్నీ విజయవంతంగా నమోదయ్యాయి. మీ కోసం రెండు ఉత్తమ కోర్సులు ఉన్నాయి: ఒకటి, {c1_local}, రెండు, {c2_local}. వీటిలో మీకు దేనిపై ఎక్కువ ఆసక్తి ఉంది?"
                else:
                    ask_course_text = f"மிக்க நன்றிங்க! உங்க அனைத்து விவரங்களும் முறையாக பதிவாகிவிட்டது. உங்க விருப்பத்தின்படி இரண்டு சிறந்த பயிற்சிகள்: ஒன்று, {c1_local}. இரண்டு, {c2_local}. இந்த பயிற்சிகளில் உங்களுக்கு எதில் அதிக ஆர்வம் உள்ளது?"

                ask_audio = await self._synthesize_safe(ask_course_text, lang, speaker=speaker)

                if not hasattr(session, "conversation_history"):
                    session.conversation_history = []
                session.conversation_history.append({"role": "user", "content": user_speech})
                session.conversation_history.append({"role": "assistant", "content": ask_course_text})

                if not hasattr(session, "transcript_turns"):
                    session.transcript_turns = []
                session.transcript_turns.append({
                    "user": user_speech,
                    "assistant": ask_course_text,
                    "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
                })

                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=ask_course_text,
                    audio_bytes=ask_audio,
                    state=InterviewState.COURSE_SELECTION,
                    is_completed=False,
                    case_id=None,
                    current_field=None,
                    language_code=lang,
                )

            # Select warm, non-monotonous, appreciative question audio for next field
            q_file, q_text = _get_question_for_field(next_field, user_speech, session)
            next_audio = _get_static_bytes(q_file) or await self._synthesize_safe(q_text, lang, speaker=speaker)

            if not hasattr(session, "conversation_history"):
                session.conversation_history = []
            session.conversation_history.append({"role": "user", "content": user_speech})
            session.conversation_history.append({"role": "assistant", "content": q_text})

            if not hasattr(session, "transcript_turns"):
                session.transcript_turns = []
            session.transcript_turns.append({
                "user": user_speech,
                "assistant": q_text,
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
            })

            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response=q_text,
                audio_bytes=next_audio,
                state=session.state,
                is_completed=False,
                case_id=None,
                current_field=session.current_field,
                language_code=lang,
            )

        # ── Turn 4: Empty speech or Reprompt ────────────────────────────────────────
        next_field = session.current_field
        if next_field:
            q_file, q_text = _get_question_for_field(next_field, "", session)
            fallback_sorry = f"sorry_unclear_{lang}.wav" if lang != "ta" else "sorry_unclear.wav"
            reprompt_audio = _get_static_bytes(q_file) or _get_static_bytes(fallback_sorry) or await self._synthesize_safe(q_text, lang, speaker=speaker)
            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response=q_text,
                audio_bytes=reprompt_audio,
                state=session.state,
                is_completed=False,
                case_id=None,
                current_field=session.current_field,
                language_code=lang,
            )

        wrap_text = WRAP_UP_SCRIPTS.get(lang, WRAP_UP_SCRIPTS["ta"])
        wrap_audio = _get_static_bytes(f"q_wrapup_v2_{lang}.wav") or _get_static_bytes("q_wrapup_v2.wav") or _get_static_bytes("q_wrapup.wav")
        return CoordinatorTurnResult(
            session_id=session.session_id,
            spoken_response=wrap_text,
            audio_bytes=wrap_audio,
            state=session.state,
            is_completed=True,
            case_id=None,
            current_field=None,
            language_code=lang,
        )

    async def _process_background_extraction(
        self,
        session: InterviewSession,
        fsm: InterviewFSM,
        user_speech: str,
        expected_field: Optional[str] = None
    ):
        """Asynchronously extracts structured fields using LLM and updates memory/persistence without delaying telephony audio."""
        try:
            llm_result: LLMExtractionResult = await self.llm.process_turn(session, fsm, user_speech=user_speech)
            fields_to_save = dict(llm_result.extracted_fields or {})
            if llm_result.field_name and llm_result.field_value:
                fields_to_save[llm_result.field_name] = llm_result.field_value

            # Identity extraction
            if "beneficiary_name" in fields_to_save:
                b_name = fields_to_save.pop("beneficiary_name")
                session.caller_name = b_name
                b_place = fields_to_save.pop("village_place", None) or getattr(session, "caller_place", None)
                if b_place:
                    session.caller_place = b_place
                session.identity_confirmed = True
                session.is_known_caller = True
                await self.sm.update_beneficiary_identity(session.beneficiary_id, b_name, b_place)
            elif "village_place" in fields_to_save:
                b_place = fields_to_save.pop("village_place")
                session.caller_place = b_place
                session.identity_confirmed = True
                await self.sm.update_beneficiary_identity(session.beneficiary_id, getattr(session, "caller_name", None) or "Beneficiary", b_place)

            # Assign to expected_field if not explicitly structured
            if expected_field and expected_field in session.fields and expected_field not in fields_to_save:
                if not session.fields[expected_field].value:
                    fields_to_save[expected_field] = user_speech

            # Persist and confirm fields
            for fn, fv in fields_to_save.items():
                if fn in session.fields:
                    clean_fv = normalize_field_to_english(fn, fv, session.language_code)
                    session.fields[fn].value = clean_fv
                    session.fields[fn].status = "confirmed"
                    session.fields[fn].confidence = llm_result.confidence
                    await self.sm.save_field_extraction(
                        session_id=session.session_id,
                        field_name=fn,
                        field_value=clean_fv,
                        raw_transcript=user_speech,
                        confidence=llm_result.confidence,
                        readback_text=clean_fv,
                    )
                    await self.sm.confirm_field(session.session_id, fn)

            # Retroactively update dashboard record in _completed_calls_records with structured data!
            for rec in _completed_calls_records:
                if rec.get("session_id") == session.session_id:
                    rec_lang = rec.get("language", session.language_code)
                    rec["confirmed_fields"] = {
                        k: normalize_field_to_english(k, f.value or f.raw_transcript or "Recorded", rec_lang)
                        for k, f in session.fields.items()
                        if f.status == "confirmed"
                    }
                    _save_persisted_records()
                    break

            if session.all_fields_collected:
                await self.sm.mark_session_completed(session.session_id)
                await self.sm.create_profile_from_session(session)
        except Exception as e:
            logger.error(f"Background field extraction error: {e}", exc_info=True)

    async def _synthesize_safe(self, text: str, language_code: str, speaker: Optional[str] = None) -> Optional[bytes]:
        """Safely generates TTS audio with static cache and network retries."""
        if settings.enable_mock_tts or not text:
            return None

        try:
            tts_res: TTSResult = await synthesize_speech(
                text=text,
                language_code=language_code,
                sarvam_api_key=settings.sarvam_api_key,
                sarvam_tts_url=settings.sarvam_tts_url,
                mock_mode=False,
                speaker_override=speaker,
            )
            return tts_res.audio_bytes if tts_res else None
        except Exception as e:
            logger.error(f"TTS synthesis error: {repr(e)}", exc_info=True)
            return None

    async def handle_disconnect(self, phone: str, channel: str, session_key: Optional[str] = None):
        key = session_key or f"{channel}_{phone}"
        if key in self._active_sessions:
            session = self._active_sessions[key]["session"]
            await self.sm.mark_session_dropped(session.session_id)
            del self._active_sessions[key]
