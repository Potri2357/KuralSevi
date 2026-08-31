"""
Kural Sevi — Text-to-Speech Service  
Primary: Sarvam AI Bulbul V3 (natural Indian regional language TTS)
Returns: WAV/MP3 audio bytes for streaming
"""
import httpx
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

SARVAM_TTS_SPEAKERS = {
    "ta": "kavitha",    # Tamil speaker (bulbul:v3 compatible)
    "hi": "priya",      # Hindi speaker (bulbul:v3 compatible)
    "te": "kavitha",    # Telugu speaker (bulbul:v3 compatible)
}

class TTSResult:
    def __init__(self, audio_bytes: bytes, audio_format: str = "wav"):
        self.audio_bytes = audio_bytes
        self.audio_format = audio_format

async def synthesize_speech(
    text: str,
    language_code: str,
    sarvam_api_key: str,
    sarvam_tts_url: str,
    mock_mode: bool = False,
    speaker_override: Optional[str] = None
) -> TTSResult:
    """
    Converts text to speech using Sarvam Bulbul V3.
    Returns audio bytes ready for streaming.
    """
    if mock_mode:
        logger.info(f"[MOCK TTS] Would speak ({language_code}): {text[:80]}...")
        # Return a minimal WAV header (silent audio) for testing
        wav_header = bytes([
            0x52,0x49,0x46,0x46,0x24,0x00,0x00,0x00,0x57,0x41,0x56,0x45,
            0x66,0x6D,0x74,0x20,0x10,0x00,0x00,0x00,0x01,0x00,0x01,0x00,
            0x40,0x1F,0x00,0x00,0x80,0x3E,0x00,0x00,0x02,0x00,0x10,0x00,
            0x64,0x61,0x74,0x61,0x00,0x00,0x00,0x00
        ])
        return TTSResult(audio_bytes=wav_header, audio_format="wav")
    
    speaker = speaker_override or SARVAM_TTS_SPEAKERS.get(language_code, "anushka")
    
    # Sarvam limits TTS to 500 chars per call; split if longer
    chunks = _split_text(text, max_chars=490)
    all_audio = b""
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for chunk in chunks:
            payload = {
                "inputs": [chunk],
                "target_language_code": _sarvam_lang(language_code),
                "speaker": speaker,
                "model": "bulbul:v3",
                "enable_preprocessing": True,
                "speech_sample_rate": 8000,  # 8kHz for telephony
            }
            
            response = await client.post(
                sarvam_tts_url,
                json=payload,
                headers={
                    "api-subscription-key": sarvam_api_key,
                    "Content-Type": "application/json",
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Sarvam TTS error: {response.status_code} {response.text}")
                raise Exception(f"TTS failed: {response.status_code}")
            
            data = response.json()
            audio_b64 = data.get("audios", [""])[0]
            if audio_b64:
                all_audio += base64.b64decode(audio_b64)
    
    return TTSResult(audio_bytes=all_audio, audio_format="wav")

def _sarvam_lang(code: str) -> str:
    return {"ta": "ta-IN", "hi": "hi-IN", "te": "te-IN"}.get(code, "hi-IN")

def _split_text(text: str, max_chars: int = 490) -> list[str]:
    if len(text) <= max_chars:
        return [text]
    chunks = []
    while text:
        if len(text) <= max_chars:
            chunks.append(text)
            break
        # Split at last sentence boundary before max_chars
        cut = text.rfind(". ", 0, max_chars)
        if cut == -1:
            cut = max_chars
        chunks.append(text[:cut + 1].strip())
        text = text[cut + 1:].strip()
    return chunks
