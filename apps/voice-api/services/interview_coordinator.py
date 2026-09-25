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
from .audio_filter import is_noise, is_connection_check, is_affirmation_filler, is_substantive_field_answer
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

from services.course_catalog import (
    CATALOG_COURSES,
    get_localized_course_name,
    get_short_english_name,
    find_course_in_catalog,
    compute_top_recommended_courses,
    format_course_selection_whatsapp,
    format_recommended_course_item,
)


def detect_spoken_language(user_speech: str, current_lang: str = "en") -> str:
    """
    Detects language from user speech using Unicode ranges and vernacular keywords.
    Supported: 'ta' (Tamil), 'hi' (Hindi), 'te' (Telugu), 'ml' (Malayalam), 'en' (English).
    """
    if not user_speech:
        return current_lang

    text = user_speech.strip()

    # 1. Unicode Range Checks (Highest Precision)
    tamil_chars = len([c for c in text if '\u0B80' <= c <= '\u0BFF'])
    hindi_chars = len([c for c in text if '\u0900' <= c <= '\u097F'])
    telugu_chars = len([c for c in text if '\u0C00' <= c <= '\u0C7F'])
    malayalam_chars = len([c for c in text if '\u0D00' <= c <= '\u0D7F'])

    counts = [
        (tamil_chars, "ta"),
        (hindi_chars, "hi"),
        (telugu_chars, "te"),
        (malayalam_chars, "ml"),
    ]
    counts.sort(key=lambda x: x[0], reverse=True)
    if counts[0][0] >= 2:
        return counts[0][1]

    # 2. Phonetic / Romanized Transliteration & Keyword Matching
    lower = text.lower()
    words = set(lower.replace(",", " ").replace(".", " ").replace("!", " ").replace("?", " ").split())

    ta_keywords = {
        "vanakkam", "pesalam", "pesunga", "pesalaam", "aama", "aamanga", "aamaa",
        "seri", "sari", "tamil", "thamizh", "thamil", "enakku", "solunga", "sollunga",
        "puriyala", "kekkudhu", "vaanga", "illai", "kedaikkum", "irukku", "theriyum",
        "thozhil", "padipu", "velai", "oor", "enga", "neenga", "romba", "nandri"
    }
    hi_keywords = {
        "namaste", "namaskar", "shuru", "kariye", "kijiye", "boliye", "bataiye",
        "haan", "theek", "suno", "hindi", "accha", "samajh", "aaya", "kripya",
        "mera", "naam", "kaam", "koshish", "dhanbad", "dhanyavad", "padhai"
    }
    te_keywords = {
        "namaskaram", "matladandi", "cheppandi", "avunu", "sare", "telugu",
        "vinapadutondi", "meeru", "naaku", "chadavaledu", "pani", "dhanyavadalu"
    }
    ml_keywords = {
        "namaskaram", "parayoo", "athe", "sheriyaanu", "malayalam", "kelkkamo",
        "cheyyaam", "njan", "entha", "paditham", "pani", "nanni"
    }
    en_keywords = {
        "yes", "proceed", "continue", "hello", "hi", "sure", "start", "go ahead",
        "i want", "english", "okay", "ok", "speak", "tell", "listen", "course",
        "training", "work", "job", "myself", "fine", "ready", "confirm"
    }

    scores = {
        "ta": sum(1 for w in words if w in ta_keywords or any(k in w for k in ["vanakk", "pesal", "aama", "thamizh"])),
        "hi": sum(1 for w in words if w in hi_keywords or any(k in w for k in ["namas", "kariy", "theek"])),
        "te": sum(1 for w in words if w in te_keywords or any(k in w for k in ["namask", "matlad", "chepp"])),
        "ml": sum(1 for w in words if w in ml_keywords or any(k in w for k in ["namask", "paray", "athe"])),
        "en": sum(1 for w in words if w in en_keywords),
    }

    best_lang, best_score = max(scores.items(), key=lambda x: x[1])
    if best_score > 0:
        return best_lang

    return current_lang


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
    Provides candidate mappings and out-of-order co-inference without delaying telephony audio.
    """
    text = (user_speech or "").lower().strip()
    extracted = {}

    # Farming / Agriculture
    farming_tokens = [
        "விவசாய", "விவசாயம்", "காடு", "பயிர்", "நிலம்", "மாடு", "கழனி", "விவசாய கூலி",
        "കൃഷി", "കർഷക", "പാടം", "പശു", "തോട്ടം",
        "खेती", "किसान", "कृषि", "फसल", "खेत", "मजदूरी",
        "వ్యవసాయం", "రైతు", "పొలం", "కూలి", "పంట",
        "farming", "farmer", "agriculture", "crops", "cattle", "field"
    ]
    if any(k in text for k in farming_tokens):
        extracted["family_occupation"] = "Agriculture / Farming"

    # Poultry
    poultry_tokens = [
        "கோழி", "பண்ணை", "கோழிப்பண்ணை", "முட்டை",
        "കോഴി", "ഫാം", "മുട്ട",
        "मुर्गी", "पोल्ट्री", "अंडा",
        "కోడి", "ఫారం", "గుడ్లు",
        "broiler", "poultry", "chicken", "farm"
    ]
    if any(k in text for k in poultry_tokens):
        extracted["skills_and_interests"] = "Small Poultry Farming"

    # Weaving / Handloom
    weaving_tokens = [
        "நெசவு", "கைத்தறி", "தறி", "சேலை",
        "നെയ്ത്ത്", "കൈത്തറി",
        "बुनकर", "हथकरघा", "बुनाई",
        "చేనేత", "మగ్గం",
        "weaving", "handloom", "weaver"
    ]
    if any(k in text for k in weaving_tokens):
        extracted["skills_and_interests"] = "Handloom Weaver"

    # Cooking & Catering
    cooking_tokens = [
        "பிரியாணி", "சமையல்", "ஹோட்டல்", "சாப்பாடு", "மாஸ்டர்", "ரெஸ்டாரன்ட்", "கேட்டரிங்",
        "പാചകം", "ഹോട്ടൽ", "ഭക്ഷണം", "കറ്ററിംഗ്",
        "खाना", "रसोई", "होटल", "कुक", "केटरिंग", "भोजन",
        "వంట", "హోటల్", "భోజనం", "క్యాటరింగ్",
        "cooking", "cook", "catering", "hotel", "food", "chef"
    ]
    if any(k in text for k in cooking_tokens):
        extracted["skills_and_interests"] = "Food Preparation & Catering"

    # Driving
    driving_tokens = [
        "டிரைவர்", "வண்டி", "ஆட்டோ", "கார்", "ஓட்டுநர்", "லாரி",
        "ഡ്രൈവർ", "വണ്ടി", "ഓട്ടോ", "കാർ",
        "ड्राइवर", "गाड़ी", "ऑटो", "कार",
        "డ్రైవర్", "వాహనం", "ఆటో", "కారు",
        "driver", "driving", "auto", "car", "cab", "truck"
    ]
    if any(k in text for k in driving_tokens):
        extracted["current_livelihood"] = "Commercial Driver / Vehicle Operator"
        extracted["skills_and_interests"] = "Commercial Driver / Vehicle Operator"

    # Electrical
    electrical_tokens = [
        "எலக்ட்ரீசியன்", "கரண்ட்", "வயர்", "மின்சாரம்",
        "ഇലക്ട്രീഷൻ", "കറണ്ട്", "വയറിംഗ്",
        "इलेक्ट्रीशियन", "बिजली", "वायरिंग",
        "ఎలక్ట్రీషియన్", "కరెంట్", "వైరింగ్",
        "electrician", "electrical", "wiring", "current"
    ]
    if any(k in text for k in electrical_tokens):
        extracted["skills_and_interests"] = "Domestic Electrician"

    # Tailoring
    tailoring_tokens = [
        "தையல்", "தையல்காரர்", "துணி", "தையல் மிஷின்",
        "തയ്യൽ", "തുണി",
        "दर्जी", "सिलाई", "कपड़ा",
        "టైలరింగ్", "కుట్టు", "బట్టలు",
        "tailor", "tailoring", "stitching", "sewing", "garment"
    ]
    if any(k in text for k in tailoring_tokens):
        extracted["skills_and_interests"] = "Sewing & Tailoring"

    # Plumber
    plumber_tokens = [
        "பிளம்பர்", "பிளம்பிங்", "குழாய்", "தண்ணீர் பைப்", "பைப்",
        "പ്ലംബർ", "പൈപ്പ്",
        "प्लम्बर", "नल", "पाइप",
        "ప్లంబర్", "పైప్", "కుళాయి",
        "plumber", "plumbing", "pipe"
    ]
    if any(k in text for k in plumber_tokens):
        extracted["skills_and_interests"] = "General Plumbing & Pipe Fitting"

    # Mason / Construction
    mason_tokens = [
        "மேஸ்திரி", "கொத்தனார்", "கட்டிடம்", "சிமெண்ட்", "செங்கல்", "கட்டுமான",
        "മേസ്തിരി", "നിർമ്മാണം",
        "राजमिस्त्री", "मिस्त्री", "निर्माण", "मकान",
        "మేస్త్రీ", "భవన నిర్మాణం",
        "mason", "masonry", "construction", "builder"
    ]
    if any(k in text for k in mason_tokens):
        extracted["skills_and_interests"] = "Building Construction & Masonry"

    # Solar
    solar_tokens = [
        "சோலார்", "சூரிய மின்சக்தி", "பேனல்",
        "സോളാർ", "സൗരോർജ്ജം",
        "सोलर", "सौर ऊर्जा",
        "సోలార్", "సౌర విద్యుత్",
        "solar", "solar panel", "clean energy"
    ]
    if any(k in text for k in solar_tokens):
        extracted["skills_and_interests"] = "Solar Panel Installation"

    # Two-Wheeler Mechanic
    mechanic_tokens = [
        "டூவீலர்", "பைக்", "மெக்கானிக்", "ஒர்க்‌ஷாப்",
        "ടൂവീലർ", "ബൈക്ക്", "മെക്കാനിക്ക്",
        "मैकेनिक", "बाइक", "गैरेज",
        "టూవీలర్", "బైక్", "మెకానిక్",
        "mechanic", "two wheeler", "bike repair", "garage"
    ]
    if any(k in text for k in mechanic_tokens):
        extracted["skills_and_interests"] = "Two-Wheeler Service Technician"

    # Beauty & Salon
    beauty_tokens = [
        "பார்லர்", "அழகுக்கலை", "மேக்கப்", "சலூன்", "பியூட்டி", "ஹேர்", "பார்பர்", "முடி திருத்து", "ஹேர்கட்",
        "ബ്യൂട്ടി പാർലർ", "മേക്കപ്പ്", "സലൂൺ", "ബാർബർ",
        "ब्यूटी पार्लर", "मेकअप", "सैलून", "नाई", "पार्लर", "बाल काटना",
        "బ్యూటీ పార్లర్", "మేకప్", "సెలూన్", "పార్లర్", "క్షౌర",
        "beauty parlour", "salon", "saloon", "barber", "haircut", "makeup", "hair", "grooming", "barbershop"
    ]
    if any(k in text for k in beauty_tokens):
        extracted["skills_and_interests"] = "Beauty Therapist & Salon Care"

    # Footwear / Leather Goods
    footwear_tokens = [
        "செருப்பு", "பாதணி", "சப்பல்", "காலணி", "தோல்",
        "ചെരുപ്പ്",
        "जूता", "चप्पल", "चमड़ा",
        "పాదరక్షలు", "చెప్పులు",
        "footwear", "chappal", "shoe", "leather", "shoes"
    ]
    if any(k in text for k in footwear_tokens):
        extracted["skills_and_interests"] = "Footwear & Leather Goods Specialist"

    # Grocery / Kirana (Specific provisions only, never generic shop)
    grocery_tokens = [
        "மளிகை", "கிரானா", "அண்ணாச்சி கடை", "மளிகை கடை",
        "പലചരക്ക്", "പലചരക്ക് കട",
        "किराना", "राशन", "किराना दुकान", "राशन दुकान",
        "కిరాణా", "కిరాణా షాపు",
        "grocery", "kirana", "provision", "provision store", "grocery store", "supermarket"
    ]
    if any(k in text for k in grocery_tokens):
        extracted["skills_and_interests"] = "Grocery Store / Retail Trade"

    # Explicit Self-Employment Preference
    self_emp_tokens = [
        "சொந்த கடை", "சொந்த தொழில்", "பிசினஸ்", "சுயதொழில்", "சொந்த வியாபாரம்", "முதலீடு",
        "own business", "own shop", "self employment", "start business", "startup", "entrepreneur",
        "स्वरोजगार", "खुद का काम", "खुद की दुकान", "व्यापार",
        "స్వయం ఉపాధి", "సొంత వ్యాపారం", "షాపు",
        "സ്വയംതൊഴിൽ", "സ്വന്തം സംരംഭം", "കട"
    ]
    if any(k in text for k in self_emp_tokens) or (("own" in text or "start" in text) and ("business" in text or "shop" in text or "enterprise" in text)):
        extracted["employment_preference"] = "Self-Employment (Own Business / Shop)"

    # Explicit Wage Employment Preference
    wage_tokens = [
        "கம்பெனி வேலை", "மாத சம்பளம்", "நிறுவனம்", "மாதாந்திர வேலை", "சம்பள வேலை",
        "company job", "monthly salary", "salary", "wage job", "salaried",
        "कंपनी की नौकरी", "मासिक वेतन", "नौकरी",
        "కంపెనీ ఉద్యోగం", "నెలవారీ జీతం", "ఉద్యోగం",
        "കമ്പനി ജോലി", "മാസ ശമ്പളം"
    ]
    if any(k in text for k in wage_tokens):
        extracted["employment_preference"] = "Wage Employment (Monthly Salary)"

    # Mobility: Local vs Travel
    if any(k in text for k in ["local only", "local", "village", "in my village", "nearby", "ஊருக்குள்ள", "ஊருக்குள்ள மட்டும்", "வெளியூர் போக முடியாது", "staying nearby", "गाँव में ही", "गाँव में", "స్థానికంగా"]):
        extracted["mobility_constraints"] = "Local Area Only (Within Village / Block)"
    elif any(k in text for k in ["can travel", "travel", "city", "town", "பக்கத்து ஊருக்கு போவேன்", "டவுனுக்கு போவேன்", "travel nearby", "शहर जा सकते हैं", "పట్టణాలకు వెళ్లగలను"]):
        extracted["mobility_constraints"] = "Can Travel to Nearby Towns & District Centre"

    return extracted


def _generate_conversational_acknowledgement(user_speech: str, lang: str) -> Optional[str]:
    """
    Disabled to prevent premature call-completed feeling.
    Citizen questions must be direct, crisp, and focused on the next field.
    """
    return None


def _select_field_prompt(next_field: str, session: InterviewSession, lang: str, use_v2: bool) -> Tuple[str, str]:
    """Selects base question audio and respectful, open text prompt for the next field."""
    # ── English Flow (en) ───────────────────────────────────────────────────────
    if lang == "en":
        if next_field == "educational_background":
            if use_v2:
                return "q2_education_v2_en.wav", "Wonderful to connect with you! To help us understand your background, could you tell me a little about your schooling or education?"
            return "q2_education_v1_en.wav", "Great to speak with you! To get started, could you share a bit about your educational background or schooling?"

        elif next_field == "family_occupation":
            if use_v2:
                return "q3_family_occ_v2_en.wav", "Thank you for sharing that with me! In your family or household, what traditional trade or work did your elders usually do?"
            return "q3_family_occ_v1_en.wav", "Thank you! To help us understand your family heritage, what kind of traditional work or trade did your family engage in?"

        elif next_field == "current_livelihood":
            if use_v2:
                return "q4_current_work_v2_en.wav", "Traditional skills and family heritage are truly valuable! Currently, what work do you personally do on a day-to-day basis for your livelihood?"
            return "q4_current_work_v1_en.wav", "Generational heritage is so respected! Today, what kind of work or activity do you personally do for your daily earnings?"

        elif next_field == "skills_and_interests":
            if use_v2:
                return "q5_skills_v2_en.wav", "Your dedication and daily hard work are truly inspiring! What are some skills you have learned, or trades you are passionate about pursuing?"
            return "q5_skills_v1_en.wav", "Thank you for sharing that! For our government vocational support, what skills do you currently possess or wish to learn?"

        elif next_field == "mobility_constraints":
            if use_v2:
                return "q6_mobility_v2_en.wav", "Those are wonderful and practical skills to build on! How do you feel about traveling for training or work opportunities — do you prefer staying nearby or are you open to nearby towns?"
            return "q6_mobility_v1_en.wav", "That sounds like a great field of interest! When thinking about training or job opportunities, what are your thoughts on traveling to nearby towns or staying local?"

        elif next_field == "employment_preference":
            if use_v2:
                return "q7_pref_v2_en.wav", "Understood, that makes complete sense! Looking ahead, what are your thoughts on starting a business or shop of your own versus working in a salaried role?"
            return "q7_pref_v1_en.wav", "Thank you, that is very helpful context! For your future growth, are you more inclined toward self-employment and your own enterprise, or a steady monthly salary?"

        elif next_field == "local_economic_context":
            if use_v2:
                return "q8_context_v2_en.wav", "That is a great direction to aim for! Could you tell me a little about the business and market environment around your local area?"
            return "q8_context_v1_en.wav", "Wishing you the very best with your aspirations! To identify the best local avenues, what kind of markets, shops, or industries are active around your area?"

        return "q2_education_v1_en.wav", "Could you please tell me about your schooling or education?"

    # ── Malayalam Flow (ml) ─────────────────────────────────────────────────────
    elif lang == "ml":
        if next_field == "educational_background":
            if use_v2:
                return "q2_education_v2_ml.wav", "വളരെ സന്തോഷം! നിങ്ങളുടെ പശ്ചാത്തലം മനസ്സിലാക്കാൻ, സ്കൂൾ വിദ്യാഭ്യാസം അല്ലെങ്കിൽ പഠനാനുഭവങ്ങളെക്കുറിച്ച് പറയാമോ?"
            return "q2_education_v1_ml.wav", "വളരെ സന്തോഷം! നിങ്ങളുടെ വിദ്യാഭ്യാസ പശ്ചാത്തലത്തെക്കുറിച്ച് കുറച്ച് പറയാമോ?"

        elif next_field == "family_occupation":
            if use_v2:
                return "q3_family_occ_v2_ml.wav", "വിവരങ്ങൾ പങ്കുവെച്ചതിന് നന്ദി! നിങ്ങളുടെ കുടുംബത്തിൽ പൂർവ്വികരോ മുതിർന്നവരോ പരമ്പരാഗതമായി എന്തൊക്കെ തൊഴിലുകളാണ് ചെയ്തിരുന്നത്?"
            return "q3_family_occ_v1_ml.wav", "വളരെ നല്ലത്! കുടുംബ പാരമ്പര്യം മനസ്സിലാക്കാൻ, നിങ്ങളുടെ കുടുംബത്തിൽ തലമുറകളായി എന്തൊക്കെ തൊഴിലുകളാണ് ചെയ്തുപോന്നത്?"

        elif next_field == "current_livelihood":
            if use_v2:
                return "q4_current_work_farming_ml.wav", "പാരമ്പര്യ നൈപുണ്യങ്ങൾ വലിയൊരു സമ്പത്താണ്! ഇപ്പോൾ താങ്കൾ സ്വന്തമായി ദിവസ വരുമാനത്തിനായി എന്തൊക്കെ ജോലികളാണ് ചെയ്യുന്നത്?"
            return "q4_current_work_gen_ml.wav", "അഭിനന്ദനങ്ങൾ! ഇപ്പോൾ താങ്കൾ സ്വന്തമായി ദിവസേന എന്തൊക്കെ ജോലികൾ ചെയ്താണ് ഉപജീവനം കണ്ടെത്തുന്നത്?"

        elif next_field == "skills_and_interests":
            if use_v2:
                return "q5_skills_v2_ml.wav", "നിങ്ങളുടെ അധ്വാനശീലം ഏറെ പ്രശംസനീയമാണ്! താങ്കൾക്ക് താല്പര്യമുള്ള മറ്റ് തൊഴിൽ നൈപുണ്യങ്ങൾ എന്തൊക്കെയാണെന്ന് പറയാമോ?"
            return "q5_skills_v1_ml.wav", "നന്ദി! സർക്കാർ നൈപുണ്യ പരിശീലനത്തിനായി, താങ്കൾ പഠിച്ചിട്ടുള്ളതോ പഠിക്കാൻ ആഗ്രഹിക്കുന്നതോ ആയ കഴിവുകൾ എന്തൊക്കെയാണ്?"

        elif next_field == "mobility_constraints":
            if use_v2:
                return "q6_mobility_cooking_ml.wav", "വളരെ നല്ല തൊഴിൽ താല്പര്യങ്ങൾ! പരിശീലനത്തിനോ ജോലിക്കോ ആയി അടുത്തുള്ള നഗരങ്ങളിലേക്ക് യാത്ര ചെയ്യുന്നതിനെക്കുറിച്ച് എന്താണ് അഭിപ്രായം?"
            return "q6_mobility_gen_ml.wav", "ശരി! പരിശീലനത്തിനോ ജോലിക്കോ ആയി സ്വന്തം പ്രദേശത്ത് നിൽക്കാനാണോ അതോ അടുത്തുള്ള ടൗണുകളിലേക്ക് പോകാനാണോ താല്പര്യം?"

        elif next_field == "employment_preference":
            if use_v2:
                return "q7_pref_v2_ml.wav", "തീർച്ചയായും മനസ്സിലാക്കുന്നു! ഭാവി വളർച്ചയ്ക്കായി സ്വന്തമായി ഒരു സംരംഭം തുടങ്ങാനാണോ അതോ മാസ ശമ്പളമുള്ള ജോലിയാണോ കൂടുതൽ ആഗ്രഹം?"
            return "q7_pref_v1_ml.wav", "വളരെ നല്ലത്! തൊഴിൽ മാർഗ്ഗനിർദ്ദേശത്തിനായി, സ്വന്തമായി ബിസിനസ് ചെയ്യുന്നതിലാണോ കമ്പനി ജോലിയിലാണോ താല്പര്യം?"

        elif next_field == "local_economic_context":
            if use_v2:
                return "q8_context_business_ml.wav", "നല്ലൊരു ലക്ഷ്യമാണത്! നിങ്ങളുടെ പ്രദേശത്ത് കൂടുതൽ സജീവമായിട്ടുള്ള കടകളോ വ്യവസായങ്ങളോ എന്തൊക്കെയാണെന്ന് പറയാമോ?"
            return "q8_context_gen_ml.wav", "നിങ്ങളുടെ ഭാവി പരിശ്രമങ്ങൾക്ക് എല്ലാ ആശംസകളും! നിങ്ങളുടെ പ്രദേശത്തെ ചന്തകളും തൊഴിൽ സാധ്യതകളും എങ്ങനെയുണ്ട്?"

        return "q2_education_v1_ml.wav", "വിദ്യാഭ്യാസ പശ്ചാത്തലത്തെക്കുറിച്ച് പറയാമോ?"

    # ── Hindi Flow (hi) ────────────────────────────────────────────────────────
    elif lang == "hi":
        if next_field == "educational_background":
            if use_v2:
                return "q2_education_v2_hi.wav", "आपसे बात करके बहुत खुशी हुई! आपकी पृष्ठभूमि को समझने के लिए, अपनी पढ़ाई और शिक्षा के बारे में कुछ बताइए?"
            return "q2_education_v1_hi.wav", "बहुत अच्छा! अपनी पढ़ाई और शिक्षा के बारे में हमें कुछ बताइए?"

        elif next_field == "family_occupation":
            if use_v2:
                return "q3_family_occ_v2_hi.wav", "यह जानकारी साझा करने के लिए धन्यवाद! आपके परिवार में पारंपरिक रूप से बुजुर्ग क्या काम या व्यवसाय करते आए हैं?"
            return "q3_family_occ_v1_hi.wav", "बहुत बढ़िया! आपकी पारिवारिक परंपरा को समझने के लिए, आपके परिवार में मुख्य रूप से क्या काम किया जाता है?"

        elif next_field == "current_livelihood":
            if use_v2:
                return "q4_current_work_farming_hi.wav", "पारंपरिक हुनर सचमुच बहुत मूल्यवान है! आजकल आप अपनी दैनिक आजीविका और कमाई के लिए मुख्य रूप से क्या काम करते हैं?"
            return "q4_current_work_gen_hi.wav", "शानदार! वर्तमान में आप अपने और अपने परिवार के भरण-पोषण के लिए दिनभर क्या काम करते हैं?"

        elif next_field == "skills_and_interests":
            if use_v2:
                return "q5_skills_v2_hi.wav", "आपकी मेहनत और लगन सचमुच सराहनीय है! आपने कौन-से हुनर सीखे हैं या किस काम को सीखने में आपकी गहरी रुचि है?"
            return "q5_skills_v1_hi.wav", "सरकारी कौशल प्रशिक्षण के लिए, आपके पास कौन-सी कला या हुनर है जिसे आप आगे बढ़ाना चाहते हैं?"

        elif next_field == "mobility_constraints":
            if use_v2:
                return "q6_mobility_cooking_hi.wav", "यह बहुत ही उपयोगी हुनर है! काम या प्रशिक्षण के लिए पास के कस्बे या शहर जाने के बारे में आपका क्या विचार है?"
            return "q6_mobility_gen_hi.wav", "बहुत अच्छा! प्रशिक्षण या रोजगार के लिए आप अपने गाँव में ही रहना पसंद करेंगे या आसपास के शहर भी जा सकते हैं?"

        elif next_field == "employment_preference":
            if use_v2:
                return "q7_pref_v2_hi.wav", "बिल्कुल सही! भविष्य में आप खुद की दुकान या व्यवसाय शुरू करना चाहते हैं, या किसी कंपनी में मासिक वेतन वाली नौकरी?"
            return "q7_pref_v1_hi.wav", "बहुत अच्छा! अपने भविष्य के लिए आपकी अधिक रुचि स्वरोजगार में है या बंधी-बंधाई मासिक नौकरी में?"

        elif next_field == "local_economic_context":
            if use_v2:
                return "q8_context_business_hi.wav", "यह बहुत अच्छी सोच है! आपके आसपास के बाजार या इलाके में किस प्रकार की दुकानें और कारोबार सबसे ज्यादा चलते हैं?"
            return "q8_context_gen_hi.wav", "आपके उज्ज्वल भविष्य की कामना करते हैं! आपके क्षेत्र में व्यापार और रोजगार के अवसर कैसे हैं?"

        return "q2_education_v1_hi.wav", "अपनी पढ़ाई और शिक्षा के बारे में बताइए?"

    # ── Telugu Flow (te) ───────────────────────────────────────────────────────
    elif lang == "te":
        if next_field == "educational_background":
            if use_v2:
                return "q2_education_v2_te.wav", "మీతో మాట్లాడటం చాలా సంతోషంగా ఉంది! మీ నేపథ్యం అర్థం చేసుకోవడానికి, మీ చదువు వివరాల గురించి కొంచెం చెబుతారా?"
            return "q2_education_v1_te.wav", "చాలా సంతోషం అండీ! మీ చదువు మరియు విద్యా నేపథ్యం గురించి కొంచెం చెబుతారా?"

        elif next_field == "family_occupation":
            if use_v2:
                return "q3_family_occ_v2_te.wav", "వివరాలు పంచుకున్నందుకు ధన్యవాదాలు! మీ కుటుంబంలో పెద్దలు సంప్రదాయకంగా లేదా తరతరాలుగా ఏ వృత్తి చేసేవారు?"
            return "q3_family_occ_v1_te.wav", "మంచిదండీ! మీ కుటుంబ వారసత్వాన్ని అర్థం చేసుకోవడానికి, మీ కుటుంబంలో సాధారణంగా ఏ పని చేస్తారు?"

        elif next_field == "current_livelihood":
            if use_v2:
                return "q4_current_work_farming_te.wav", "సంప్రదాయ నైపుణ్యాలు ఎంతో విలువైనవి! ప్రస్తుతం మీ రోజువారీ ఆదాయం మరియు జీవనాధారం కోసం ఏ పని చేస్తున్నారు?"
            return "q4_current_work_gen_te.wav", "చాలా మంచిది అండీ! ప్రస్తుతం మీ జీవనోపాధి కోసం ప్రతిరోజూ వ్యక్తిగతంగా ఏం పని చేస్తున్నారు?"

        elif next_field == "skills_and_interests":
            if use_v2:
                return "q5_skills_v2_te.wav", "మీ కష్టపడే తత్వం ఎంతో స్ఫూర్తిదాయకం! మీరు నేర్చుకున్న నైపుణ్యాలు లేదా నేర్చుకోవాలనుకుంటున్న పనులు ఏంటి?"
            return "q5_skills_v1_te.wav", "ప్రభుత్వ ఉచిత శిక్షణ కోసం, మీకు ఏయే రంగాలలో పని నైపుణ్యాలు లేదా ఆసక్తులు ఉన్నాయి?"

        elif next_field == "mobility_constraints":
            if use_v2:
                return "q6_mobility_cooking_te.wav", "ఇవి ఎంతో ఉపయోగకరమైన నైపుణ్యాలు! శిక్షణ లేదా ఉద్యోగాల కోసం పక్క ఊర్లకు లేదా పట్టణాలకు ప్రయాణం చేయడంపై మీ ఆలోచన ఏంటి?"
            return "q6_mobility_gen_te.wav", "సరేనండీ! ఉపాధి కోసం స్థానికంగా ఉండటం ఇష్టమా లేక సమీప పట్టణాలకు వెళ్లడానికి సిద్ధంగా ఉన్నారా?"

        elif next_field == "employment_preference":
            if use_v2:
                return "q7_pref_v2_te.wav", "బాగా చెప్పారు! భవిష్యత్తులో సొంతంగా దుకాణం లేదా వ్యాపారం పెట్టడం ఇష్టమా, లేక నెల జీతం ఉద్యోగమా?"
            return "q7_pref_v1_te.wav", "చాలా సంతోషం అండీ! మీ భవిష్యత్ ఉన్నతికి స్వయం ఉపాధిపై ఆసక్తి ఉందా లేక నిలకడైన ఉద్యోగమా?"

        elif next_field == "local_economic_context":
            if use_v2:
                return "q8_context_business_te.wav", "మంచి లక్ష్యం వైపు అడుగులు వేస్తున్నారు! మీ ప్రాంతంలో లేదా మార్కెట్లో ఎలాంటి వ్యాపారాలు ఎక్కువగా నడుస్తున్నాయి?"
            return "q8_context_gen_te.wav", "మీ లక్ష్యాలు నెరవేరాలని కోరుకుంటున్నాము! మీ పరిసర ప్రాంతాలలో వ్యాపార వాతావరణం, అవకాశాలు ఎలా ఉన్నాయి?"

        return "q2_education_v1_te.wav", "మీ చదువు వివరాల గురించి చెబుతారా?"

    # ── Tamil Flow (ta) ─────────────────────────────────────────────────────────
    else:
        if next_field == "educational_background":
            return "q_educational_background.wav", "உங்க படிப்பு என்னங்க, பள்ளிக்கூடம் போயிருக்கீங்களா?"

        elif next_field == "family_occupation":
            return "q_family_occupation.wav", "உங்க குடும்பத்தில் என்ன பாரம்பரிய தொழில் அல்லது வேலை செய்றாங்க?"

        elif next_field == "current_livelihood":
            return "q_current_livelihood.wav", "தற்போது உங்கள் தினசரி வருமானத்திற்கு என்ன வேலை செய்றீங்க?"

        elif next_field == "skills_and_interests":
            return "q_skills_and_interests.wav", "உங்களுக்கு தெரிந்த தொழில் அல்லது செய்ய விரும்பும் வேலை என்னங்க?"

        elif next_field == "mobility_constraints":
            return "q_mobility_constraints.wav", "வேலை வாய்ப்புக்காக பக்கத்து ஊர்களுக்கு போக முடியுமா?"

        elif next_field == "employment_preference":
            return "q_employment_preference.wav", "உங்களுக்கு சொந்தமாக தொழில் செய்ய விருப்பமா அல்லது மாத சம்பள வேலையா?"

        elif next_field == "local_economic_context":
            return "q_local_economic_context.wav", "உங்கள் ஊரில் என்ன கடைகள் அல்லது தொழில்கள் நல்லா நடக்குதுங்க?"

        return "q_educational_background.wav", "உங்க படிப்பு என்னங்க, பள்ளிக்கூடம் போயிருக்கீங்களா?"



def _get_question_for_field(next_field: str, user_speech: str, session: InterviewSession) -> Tuple[str, str]:
    """
    Selects warm, non-monotonous, appreciative question audio for all supported languages.
    Dynamically prepends empathetic active-listening acknowledgement (Sentence 1)
    to the open, respectful field inquiry prompt (Sentence 2).
    """
    lang = getattr(session, "language_code", "ta")
    turn_count = getattr(session, "turn_count", 0)
    use_v2 = (turn_count % 2 == 1)

    q_file, base_prompt = _select_field_prompt(next_field, session, lang, use_v2)

    # Dynamic empathetic acknowledgement of user speech (Sentence 1)
    custom_ack = _generate_conversational_acknowledgement(user_speech, lang)
    if custom_ack:
        full_text = f"{custom_ack} {base_prompt}"
        return q_file, full_text

    return q_file, base_prompt


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

        # Dynamic language detection and auto-switching based on caller speech
        if user_speech:
            detected_lang = detect_spoken_language(user_speech, current_lang=session.language_code)
            if detected_lang != session.language_code:
                logger.info(f"Language auto-switched from {session.language_code} to {detected_lang} based on user speech: '{user_speech}'")
                session.language_code = detected_lang
                lang = detected_lang

        # Guard: If interview is already completed, do not process trailing turns or re-dispatch notifications
        if session.state == InterviewState.COMPLETED:
            logger.info(f"Session {session.session_id} is already COMPLETED. Ignoring trailing speech: '{user_speech}'")
            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response="",
                audio_bytes=b"",
                state=InterviewState.COMPLETED,
                is_completed=True,
                case_id=session.session_id[:12].upper(),
                current_field=None,
                language_code=session.language_code,
            )

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
            # If caller is silent, empty speech, or pure noise after greeting
            if not user_speech or is_noise(user_speech):
                if lang == "en":
                    reprompt_text = "Hello, are you there? Can you hear me? Shall we proceed?"
                    reprompt_audio = await self._synthesize_safe(reprompt_text, "en", speaker=speaker)
                elif lang == "ml":
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
                await asyncio.sleep(0.075)
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
                await asyncio.sleep(0.075)
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
                    if lang == "en":
                        place_desc = f"from {session.caller_place}" if getattr(session, "caller_place", None) else "a local resident"
                        q1_text = f"Hello! Am I speaking with {session.caller_name}? Are you {place_desc}?"
                    elif lang == "ml":
                        q1_text = f"നമസ്കാരം! താങ്കൾ {session.caller_name} ആണോ സംസാരിക്കുന്നത്? താങ്കൾ {place_str}സ്വദേശി ആണോ?"
                    elif lang == "hi":
                        q1_text = f"नमस्ते! क्या आप {session.caller_name} जी बोल रहे हैं? क्या आप {place_str}से हैं?"
                    elif lang == "te":
                        q1_text = f"నమస్కారం! మీరు {session.caller_name} గారేనా? మీరు {place_str}గ్రామం నుంచేనా?"
                    else:
                        q1_text = f"வணக்கம்ங்க! நீங்க {session.caller_name} தானுங்களா? நீங்க {place_str}ஊர்லதான இருக்கீங்க?"
                    q1_audio = await self._synthesize_safe(q1_text, lang, speaker=speaker)
                else:
                    if lang == "en":
                        q1_text = "Thank you! To begin, could you please tell me your name and your village or town?"
                        q1_audio = await self._synthesize_safe(q1_text, "en", speaker=speaker)
                    elif lang == "ml":
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

                await asyncio.sleep(0.075)
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

            # If user said nothing, empty audio, or noise on course question, reprompt warmly
            if not user_speech or is_noise(user_speech) or is_connection_check(user_speech):
                if lang == "en":
                    reprompt_course = "Hello, among the three recommended courses, which one would you prefer?"
                elif lang == "ml":
                    reprompt_course = "ഹലോ, ശുപാർശ ചെയ്ത മൂന്ന് കോഴ്സുകളിൽ ഏതിലാണ് താല്പര്യമെന്ന് പറയാമോ?"
                elif lang == "hi":
                    reprompt_course = "नमस्ते, अनुशंसित तीन पाठ्यक्रमों में से आपकी किसमें रुचि है, कृपया बताइए?"
                elif lang == "te":
                    reprompt_course = "హలో అండీ, సిఫార్సు చేసిన మూడు కోర్సులలో మీకు ఏది ఇష్టమో చెబుతారా?"
                else:
                    reprompt_course = "ஹலோங்க, பரிந்துரைக்கப்பட்ட மூன்று பயிற்சிகளில் உங்களுக்கு எதில் விருப்பம்னு சொல்லுங்க?"

                reprompt_audio = await self._synthesize_safe(reprompt_course, lang, speaker=speaker)
                await asyncio.sleep(0.075)
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

            # If user merely gave a conversational affirmation filler without selecting an option
            if is_affirmation_filler(user_speech):
                if lang == "en":
                    aff_course = "Sure! Between the first, second, or third - which course would you prefer?"
                elif lang == "ml":
                    aff_course = "ശരി! ഒന്നാമത്തെ, രണ്ടാമത്തെ, അല്ലെങ്കിൽ മൂന്നാമത്തെ - ഇതിൽ ഏതാണ് താങ്കൾക്ക് വേണ്ടത് എന്ന് പറയാമോ?"
                elif lang == "hi":
                    aff_course = "ठीक है! पहला, दूसरा या तीसरा - इनमें से कौन सा कोर्स आप करना चाहेंगे?"
                elif lang == "te":
                    aff_course = "సరేనండీ! మొదటి, రెండవ లేదా మూడవ - వీటిలో ఏ కోర్సు మీకు కావాలో చెబుతారా?"
                else:
                    aff_course = "சரிங்க! முதலாவது, இரண்டாவது, அல்லது மூன்றாவது - இதில் எந்த பயிற்சி உங்களுக்கு வேணும்னு சொல்லுங்க?"

                aff_audio = await self._synthesize_safe(aff_course, lang, speaker=speaker)
                await asyncio.sleep(0.075)
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=aff_course,
                    audio_bytes=aff_audio,
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

            # Check 3rd choice first to avoid false substring match on '3' or 'மூன்று'
            if any(w in user_lower for w in [
                "3", "three", "third", "மூன்று", "மூணாவது", "மூணு", "மூன்றாவது", "மூன்றாம்", "தேர்ட்", "ஆப்ஷன் 3", "ஆப்ஷன் மூன்று", "ஆப்ஷன் மூணு",
                "तीसरा", "तीन", "ऑप्शन 3", "മൂന്ന്", "മൂന്നാമത്", "മൂന്നാമത്തെ", "మూడు", "మూడవ", "మూడో", "option 3", "option three"
            ]):
                choice_idx = 2 if len(courses) >= 3 else 0
            elif any(w in user_lower for w in [
                "2", "two", "second", "இரண்டு", "ரெண்டாவது", "இரண்டாவது", "ரெண்டு", "இரண்டாம்", "ரெண்டாம்", "செகண்ட்", "ஆப்ஷன் 2", "ஆப்ஷன் இரண்டு", "ஆப்ஷன் ரெண்டு",
                "दूसरा", "दो", "ऑप्शन 2", "രണ്ട്", "രണ്ടാമത്", "രണ്ടാമത്തെ", "రెండు", "రెండవ", "రెండో", "option 2", "option two"
            ]):
                choice_idx = 1 if len(courses) >= 2 else 0
            elif any(w in user_lower for w in [
                "1", "one", "first", "ஒன்று", "முதல்", "முதலாவது", "முதலாம்", "ஒன்னு", "பர்ஸ்ட்", "ஃபர்ஸ்ட்", "ஆப்ஷன் 1", "ஆப்ஷன் ஒன்று", "ஆப்ஷன் ஒன்னு",
                "पहला", "एक", "ऑप्शन 1", "ഒന്ന്", "ഒന്നാമത്", "ഒന്നാമത്തെ", "ఒకటి", "మొదటి", "ఒకటో", "option 1", "option one"
            ]):
                choice_idx = 0
            elif any(kw.lower() in user_lower for kw in c3_keywords if len(kw) > 2 and kw.lower() not in ["shop", "store", "work", "கடை", "வேலை"]):
                choice_idx = 2 if len(courses) >= 3 else 0
            elif any(kw.lower() in user_lower for kw in c2_keywords if len(kw) > 2 and kw.lower() not in ["shop", "store", "work", "கடை", "வேலை"]):
                choice_idx = 1 if len(courses) >= 2 else 0
            elif any(kw.lower() in user_lower for kw in c1_keywords if len(kw) > 2 and kw.lower() not in ["shop", "store", "work", "கடை", "வேலை"]):
                choice_idx = 0
            else:
                # Default to top recommendation if affirmative / general
                choice_idx = 0

            selected_course_dict = courses[choice_idx] if len(courses) > choice_idx else courses[0]
            selected_course_name = selected_course_dict["qp_name"]
            selected_course_local = get_localized_course_name(selected_course_dict, lang)

            session.citizen_selected_course = selected_course_name
            session.citizen_selected_choice = choice_idx + 1
            fsm.transition("course_selected", selected_course=selected_course_name, choice_idx=choice_idx + 1)
            case_id = session.session_id[:12].upper()
            # Preserve exact citizen responses (spoken transcript preferred, fallback to value)
            confirmed_dict = {
                k: (f.raw_transcript or f.value or "Recorded")
                for k, f in session.fields.items()
                if (f.status == "confirmed" or f.raw_transcript or f.value)
            }



            # Warm celebratory wrap-up text acknowledging selected course
            if lang == "en":
                wrap_text = f"Wonderful! Your selected course {selected_course_local} has been recorded. Complete details have been sent to your WhatsApp. Thank you, have a wonderful day!"
            elif lang == "ml":
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

            # Asynchronously dispatch post-call bilingual confirmation (WhatsApp + SMS) with pre-confirmed course (ONLY ONCE)
            if not getattr(session, "notification_dispatched", False):
                session.notification_dispatched = True

                async def _dispatch_and_update(rec_ref: dict):
                    try:
                        res = await self.notification_service.dispatch_bilingual_confirmation(
                            phone=phone,
                            language_code=lang,
                            case_id=case_id,
                            confirmed_fields=confirmed_dict,
                            caller_name=getattr(session, "caller_name", None),
                            recommended_courses=courses,
                            selected_course=selected_course_name,
                        )
                        if isinstance(res, dict):
                            rec_ref["notification_results"] = res
                            if res.get("whatsapp_link"):
                                rec_ref["whatsapp_link"] = res["whatsapp_link"]
                            if res.get("sms"):
                                rec_ref["sms_status"] = res["sms"]
                            _save_persisted_records()
                    except Exception as err:
                        logger.warning(f"Error in background notification dispatch: {err}")

                asyncio.create_task(_dispatch_and_update(record))

            # Keep session marked as COMPLETED in _active_sessions for 120s to absorb trailing frames, then clean up
            async def _cleanup_active_session_later(s_key: str):
                await asyncio.sleep(120.0)
                if s_key in self._active_sessions:
                    del self._active_sessions[s_key]

            asyncio.create_task(_cleanup_active_session_later(key))

            await asyncio.sleep(0.075)
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
            # 1. Noise, empty speech, or STT hallucination
            if not user_speech or is_noise(user_speech):
                if lang == "ml":
                    q1_text = "വളരെ നന്ദി! ആദ്യം താങ്കളുടെ പേരും ഏത് നാട്ടുകാരനാണ് എന്നും പറയാമോ?"
                    q1_audio = _get_static_bytes("q1_name_village_ml.wav")
                elif lang == "hi":
                    q1_text = "बहुत-बहुत धन्यवाद! सबसे पहले आपका शुभ नाम और आप किस गांव या शहर से हैं, यह बताइए?"
                    q1_audio = _get_static_bytes("q1_name_village_hi.wav")
                elif lang == "te":
                    q1_text = "చాలా ధన్యవాదాలు అండీ! ముందుగా మీ పేరు మరియు మీ ఊరు ఏదో చెబుతారా?"
                    q1_audio = _get_static_bytes("q1_name_village_te.wav")
                elif lang == "en":
                    q1_text = "Thank you! To begin, could you please tell me your name and your village or town?"
                    q1_audio = await self._synthesize_safe(q1_text, "en", speaker=speaker)
                else:
                    q1_text = "ரொம்ப சந்தோஷம்ங்க! முதல்ல உங்க பேரு மற்றும் உங்க ஊர் எதுன்னு சொல்லுங்க?"
                    q1_audio = _get_static_bytes("q_name_place.wav") or _get_static_bytes("q1_name_village.wav")

                q1_audio = q1_audio or await self._synthesize_safe(q1_text, lang, speaker=speaker)
                await asyncio.sleep(0.075)
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

            # 2. Connection audibility checks ("ஹலோ", "கேக்குதா", "hello", "can you hear me")
            if is_connection_check(user_speech):
                if lang == "en":
                    conn_text = "Hello! Can you hear me clearly? Could you please tell me your name and town?"
                elif lang == "ml":
                    conn_text = "നമസ്കാരം! ഞാൻ പറയുന്നത് കേൾക്കാമോ? ആദ്യം താങ്കളുടെ പേരും ഏത് നാട്ടുകാരനാണ് എന്നും പറയാമോ?"
                elif lang == "hi":
                    conn_text = "नमस्ते! क्या आप मुझे सुन पा रहे हैं? कृपया पहले अपना नाम और गांव बताइए?"
                elif lang == "te":
                    conn_text = "నమస్కారం అండీ! నేను మాట్లాడేది వినిపిస్తుందా? ముందుగా మీ పేరు మరియు మీ ఊరు ఏదో చెబుతారా?"
                else:
                    conn_text = "வணக்கம்ங்க! நான் பேசுறது கேக்குதுங்களா? முதல்ல உங்க பேரு மற்றும் உங்க ஊர் எதுன்னு சொல்லுங்க?"

                conn_audio = await self._synthesize_safe(conn_text, lang, speaker=speaker)
                await asyncio.sleep(0.075)
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=conn_text,
                    audio_bytes=conn_audio,
                    state=session.state,
                    is_completed=False,
                    case_id=None,
                    current_field=session.current_field,
                    language_code=lang,
                )

            # 3. Conversational affirmation filler ("சரி", "ஆம்", "ok", "yes")
            if is_affirmation_filler(user_speech):
                if lang == "en":
                    aff_text = "Sure! Could you please tell me your name and your village or town?"
                elif lang == "ml":
                    aff_text = "ശരി! ആദ്യം താങ്കളുടെ പേരും ഏത് നാട്ടുകാരനാണ് എന്നും പറയാമോ?"
                elif lang == "hi":
                    aff_text = "ठीक है! सबसे पहले अपना नाम और गांव बताइए?"
                elif lang == "te":
                    aff_text = "సరేనండీ! ముందుగా మీ పేరు మరియు మీ ఊరు ఏదో చెబుతారా?"
                else:
                    aff_text = "சரிங்க! முதல்ல உங்க பேரு மற்றும் உங்க ஊர் எதுன்னு சொல்லுங்க?"

                aff_audio = await self._synthesize_safe(aff_text, lang, speaker=speaker)
                await asyncio.sleep(0.075)
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=aff_text,
                    audio_bytes=aff_audio,
                    state=session.state,
                    is_completed=False,
                    case_id=None,
                    current_field=session.current_field,
                    language_code=lang,
                )

            # 4. If user simply stated their language preference (e.g., 'Tamil', 'தமிழ்', 'English'), don't treat it as their name!
            clean_token = user_lower.strip().replace(".", "").replace("!", "")
            is_just_lang = clean_token in (
                "tamil", "தமிழ்", "tamizh", "thamizh", "english", "hindi", "हिंदी", "telugu", "తెలుగు", "malayalam", "മലയാളം"
            )
            if is_just_lang:
                if lang == "ml":
                    q1_text = "വളരെ നന്ദി! ആദ്യം താങ്കളുടെ പേരും ഏത് നാട്ടുകാരനാണ് എന്നും പറയാമോ?"
                    q1_audio = _get_static_bytes("q1_name_village_ml.wav")
                elif lang == "hi":
                    q1_text = "बहुत-बहुत धन्यवाद! सबसे पहले आपका शुभ नाम और आप किस गांव या शहर से हैं, यह बताइए?"
                    q1_audio = _get_static_bytes("q1_name_village_hi.wav")
                elif lang == "te":
                    q1_text = "చాలా ధన్యవాదాలు అండీ! ముందుగా మీ పేరు మరియు మీ ఊరు ఏదో చెబుతారా?"
                    q1_audio = _get_static_bytes("q1_name_village_te.wav")
                elif lang == "en":
                    q1_text = "Thank you! To begin, could you please tell me your name and your village or town?"
                    q1_audio = await self._synthesize_safe(q1_text, "en", speaker=speaker)
                else:
                    q1_text = "ரொம்ப சந்தோஷம்ங்க! முதல்ல உங்க பேரு மற்றும் உங்க ஊர் எதுன்னு சொல்லுங்க?"
                    q1_audio = _get_static_bytes("q_name_place.wav") or _get_static_bytes("q1_name_village.wav")

                q1_audio = q1_audio or await self._synthesize_safe(q1_text, lang, speaker=speaker)
                await asyncio.sleep(0.075)
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

            session.identity_confirmed = True
            
            # Fast synchronous extraction of name / village from user speech
            raw_name = user_speech.split(",")[0].replace("என் பேரு", "").replace("പേര്", "").replace("मेरा नाम", "").replace("నా పేరు", "").strip()
            clean_token = raw_name.lower().strip(" .,!?:;")
            if clean_token in ("சரி", "ஆம்", "ம்", "ஹலோ", "வணக்கம்", "yes", "ok", "yeah", "done", "hello", "hi", "ha", "haan", "avunu") or len(clean_token) < 2:
                session.caller_name = "Beneficiary"
            else:
                session.caller_name = raw_name

            if lang == "en":
                q_edu = "Could you tell me a little about your schooling or education?"
                edu_audio = await self._synthesize_safe(q_edu, "en", speaker=speaker)
            elif lang == "ml":
                q_edu = "നിങ്ങളുടെ വിദ്യാഭ്യാസ പശ്ചാത്തലത്തെക്കുറിച്ച് പറയാമോ?"
                edu_audio = _get_static_bytes("q2_education_v1_ml.wav") or await self._synthesize_safe(q_edu, "ml", speaker=speaker)
            elif lang == "hi":
                q_edu = "अपनी पढ़ाई और शिक्षा के बारे में हमें कुछ बताइए?"
                edu_audio = _get_static_bytes("q2_education_v1_hi.wav") or await self._synthesize_safe(q_edu, "hi", speaker=speaker)
            elif lang == "te":
                q_edu = "మీ చదువు మరియు విద్యా నేపథ్యం గురించి చెబుతారా?"
                edu_audio = _get_static_bytes("q2_education_v1_te.wav") or await self._synthesize_safe(q_edu, "te", speaker=speaker)
            else:
                q_edu = "உங்க படிப்பு என்னங்க, பள்ளிக்கூடம் போயிருக்கீங்களா?"
                edu_audio = _get_static_bytes("q_educational_background.wav")

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

            await asyncio.sleep(0.075)
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
        if session.state == InterviewState.FIELD_COLLECTION:
            current_field = session.current_field
            if not current_field:
                current_field = "educational_background"
                session.current_field = current_field

            # 1. Reject pure noise or empty speech
            if not user_speech or is_noise(user_speech):
                q_file, q_text = _get_question_for_field(current_field, "", session)
                reprompt_audio = _get_static_bytes(q_file) or await self._synthesize_safe(q_text, lang, speaker=speaker)
                await asyncio.sleep(0.075)
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

            session.turn_count = getattr(session, "turn_count", 0) + 1

            # 2. Connection audibility check ("ஹலோ", "கேக்குதா", "hello", "can you hear me")
            if is_connection_check(user_speech):
                q_file, q_text = _get_question_for_field(current_field, "", session)
                if lang == "en":
                    conn_reply = f"Hello, I can hear you clearly! {q_text}"
                elif lang == "ml":
                    conn_reply = f"നമസ്കാരം, ഞാൻ പറയുന്നത് വ്യക്തമായി കേൾക്കുന്നുണ്ട്. {q_text}"
                elif lang == "hi":
                    conn_reply = f"नमस्ते, आपकी आवाज़ स्पष्ट आ रही है। {q_text}"
                elif lang == "te":
                    conn_reply = f"నమస్కారం అండీ, మీ స్వరం స్పష్టంగా వినిపిస్తోంది. {q_text}"
                else:
                    conn_reply = f"வணக்கம்ங்க, நான் பேசுறது தெளிவா கேக்குதுங்க! {q_text}"

                conn_audio = await self._synthesize_safe(conn_reply, lang, speaker=speaker)
                await asyncio.sleep(0.075)
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=conn_reply,
                    audio_bytes=conn_audio,
                    state=session.state,
                    is_completed=False,
                    case_id=None,
                    current_field=session.current_field,
                    language_code=lang,
                )

            # 3. Check if caller asks for clarification or repeats an unclear phrase
            is_clarification = any(q in user_lower for q in [
                "என்னங்க", "புரியல கொஞ்சம் சொல்லுங்க", "சொல்லுங்க", "சொல்லுங்கப்பா",
                "விளங்கலங்க", "கேக்கலங்க", "கேக்கலயா", "மன்னிப்பீங்க",
                "ரீபீட்", "மறுபடி", "திரும்ப", "புரியல என்ன சொன்னீங்க", "மறுபடியும் சொல்லுங்க",
                "മനസ്സിലായില്ല", "വ്യക്തമായില്ല", "എന്താണ് പറഞ്ഞത്", "വീണ്ടും പറയൂ", "ഒന്നുകൂടി പറയുമോ", "കേൾക്കുന്നില്ല",
                "समझ नहीं आया", "दोबारा बोलिए", "सुनाई नहीं दिया", "क्या कहा", "फिर से बोलो",
                "వినపడలేదు", "మళ్ళీ చెప్పండి", "అర్థం కాలేదు", "ఏమన్నారు",
                "repeat", "could you repeat", "say that again", "pardon", "did not hear", "couldn't hear", "what did you say", "sorry what", "what was that", "can you repeat"
            ])

            if is_clarification:
                if any(q in user_lower for q in [
                    "மறுபடி", "திரும்ப", "சொல்லுங்க", "விளங்கலங்க", "கேக்கலங்க", "புரியல என்ன சொன்னீங்க", "மறுபடியும் சொல்லுங்க",
                    "വീണ്ടും പറയൂ", "ഒന്നുകൂടി പറയുമോ", "വ്യക്തമായില്ല", "കേൾക്കുന്നില്ല",
                    "दोबारा बोलिए", "फिर से बोलो", "सुनाई नहीं दिया", "समझ नहीं आया",
                    "మళ్ళీ చెప్పండి", "వినపడలేదు", "అర్థం కాలేదు",
                    "repeat", "say that again", "pardon", "did not hear", "couldn't hear", "what did you say", "what was that"
                ]):
                    if lang == "en":
                        sorry_audio = _get_static_bytes("sorry_unclear_en.wav") or _get_static_bytes("sorry_repeat_en.wav")
                        sorry_text = "Sorry, I could not hear that clearly. Could you please say that again?"
                    elif lang == "ml":
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
                    await asyncio.sleep(0.075)
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
                await asyncio.sleep(0.075)
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

            # 4. Validate substantive answer for the current field
            is_valid_ans, reason = is_substantive_field_answer(current_field, user_speech, lang)
            if not is_valid_ans:
                if reason == "affirmation_filler":
                    # Caller acknowledged with 'சரி' / 'yes' / 'ok' without providing substantive details
                    if lang == "en":
                        field_prompts = {
                            "educational_background": "Sure! Could you tell me how far you studied in school or college?",
                            "family_occupation": "Sure! What work or occupation do people in your family usually do?",
                            "current_livelihood": "Sure! What work or business are you currently doing?",
                            "skills_and_interests": "Sure! What skills, training, or fields are you interested in?",
                            "local_economic_context": "Sure! What kinds of work or businesses are common in your local area?",
                            "employment_preference": "Sure! Would you prefer a regular wage job or running your own business?",
                        }
                    elif lang == "ml":
                        field_prompts = {
                            "educational_background": "ശരി! സ്കൂളിലോ കോളേജിലോ എത്ര വരെ പഠിച്ചിട്ടുണ്ടെന്ന് പറയാമോ?",
                            "family_occupation": "ശരി! കുടുംബത്തിൽ സാധാരണയായി എന്ത് ജോലിയാണ് ചെയ്യുന്നത് എന്ന് പറയാമോ?",
                            "current_livelihood": "ശരി! ഇപ്പോൾ താങ്കൾ എന്തെങ്കിലും ജോലിയോ ബിസിനസ്സോ ചെയ്യുന്നുണ്ടോ?",
                            "skills_and_interests": "ശരി! താങ്കൾക്ക് ഏത് മേഖലയിലാണ് താല്പര്യമോ പ്രവൃത്തിപരിചയമോ ഉള്ളത്?",
                            "local_economic_context": "ശരി! താങ്കളുടെ നാട്ടിൽ സാധാരണയായി ആളുകൾ എന്ത് ജോലിയാണ് ചെയ്യുന്നത്?",
                            "employment_preference": "ശരി! കമ്പനി ജോലിയാണോ സ്വന്തമായി ബിസിനസ്സ് ചെയ്യുന്നതാണോ കൂടുതൽ താല്പര്യം?",
                        }
                    elif lang == "hi":
                        field_prompts = {
                            "educational_background": "ठीक है! आपने स्कूल या कॉलेज में कहाँ तक पढ़ाई की है, कृपया बताइए?",
                            "family_occupation": "ठीक है! आपके परिवार में आमतौर पर क्या काम या पेशा किया जाता है?",
                            "current_livelihood": "ठीक है! इस समय आप क्या काम या रोज़गार कर रहे हैं?",
                            "skills_and_interests": "ठीक है! आपको किस काम या क्षेत्र में रुचि या अनुभव है?",
                            "local_economic_context": "ठीक है! आपके इलाके में आमतौर पर लोग क्या काम करते हैं?",
                            "employment_preference": "ठीक है! आप नौकरी करना पसंद करेंगे या अपना खुद का काम शुरू करना?",
                        }
                    elif lang == "te":
                        field_prompts = {
                            "educational_background": "సరేనండీ! మీరు పాఠశాల లేదా కళాశాలలో ఎంతవరకు చదువుకున్నారో చెబుతారా?",
                            "family_occupation": "సరేనండీ! మీ కుటుంబంలో సాధారణంగా ఎలాంటి వృత్తి లేదా పని చేస్తుంటారు?",
                            "current_livelihood": "సరేనండీ! ప్రస్తుతం మీరు ఎలాంటి పని లేదా వ్యాపారం చేస్తున్నారు?",
                            "skills_and_interests": "సరేనండీ! మీకు ఏ రంగంలో ఆసక్తి లేదా అనుభవం ఉందో చెబుతారా?",
                            "local_economic_context": "సరేనండీ! మీ ప్రాంతంలో ఎక్కువగా ఎలాంటి పనులు లేదా వ్యాపారాలు ఉన్నాయి?",
                            "employment_preference": "సరేనండీ! మీకు ఉద్యోగం చేయాలని ఉందా లేక సొంతంగా వ్యాపారం చేయాలని ఉందా?",
                        }
                    else:
                        field_prompts = {
                            "educational_background": "சரிங்க! நீங்க எந்த வகுப்பு வரை படிச்சிருக்கீங்கன்னு சொல்லுங்களேன்?",
                            "family_occupation": "சரிங்க! உங்க குடும்பத்துல வழக்கமா என்ன தொழில் அல்லது வேலை செய்றாங்கன்னு சொல்லுங்களேன்?",
                            "current_livelihood": "சரிங்க! இப்போதைக்கு நீங்க என்ன வேலை அல்லது தொழில் செய்றீங்கன்னு சொல்லுங்களேன்?",
                            "skills_and_interests": "சரிங்க! உங்களுக்கு எந்த வேலை அல்லது துறையில ஆர்வம் அல்லது திறமை இருக்குன்னு சொல்லுங்களேன்?",
                            "local_economic_context": "சரிங்க! உங்க ஊர்ல பொதுவாக மக்கள் என்ன வேலை அல்லது தொழில் செய்றாங்கன்னு சொல்லுங்களேன்?",
                            "employment_preference": "சரிங்க! உங்களுக்கு கம்பெனி வேலை செய்ய விருப்பமா, அல்லது சொந்தமா தொழில் தொடங்க விருப்பமான்னு சொல்லுங்களேன்?",
                        }
                    prompt_text = field_prompts.get(current_field, "சரிங்க! அதுபத்தி கொஞ்சம் விரிவா சொல்லுங்களேன்?")
                    prompt_audio = await self._synthesize_safe(prompt_text, lang, speaker=speaker)
                    await asyncio.sleep(0.075)
                    return CoordinatorTurnResult(
                        session_id=session.session_id,
                        spoken_response=prompt_text,
                        audio_bytes=prompt_audio,
                        state=session.state,
                        is_completed=False,
                        case_id=None,
                        current_field=session.current_field,
                        language_code=lang,
                    )
                else:
                    # Noise, grunt, or unintelligible audio
                    q_file, q_text = _get_question_for_field(current_field, "", session)
                    if lang == "en":
                        repeat_text = f"Sorry, I couldn't hear that clearly. {q_text}"
                    elif lang == "ml":
                        repeat_text = f"ക്ഷമിക്കണം, വ്യക്തമായി കേട്ടില്ല. {q_text}"
                    elif lang == "hi":
                        repeat_text = f"माफ़ कीजिए, आवाज़ स्पष्ट नहीं आई। {q_text}"
                    elif lang == "te":
                        repeat_text = f"క్షమించండి, స్పష్టంగా వినిపించలేదు. {q_text}"
                    else:
                        repeat_text = f"மன்னிச்சுக்கோங்க, சரியா கேக்கலங்க. {q_text}"

                    repeat_audio = await self._synthesize_safe(repeat_text, lang, speaker=speaker)
                    await asyncio.sleep(0.075)
                    return CoordinatorTurnResult(
                        session_id=session.session_id,
                        spoken_response=repeat_text,
                        audio_bytes=repeat_audio,
                        state=session.state,
                        is_completed=False,
                        case_id=None,
                        current_field=session.current_field,
                        language_code=lang,
                    )

            # 5. Genuine, Substantive Answer: Populate and Advance
            if current_field and current_field in session.fields:
                session.fields[current_field].status = "confirmed"
                session.fields[current_field].value = normalize_field_to_english(current_field, user_speech.strip(), lang)
                session.fields[current_field].raw_transcript = user_speech.strip()

            # Fast Multi-Field Semantic Co-Inference
            inferred = _infer_semantic_fields_fast(user_speech, lang)
            for inf_key, inf_val in inferred.items():
                if inf_key in session.fields and session.fields[inf_key].status != "confirmed":
                    session.fields[inf_key].value = normalize_field_to_english(inf_key, inf_val, lang)
                    session.fields[inf_key].raw_transcript = user_speech.strip()
                    # If caller proactively stated their employment preference or mobility constraints, mark as confirmed so advance_to_next_field() automatically skips re-asking them
                    if inf_key in ("employment_preference", "mobility_constraints") and inf_key != current_field:
                        session.fields[inf_key].status = "confirmed"

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
                c3_local = get_localized_course_name(top_courses[2], lang) if len(top_courses) >= 3 else "சிறப்பு தொழில் பயிற்சி"

                if lang == "en":
                    ask_course_text = f"Thank you! Your details have been successfully recorded. Based on your background, we recommend top three courses: First, {c1_local}, second, {c2_local}, and third, {c3_local}. Which one would you prefer?"
                elif lang == "ml":
                    ask_course_text = f"വളരെ നന്ദി! നിങ്ങളുടെ എല്ലാ വിവരങ്ങളും വിജയകരമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്. നിങ്ങളുടെ താല്പര്യപ്രകാരം മൂന്ന് മികച്ച കോഴ്സുകൾ ശുപാർശ ചെയ്യുന്നു: ഒന്ന്, {c1_local}. രണ്ട്, {c2_local}. മൂന്ന്, {c3_local}. ഇതിൽ ഏതിലാണ് നിങ്ങൾക്ക് കൂടുതൽ താല്പര്യം?"
                elif lang == "hi":
                    ask_course_text = f"बहुत-बहुत धन्यवाद! आपकी सभी जानकारी सफलतापूर्वक दर्ज कर ली गई है। आपके लिए तीन बेहतरीन पाठ्यक्रम हैं: पहला, {c1_local}, दूसरा, {c2_local}, और तीसरा, {c3_local}। इनमें से आपकी किसमें अधिक रुचि है?"
                elif lang == "te":
                    ask_course_text = f"చాలా ధన్యవాదాలు అండీ! మీ వివరాలన్నీ విజయవంతంగా నమోదయ్యాయి. మీ కోసం మూడు ఉత్తమ కోర్సులు ఉన్నాయి: ఒకటి, {c1_local}, రెండు, {c2_local}, మూడు, {c3_local}. వీటిలో మీకు దేనిపై ఎక్కువ ఆసక్తి ఉంది?"
                else:
                    ask_course_text = f"மிக்க நன்றிங்க! உங்க அனைத்து விவரங்களும் முறையாக பதிவாகிவிட்டது. உங்க திறனுக்கும் விருப்பத்திற்கும் ஏற்ற மூன்று சிறந்த பயிற்சிகள்: ஒன்று, {c1_local}. இரண்டு, {c2_local}. மூன்று, {c3_local}. இந்த மூன்றில் உங்களுக்கு எந்த பயிற்சியில் அதிக விருப்பம் உள்ளது?"

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

                await asyncio.sleep(0.075)
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

            await asyncio.sleep(0.075)
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
            await asyncio.sleep(0.075)
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
        await asyncio.sleep(0.075)
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
        session_item = self._active_sessions.get(key)
        if not session_item and session_key:
            session_item = self._active_sessions.get(f"{channel}_{phone}")
        if not session_item:
            clean_p = clean_indian_phone(phone)
            for k, v in list(self._active_sessions.items()):
                s = v.get("session")
                if s and clean_indian_phone(getattr(s, "phone", "") or "") == clean_p:
                    session_item = v
                    key = k
                    break

        if session_item:
            session = session_item["session"]

            # Extract actual citizen answers from session.fields (raw spoken transcripts or values)
            confirmed_dict = {
                k: (f.raw_transcript or f.value or "Recorded")
                for k, f in session.fields.items()
                if (f.status == "confirmed" or f.raw_transcript or f.value)
            }
            confirmed_dict_english = {
                k: normalize_field_to_english(k, f.value or f.raw_transcript or "Recorded", getattr(session, "language_code", "ta"))
                for k, f in session.fields.items()
                if (f.status == "confirmed" or f.raw_transcript or f.value)
            }

            has_intake = len(confirmed_dict) >= 1 or session.state in (InterviewState.COURSE_SELECTION, InterviewState.COMPLETED)

            if has_intake and not getattr(session, "notification_dispatched", False):
                session.notification_dispatched = True
                case_id = session.session_id[:12].upper()
                lang = getattr(session, "preferred_language", None) or getattr(session, "language_code", "ta")
                courses = getattr(session, "recommended_courses", [])
                if not courses:
                    courses = compute_top_recommended_courses(confirmed_dict_english, getattr(session, "transcript_turns", []))
                    session.recommended_courses = courses

                selected_course_name = getattr(session, "citizen_selected_course", None)
                if not selected_course_name and courses:
                    selected_course_name = get_short_english_name(courses[0])
                if not selected_course_name:
                    selected_course_name = "PM-AJAY Vocational Training"

                # Check if already present in _completed_calls_records
                existing_rec = next((r for r in _completed_calls_records if r.get("case_id") == case_id), None)
                if not existing_rec:
                    record = {
                        "session_id": session.session_id,
                        "case_id": case_id,
                        "phone": phone,
                        "beneficiary_name": getattr(session, "caller_name", None) or f"Citizen ({phone[-4:] if len(phone)>=4 else phone})",
                        "channel": channel,
                        "language": lang,
                        "status": "BENEFICIARY_CONFIRMED" if session.state == InterviewState.COMPLETED else "BENEFICIARY_AUTO_RECORDED",
                        "citizen_confirmed": True,
                        "confirmed_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "notification_status": "DISPATCHED",
                        "completed_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                        "confirmed_fields": confirmed_dict,
                        "turns_count": len(getattr(session, "transcript_turns", [])),
                        "transcript": list(getattr(session, "transcript_turns", [])),
                        "recommended_courses": courses,
                        "citizen_selected_choice": getattr(session, "citizen_selected_choice", 1),
                        "citizen_selected_course": selected_course_name,
                    }
                    _completed_calls_records.insert(0, record)
                    if len(_completed_calls_records) > 100:
                        _completed_calls_records.pop()
                    _save_persisted_records()
                else:
                    record = existing_rec

                async def _dispatch_notifications_on_disconnect(rec_ref: dict):
                    try:
                        res = await self.notification_service.dispatch_bilingual_confirmation(
                            phone=phone,
                            language_code=lang,
                            case_id=case_id,
                            confirmed_fields=confirmed_dict,
                            caller_name=getattr(session, "caller_name", None),
                            recommended_courses=courses,
                            selected_course=selected_course_name,
                        )
                        if isinstance(res, dict):
                            rec_ref["notification_results"] = res
                            if res.get("whatsapp_link"):
                                rec_ref["whatsapp_link"] = res["whatsapp_link"]
                            if res.get("sms"):
                                rec_ref["sms_status"] = res["sms"]
                            _save_persisted_records()
                    except Exception as err:
                        logger.warning(f"Error dispatching notification on disconnect: {err}")

                asyncio.create_task(_dispatch_notifications_on_disconnect(record))

            await self.sm.mark_session_dropped(session.session_id)
            if key in self._active_sessions:
                del self._active_sessions[key]
