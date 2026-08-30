"""
Kural Sevi — Speech-to-Text Service
Primary: Sarvam AI Saaras (Indian regional languages, real-time)
Fallback: Bhashini (government-aligned, for production)
Mock mode: returns canned transcripts for local development
"""
import httpx
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

SARVAM_LANGUAGE_CODES = {
    "ta": "ta-IN",
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
    mock_transcript: Optional[str] = None
) -> STTResult:
    """
    Transcribes audio using Sarvam AI Saaras.
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
    
    sarvam_lang = SARVAM_LANGUAGE_CODES.get(language_code, "hi-IN")
    audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
    
    payload = {
        "model": "saaras:v2",
        "language_code": sarvam_lang,
        "audio": audio_b64,
        "with_timestamps": False,
        "with_disfluencies": False,
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            sarvam_stt_url,
            json=payload,
            headers={
                "api-subscription-key": sarvam_api_key,
                "Content-Type": "application/json",
            }
        )
        
        if response.status_code != 200:
            logger.error(f"Sarvam STT error: {response.status_code} {response.text}")
            raise Exception(f"STT failed: {response.status_code}")
        
        data = response.json()
        transcript = data.get("transcript", "")
        # Sarvam returns confidence per word; compute average
        confidences = [w.get("confidence", 0.8) for w in data.get("words", [])]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.75
        
        return STTResult(
            transcript=transcript,
            confidence=avg_confidence,
            language_code=language_code
        )
