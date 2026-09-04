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

    async with httpx.AsyncClient(http2=True, timeout=30.0, headers={"User-Agent": "curl/8.7.1"}) as client:
        response = await client.post(
            sarvam_stt_url,
            files=files,
            data=data,
            headers=headers
        )

        if response.status_code != 200:
            logger.error(f"Sarvam STT error: {response.status_code} {response.text}")
            raise Exception(f"STT failed: {response.status_code} - {response.text}")

        res_json = response.json()
        transcript = res_json.get("transcript", "").strip()

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
