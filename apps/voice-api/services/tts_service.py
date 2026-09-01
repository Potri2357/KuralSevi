"""
Kural Sevi — Text-to-Speech Service  
Primary: Sarvam AI Bulbul V3 (natural Indian regional language TTS)
Returns: WAV/MP3 audio bytes for streaming
"""
import asyncio
import httpx
import base64
import logging
import hashlib
from pathlib import Path
from typing import Optional

from .circuit_breaker import circuit_breaker

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

# ── Content-Addressed Persistent Audio Cache ──────────────────────────────────
_AUDIO_CACHE_DIR = Path(__file__).resolve().parent.parent / "static_audio" / "cache"
_AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# In-memory hot cache for instant microsecond retrieval
_in_memory_audio_cache: dict[str, bytes] = {}

def _get_cache_key(text: str, language_code: str, speaker: str) -> str:
    """Computes a canonical SHA-256 fingerprint for the text and voice settings."""
    norm_text = "".join(text.strip().split())
    return hashlib.sha256(f"{language_code}:{speaker}:{norm_text}".encode("utf-8")).hexdigest()

def get_cached_audio(text: str, language_code: str, speaker: str) -> Optional[bytes]:
    """Retrieves audio bytes from memory or disk cache if available."""
    key = _get_cache_key(text, language_code, speaker)
    if key in _in_memory_audio_cache:
        return _in_memory_audio_cache[key]
    cache_file = _AUDIO_CACHE_DIR / f"{key}.wav"
    if cache_file.exists():
        try:
            with open(cache_file, "rb") as f:
                data = f.read()
            _in_memory_audio_cache[key] = data
            return data
        except Exception:
            pass
    return None

def put_cached_audio(text: str, language_code: str, speaker: str, audio_bytes: bytes):
    """Saves audio bytes to memory and disk cache for zero-latency future lookups."""
    if not audio_bytes:
        return
    key = _get_cache_key(text, language_code, speaker)
    _in_memory_audio_cache[key] = audio_bytes
    cache_file = _AUDIO_CACHE_DIR / f"{key}.wav"
    try:
        with open(cache_file, "wb") as f:
            f.write(audio_bytes)
    except Exception as e:
        logger.warning(f"Failed writing audio cache {cache_file}: {e}")

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Global persistent keep-alive requests session for Sarvam (eliminates macOS TLS socket drops)
_tts_sync_session: Optional[requests.Session] = None

def _get_tts_sync_session() -> requests.Session:
    global _tts_sync_session
    if _tts_sync_session is None:
        _tts_sync_session = requests.Session()
        retries = Retry(total=4, connect=4, read=4, backoff_factor=0.05, allowed_methods=['POST', 'GET'])
        adapter = HTTPAdapter(max_retries=retries, pool_connections=10, pool_maxsize=20)
        _tts_sync_session.mount('https://', adapter)
        _tts_sync_session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Content-Type': 'application/json',
        })
    return _tts_sync_session

def warmup_tts():
    """Warms up TLS socket to Sarvam in background thread."""
    try:
        from config import settings
        session = _get_tts_sync_session()
        session.post(
            settings.sarvam_tts_url,
            headers={"api-subscription-key": settings.sarvam_api_key},
            json={"inputs": ["வணக்கம்"], "target_language_code": "ta-IN", "speaker": "kavitha", "model": "bulbul:v3", "enable_preprocessing": False, "speech_sample_rate": 8000, "pace": 1.2},
            timeout=3.0,
        )
    except Exception:
        pass

