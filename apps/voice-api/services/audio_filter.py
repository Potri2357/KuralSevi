"""
Kural Sevi — Telephony Acoustic Noise, Hallucination & Conversational Filler Filter
Ensures outside noise, line static, short grunts, and conversational fillers ("ஹலோ", "சரி", "yes")
do not falsely trigger field completion or prematurely advance interview questions.
"""
import re
from typing import Tuple, Optional

# Non-speech tokens, STT noise hallucinations, and bracketed audio descriptors
_STT_NOISE_TOKENS = {
    "thank you", "thank you.", "thanks", "thanks.", "thank you very much",
    "okay", "okay.", "ok", "ok.", "yes", "yes.", "no", "no.", "bye", "goodbye",
    "you", "the", ".", "..", "...", "--", "-", ",", "?", "!",
    "[noise]", "[music]", "[applause]", "[laughter]", "[cough]", "[throat-clearing]",
    "(inaudible)", "[inaudible]", "[silence]", "(silence)", "(music)", "(applause)",
    "inaudible", "applause", "laughter"
}

# Single-syllable non-lexical vocalizations, grunts, and line static in Indic & English
_VOCAL_GRUNTS = {
    "ம்", "ஆங்", "அ", "ஆ", "ஓ", "ஊ", "ஏ", "அம்", "உம்", "ம்ம்", "ஆமா",
    "uh", "um", "uhh", "umm", "hmm", "hm", "hmmm", "ah", "ahh", "oh", "er", "eh",
    "haan", "ha", "hun", "mm", "mmm"
}

# Connection checks and telephone audibility inquiries
_CONNECTION_TOKENS = [
    "ஹலோ", "ஹலோங்க", "ஹலோ கேக்குதா", "கேக்குதா", "கேக்குதுங்களா", "கேட்கிறதா",
    "சொல்லுங்க", "சொல்லுங்கப்பா", "சொல்லுங்கம்மா", "வணக்கம்", "ஹாய்", "ஆலோ",
    "hello", "hello?", "can you hear me", "am i audible", "hi", "hey",
    "सुन रहे हैं", "हेलो", "ఆలో", "వినిపిస్తుందా", "ഹലോ", "കേൾക്കുന്നുണ്ടോ"
]

# Pure conversational affirmations (listening acknowledgment, but NOT substantive answers)
_AFFIRMATION_TOKENS = {
    "சரி", "சரிங்க", "சரிப்பா", "ஆம்", "ஆமா", "ஆமாங்க", "ம் சரி", "ஓகே", "எஸ்",
    "yes", "yeah", "yep", "ok", "okay", "sure", "done", "alright", "right",
    "haan", "ha", "theek hai", "sahi", "avunu", "sari", "shery", "athe"
}


def clean_transcript(text: Optional[str]) -> str:
    """Strips brackets, leading/trailing punctuation, and normalizes whitespace."""
    if not text:
        return ""
    # Remove bracketed STT tags like [music], (inaudible)
    cleaned = re.sub(r"\[.*?\]|\(.*?\)", "", str(text)).strip()
    # Remove leading/trailing non-word punctuation
    cleaned = re.sub(r"^[\s.,!?;:\-_'\"/\\~`]+|[\s.,!?;:\-_'\"/\\~`]+$", "", cleaned).strip()
    return cleaned


def is_noise(text: Optional[str]) -> bool:
    """
    Returns True if the transcribed text is acoustic background noise,
    a bracketed non-speech event, a non-lexical grunt, or an STT hallucination.
    """
    if not text:
        return True
    cleaned = clean_transcript(text)
    if not cleaned or len(cleaned) < 2:
        return True

    lower = cleaned.lower().strip(" .,!?:;")
    if lower in _STT_NOISE_TOKENS or lower in _VOCAL_GRUNTS:
        return True

    # If text is solely punctuation or symbols
    if not re.search(r"[\w\u0900-\u0D7F]", cleaned):
        return True

    return False


def is_connection_check(text: Optional[str]) -> bool:
    """
    Returns True if caller is simply saying 'Hello? Can you hear me?'
    to test the telephone line before speaking their real answer.
    """
    if not text:
        return False
    lower = clean_transcript(text).lower().strip(" .,!?:;")
    if not lower:
        return False

    for token in _CONNECTION_TOKENS:
        if lower == token or lower == f"{token}?" or lower == f"{token}!":
            return True
        if lower.startswith(token) and len(lower.split()) <= 2:
            return True

    return False


def is_affirmation_filler(text: Optional[str]) -> bool:
    """
    Returns True if the response is strictly an affirmative filler word
    (e.g. 'சரி', 'yes', 'ok', 'ஆமா') without any substantive content.
    """
    if not text:
        return False
    lower = clean_transcript(text).lower().strip(" .,!?:;")
    return lower in _AFFIRMATION_TOKENS


def is_substantive_field_answer(field_name: str, text: Optional[str], lang: str = "ta") -> Tuple[bool, str]:
    """
    Determines whether caller speech constitutes a genuine answer to the given field question
    versus ambient noise, telephone line checking, or a conversational filler.

    Returns:
        (is_valid, reason)
        where reason is one of: 'valid', 'noise', 'connection_check', 'affirmation_filler', 'too_short'
    """
    if not text:
        return False, "noise"

    cleaned = clean_transcript(text)
    if is_noise(cleaned):
        return False, "noise"

    if is_connection_check(cleaned):
        return False, "connection_check"

    # Mobility constraints can legitimately be answered with Yes / No / Sure / Can travel
    if field_name == "mobility_constraints":
        # If user says Yes/Sure/சரி, that means they CAN travel
        if is_affirmation_filler(cleaned) or any(k in cleaned.lower() for k in ["முடியும்", "போகலாம்", "போவேன்", "yes", "can", "ok", "travel"]):
            return True, "valid"
        if any(k in cleaned.lower() for k in ["முடியாது", "போகமாட்டேன்", "மாட்டா", "no", "cant", "cannot", "local"]):
            return True, "valid"

    # Employment preference (Self-employed vs Wage job)
    if field_name == "employment_preference":
        # Pure affirmation is not enough; needs to indicate own business or job
        if is_affirmation_filler(cleaned):
            return False, "affirmation_filler"
        return True, "valid"

    # Open-ended profile fields require substantive information (not just 'சரி' or 'yes')
    # e.g., education, family occupation, current work, skills, local economic context
    if is_affirmation_filler(cleaned):
        return False, "affirmation_filler"

    # Ensure there is at least one meaningful word (length >= 2 characters)
    words = [w for w in cleaned.split() if len(w.strip(" .,!?;:")) >= 2]
    if not words:
        return False, "too_short"

    return True, "valid"
