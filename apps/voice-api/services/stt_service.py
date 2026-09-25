"""
Kural Sevi — Speech-to-Text Service
Primary: Sarvam AI Saarika v2.5 / Saaras (Indian regional languages, real-time)
Fallback: Bhashini (government-aligned, for production)
Mock mode: returns canned transcripts for local development
"""
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

SARVAM_LANGUAGE_CODES = {
    "ta": "ta-IN",
    "ml": "ml-IN",
    "hi": "hi-IN",
    "te": "te-IN",
}

class STTResult:
    def __init__(self, transcript: str, confidence: float, language_code: str):
        self.transcript = transcript
        self.confidence = confidence
        self.language_code = language_code

_stt_async_client: Optional[httpx.AsyncClient] = None

def _get_stt_client() -> httpx.AsyncClient:
    global _stt_async_client
    if _stt_async_client is None or _stt_async_client.is_closed:
        limits = httpx.Limits(max_keepalive_connections=20, max_connections=40, keepalive_expiry=30.0)
        _stt_async_client = httpx.AsyncClient(
            http2=True,
            timeout=httpx.Timeout(5.0, connect=3.0),
            limits=limits,
            headers={"User-Agent": "curl/8.7.1"}
        )
    return _stt_async_client

async def transcribe_audio(
    audio_bytes: bytes,
    language_code: str,
    sarvam_api_key: str,
    sarvam_stt_url: str,
    mock_mode: bool = False,
    mock_transcript: Optional[str] = None,
    filename: str = "audio.wav",
    content_type: str = "audio/wav",
) -> STTResult:
    """
    Transcribes audio using Sarvam AI (saarika:v2.5 / multipart form-data).
    Returns transcript with confidence score.
    """
    if mock_mode:
        transcript = mock_transcript or f"[Mock transcript in {language_code}] I am a tailor and I want to do self-employment."
        logger.info(f"[MOCK STT] Returning mock transcript for {language_code}")
        return STTResult(
            transcript=transcript,
            confidence=0.92,
            language_code=language_code
        )

    sarvam_lang = SARVAM_LANGUAGE_CODES.get(language_code, "ta-IN")

    # Detect extension/mime from filename if available
    fn = filename or "audio.wav"
    ct = content_type or "audio/wav"
    if fn.endswith(".webm") or "webm" in ct:
        fn = "audio.webm"
        ct = "audio/webm"
    elif fn.endswith(".mp4") or "mp4" in ct:
        fn = "audio.mp4"
        ct = "audio/mp4"

    files = {
        "file": (fn, audio_bytes, ct)
    }
    data = {
        "model": "saarika:v2.5",
        "language_code": sarvam_lang,
    }
    headers = {
        "api-subscription-key": sarvam_api_key,
    }

    try:
        client = _get_stt_client()
        response = await client.post(
            sarvam_stt_url,
            files=files,
            data=data,
            headers=headers
        )

        if response.status_code != 200:
            logger.warning(f"Sarvam STT returned {response.status_code} ({response.text[:120]}); falling back to Google Gemini 2.5 Flash STT.")
            return await _transcribe_gemini_fallback(audio_bytes, language_code, ct)

        res_json = response.json()
        transcript = res_json.get("transcript", "").strip()
    except Exception as e:
        logger.warning(f"Sarvam STT connection failed ({e}); falling back to Google Gemini 2.5 Flash STT.")
        return await _transcribe_gemini_fallback(audio_bytes, language_code, ct)

    # If transcript was empty (e.g. ambient background or silence)
    if not transcript:
        logger.info("Sarvam STT returned empty transcript (silence or non-speech)")
        return STTResult(
            transcript="",
            confidence=0.5,
            language_code=language_code
        )

    # Sarvam returns confidence per word or overall
    words = res_json.get("words", [])
    if words:
        confidences = [w.get("confidence", 0.85) for w in words if isinstance(w, dict)]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.85
    else:
        avg_confidence = float(res_json.get("confidence", 0.88))

    return STTResult(
        transcript=transcript,
        confidence=avg_confidence,
        language_code=language_code
    )

async def _transcribe_gemini_fallback(audio_bytes: bytes, language_code: str, content_type: str = "audio/wav") -> STTResult:
    """Multimodal fallback transcription using Google Gemini 2.5 Flash."""
    import base64
    from config import settings
    gemini_key = settings.google_ai_api_key
    if not gemini_key:
        logger.error("No GOOGLE_AI_API_KEY available for STT fallback.")
        return STTResult(transcript="", confidence=0.0, language_code=language_code)

    mime = "audio/wav"
    if "webm" in content_type:
        mime = "audio/webm"
    elif "mp4" in content_type:
        mime = "audio/mp4"

    b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
    payload = {
        "contents": [{
            "parts": [
                {"inlineData": {"mimeType": mime, "data": b64_audio}},
                {"text": f"Transcribe this audio recording verbatim in {language_code}. Return ONLY the transcribed text without quotes, formatting, or commentary."}
            ]
        }]
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                logger.info(f"Gemini STT fallback success: {text[:60]!r}")
                return STTResult(transcript=text, confidence=0.92, language_code=language_code)
            else:
                logger.error(f"Gemini STT fallback failed: {res.status_code} {res.text[:120]}")
    except Exception as e:
        logger.error(f"Gemini STT fallback exception: {e}")

    return STTResult(transcript="", confidence=0.0, language_code=language_code)