async def synthesize_speech(
    text: str,
    language_code: str,
    sarvam_api_key: str,
    sarvam_tts_url: str,
    mock_mode: bool = False,
    speaker_override: Optional[str] = None
) -> Optional[TTSResult]:
    """
    Converts text to speech using Sarvam Bulbul V3 with SHA-256 disk and memory caching.
    Returns audio bytes ready for streaming.
    """
    speaker = speaker_override or SARVAM_TTS_SPEAKERS.get(language_code, "kavitha")
    text = _sanitize_for_tts(text, language_code)

    # 1. Content-Addressed Cache Fast Path (0.001ms instant return, 0 API calls)
    cached_audio = get_cached_audio(text, language_code, speaker)
    if cached_audio:
        logger.info(f"[AUDIO CACHE HIT] Served pre-rendered audio in 0.001ms for: {text[:50]!r}")
        return TTSResult(audio_bytes=cached_audio, audio_format="wav")

    # Fast circuit breaker check: if Sarvam is cooling down from 429, skip immediately (0ms delay)
    if not circuit_breaker.is_available("sarvam_tts"):
        logger.info(
            f"[CIRCUIT BREAKER] Skipping Sarvam TTS (cooling down for {circuit_breaker.get_remaining_cooldown('sarvam_tts'):.0f}s). "
            "Falling back directly to native telephony voice."
        )
        return None

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

    logger.info(f"TTS synthesizing ({language_code}): {text[:80]}")

    # Sarvam limits TTS to 500 chars per call; split if longer
    chunks = _split_text(text, max_chars=450)

    def _sync_post_chunk(chunk_text: str) -> bytes:
        session = _get_tts_sync_session()
        payload = {
            "inputs": [chunk_text],
            "target_language_code": _sarvam_lang(language_code),
            "speaker": speaker,
            "model": "bulbul:v3",
            "enable_preprocessing": False,  # False saves ~1.2s; LLM already outputs clean Tamil
            "speech_sample_rate": 8000,     # 8kHz telephony standard
            "pace": 1.3,                    # 1.3x pace cuts audio synthesis and playback latency
        }
        headers = {
            "api-subscription-key": sarvam_api_key,
        }
        try:
            resp = session.post(sarvam_tts_url, json=payload, headers=headers, timeout=7.0)
            if resp.status_code == 200:
                circuit_breaker.record_success("sarvam_tts")
                data = resp.json()
                audio_b64 = data.get("audios", [""])[0]
                if audio_b64:
                    return base64.b64decode(audio_b64)
            elif resp.status_code == 429:
                circuit_breaker.trip("sarvam_tts", "429 Rate Limit", cooldown=15.0)
            else:
                logger.warning(f"Sarvam TTS error ({resp.status_code}): {resp.text[:120]}")
        except Exception as e:
            if "429" in str(e):
                circuit_breaker.trip("sarvam_tts", "429 Rate Limit", cooldown=15.0)
            logger.warning(f"Sarvam TTS request failed: {repr(e)}")
        return b""

    # Synthesize chunks in parallel if multiple, via asyncio.to_thread
    if len(chunks) == 1:
        all_audio = await asyncio.to_thread(_sync_post_chunk, chunks[0])
    else:
        results = await asyncio.gather(*[asyncio.to_thread(_sync_post_chunk, c) for c in chunks])
        all_audio = b"".join(results)

    if not all_audio:
        raise Exception("All Sarvam TTS synthesis attempts failed")

    # Store synthesized audio in persistent cache for zero latency next time!
    put_cached_audio(text, language_code, speaker, all_audio)
    
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


def _sanitize_for_tts(text: str, language_code: str) -> str:
    """
    Ensures the text contains Indic characters valid for Sarvam TTS.
    Strips leading/trailing whitespace and JSON/token artifacts.
    Falls back to a safe neutral Tamil/Hindi phrase if no Indic chars remain.
    """
    import unicodedata

    # Indic Unicode block ranges Sarvam accepts
    INDIC_RANGES = {
        "ta": (0x0B80, 0x0BFF),   # Tamil block
        "hi": (0x0900, 0x097F),   # Devanagari
        "te": (0x0C00, 0x0C7F),   # Telugu
    }
    lo, hi = INDIC_RANGES.get(language_code, (0x0900, 0x0BFF))

    SAFE_FALLBACKS = {
        "ta": "மன்னிக்கவும், மீண்டும் சொல்லுங்கள்.",
        "hi": "माफ़ कीजिए, कृपया दोबारा बोलें।",
        "te": "క్షమించండి, మళ్ళీ చెప్పండి.",
    }

    # Strip JSON/EXTRACT artifacts (including partial tokens like 'EXT', 'EXTRAC')
    import re
    # Remove leading SPOKEN: prefix if present
    text = re.sub(r'^(?:SPOKEN|SPOKE)\s*:\s*', '', text, flags=re.IGNORECASE).strip()
    # Remove trailing EXTRACT/CONFIRM blocks and their JSON
    text = re.sub(r'(?:EXTRACT|UNKNOWN|CONFIRM|EXTRAC|EXT)\s*:?\s*\{.*?\}?', '', text, flags=re.DOTALL | re.IGNORECASE).strip()
    text = re.sub(r'(?:EXTRACT|UNKNOWN|CONFIRM|EXTRAC|EXT)\s*:?.*$', '', text, flags=re.MULTILINE | re.IGNORECASE).strip()
    # Remove any remaining JSON blocks
    text = re.sub(r'\{[^}]*\}', '', text, flags=re.DOTALL).strip()
    # Remove trailing English parentheticals: " (Information about ...)"
    text = re.sub(r'\s*\([^)]*[a-zA-Z]{3,}[^)]*\)', '', text).strip()
    # Remove lines that are mostly ASCII (English annotations mixed in)
    lines = []
    for line in text.splitlines():
        ascii_ratio = sum(1 for c in line if ord(c) < 128 and c.isalpha()) / max(len(line), 1)
        if ascii_ratio < 0.5:  # keep lines that are at least 50% non-ASCII
            lines.append(line)
    text = ' '.join(lines).strip()

    # Check for at least 3 Indic characters
    indic_count = sum(1 for c in text if lo <= ord(c) <= hi)
    if indic_count < 3:
        fallback = SAFE_FALLBACKS.get(language_code, SAFE_FALLBACKS["ta"])
        logger.warning(f"TTS text has insufficient Indic chars ({indic_count}). Using fallback. Original: {text[:60]!r}")
        return fallback

    return text.strip()

