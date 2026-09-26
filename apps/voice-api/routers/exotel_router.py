"""
Kural Sevi — Exotel ExoML IVR Telephony Transport Adapter
Handles Indian domestic calls using Exotel.
Supports high-accuracy regional Indian languages (Tamil, Malayalam, Hindi, Telugu):
- Spoken output: Sarvam AI Bulbul v3 (kavitha / priya) via ExoML <Play>
- Spoken input: Dual mode via recording transcription / DTMF feedback
- Zero-latency consent audio: Pre-rendered static regional WAVs
"""
import logging
import uuid
import asyncio
import xml.sax.saxutils as saxutils
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, Request, Response, Depends

from services.interview_coordinator import (
    InterviewCoordinator,
    CoordinatorTurnResult,
)
from services.interview_fsm import InterviewState
from services.stt_service import transcribe_audio
from config import settings

router = APIRouter(prefix="/webhooks/exotel", tags=["Exotel India IVR"])
logger = logging.getLogger(__name__)

_coordinator = InterviewCoordinator()

def get_coordinator() -> InterviewCoordinator:
    return _coordinator

_STATIC_AUDIO_DIR = Path(__file__).resolve().parent.parent / "static_audio"
_AUDIO_DISK_DIR = Path("/tmp/kuralsevi_exotel_audio")
_AUDIO_DISK_DIR.mkdir(parents=True, exist_ok=True)

_SILENT_WAV = bytes([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    0x66, 0x6D, 0x74, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x40, 0x1F, 0x00, 0x00, 0x80, 0x3E, 0x00, 0x00, 0x02, 0x00, 0x10, 0x00,
    0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00
])

_audio_cache: dict[str, bytes] = {}

def _detect_audio_media_type(data: bytes) -> str:
    if data.startswith(b"ID3") or (len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0):
        return "audio/mpeg"
    return "audio/wav"

def _cache_audio(audio_bytes: bytes) -> str:
    audio_id = str(uuid.uuid4())
    _audio_cache[audio_id] = audio_bytes
    try:
        (_AUDIO_DISK_DIR / f"{audio_id}.wav").write_bytes(audio_bytes)
    except Exception as e:
        logger.warning(f"Failed to persist Exotel audio {audio_id} to disk: {e}")
    return audio_id

def _escape(text: str) -> str:
    return saxutils.escape(text or "")

# ── Audio Streaming for Exotel <Play> ───────────────────────────────────────────

@router.api_route("/audio/{audio_id}.wav", methods=["GET", "HEAD", "POST"])
async def get_audio_wav(audio_id: str):
    """Streams synthesized audio (WAV/MP3) directly to Exotel."""
    c_name = audio_id if audio_id.endswith(".wav") else f"{audio_id}.wav"
    static_file = _STATIC_AUDIO_DIR / c_name
    if static_file.exists():
        data = static_file.read_bytes()
        return Response(content=data, media_type=_detect_audio_media_type(data))

    if audio_id in ("hold_ta", "hold"):
        hold_file = _STATIC_AUDIO_DIR / "hold_ta.wav"
        if hold_file.exists():
            data = hold_file.read_bytes()
            return Response(content=data, media_type=_detect_audio_media_type(data))

    if audio_id.startswith("consent"):
        parts = audio_id.split("_")
        lang = parts[1] if len(parts) > 1 else "ta"
        c_lang = _STATIC_AUDIO_DIR / f"consent_{lang}.wav"
        if c_lang.exists():
            data = c_lang.read_bytes()
            return Response(content=data, media_type=_detect_audio_media_type(data))

    audio_bytes = _audio_cache.get(audio_id)
    if audio_bytes:
        return Response(content=audio_bytes, media_type=_detect_audio_media_type(audio_bytes))

    disk_file = _AUDIO_DISK_DIR / f"{audio_id}.wav"
    if disk_file.exists():
        try:
            data = disk_file.read_bytes()
            _audio_cache[audio_id] = data
            return Response(content=data, media_type=_detect_audio_media_type(data))
        except Exception:
            pass

    return Response(content=_SILENT_WAV, media_type="audio/wav")

# ── Exotel Passthru Webhook Endpoints ───────────────────────────────────────────

@router.api_route("/interview-start", methods=["GET", "POST"])
@router.api_route("/interv", methods=["GET", "POST"])
async def start_interview(
    request: Request,
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """
    Initiates an Exotel IVR interview turn.
    Returns ExoML <Response><Play>...</Play></Response>.
    Plays instant pre-rendered regional consent audio (consent_ta.wav)
    with 0ms dial-in latency.
    """
    form_data = {}
    if request.method == "POST":
        try:
            form = await request.form()
            form_data = dict(form)
        except Exception:
            pass
    query_data = dict(request.query_params)
    data = {**query_data, **form_data}

    CallSid = data.get("CallSid") or data.get("CallSidLegacy") or str(uuid.uuid4())
    target_phone = data.get("From") or data.get("Caller") or data.get("To") or "+919342900638"
    language = data.get("language") or request.query_params.get("language") or "en"

    # Fire fresh session initialization in background
    asyncio.create_task(coordinator.process_turn(
        phone=target_phone,
        channel="ivr",
        language=language,
        session_key=CallSid,
        is_initial=True,
        force_fresh=True,
    ))

    base_voice_url = settings.voice_api_url.rstrip("/")
    consent_file = f"consent_{language}.wav"
    if not (_STATIC_AUDIO_DIR / consent_file).exists():
        consent_file = "consent_en.wav"
    if not (_STATIC_AUDIO_DIR / consent_file).exists():
        consent_file = "consent_ta.wav"

    consent_url = f"{base_voice_url}/webhooks/exotel/audio/{consent_file}"
    turn_action_url = f"{base_voice_url}/webhooks/exotel/interview-turn?language={language}"

    # ExoML: Plays greeting first, gathers DTMF or records speech with natural pause tolerance
    exoml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="{_escape(turn_action_url)}" method="POST" timeout="6" maxDigits="1">
        <Play>{_escape(consent_url)}</Play>
    </Gather>
    <Record action="{_escape(turn_action_url)}" method="POST" timeout="5" maxLength="45" finishOnKey="#" playBeep="false" trimSilence="true"/>
    <Redirect method="POST">{_escape(turn_action_url)}</Redirect>
</Response>"""

    logger.info(f"[Exotel] Started {language} call {CallSid} for {target_phone} via ExoML (English Language Selection First)")
    return Response(
        content=exoml, 
        media_type="text/xml",
        headers={"Content-Type": "text/xml; charset=utf-8"}
    )

@router.api_route("/interview-turn", methods=["GET", "POST"])
@router.api_route("/greeting-turn", methods=["GET", "POST"])
async def handle_turn(
    request: Request,
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """
    Receives caller input / DTMF / voice recording from Exotel.
    Automatically detects spoken language (Tamil, Hindi, Telugu, Malayalam, English).
    Transitions interview state, synthesizes response in detected language, and returns ExoML.
    """
    form_data = {}
    if request.method == "POST":
        try:
            form = await request.form()
            form_data = dict(form)
        except Exception:
            pass
    query_data = dict(request.query_params)
    data = {**query_data, **form_data}

    CallSid = data.get("CallSid") or str(uuid.uuid4())
    raw_digits = data.get("Digits") or data.get("digits") or ""
    digits = raw_digits.replace('"', '').replace("'", "").strip()
    language = data.get("language") or request.query_params.get("language") or "ta"
    phone = data.get("From") or data.get("Caller") or data.get("To") or "+919342900638"
    recording_url = (
        data.get("RecordingUrl") or data.get("recording_url") or
        data.get("RecordingUrlLegacy") or data.get("recording_url_legacy")
    )

    user_text = data.get("user_speech") or data.get("SpeechResult") or data.get("CallTranscription") or digits
    if recording_url:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(recording_url, timeout=12.0)
                if resp.status_code == 200:
                    stt = await transcribe_audio(
                        audio_bytes=resp.content,
                        language_code=language,
                        sarvam_api_key=settings.sarvam_api_key,
                        sarvam_stt_url=settings.sarvam_stt_url,
                        mock_mode=False,
                    )
                    if stt and stt.transcript:
                        user_text = stt.transcript.strip()
                        logger.info(f"[Exotel STT] Transcribed voice speech: '{user_text}' (confidence={stt.confidence})")
        except Exception as e:
            logger.warning(f"[Exotel] Failed to download or transcribe recording {recording_url}: {e}")

    # DTMF keypad fallbacks (handles clean 1, 2, 3)
    if digits == "1":
        user_text = "1 (English)"
    elif digits == "2":
        user_text = "2 (தமிழ் - Tamil)"
    elif digits == "3":
        user_text = "3 (हिंदी - Hindi)"
    elif digits == "4":
        user_text = "4 (తెలుగు - Telugu)"
    elif digits == "5":
        user_text = "5 (മലയാളം - Malayalam)"

    user_speech = (user_text or "").strip()

    try:
        res = await coordinator.process_turn(
            phone=phone,
            channel="ivr",
            user_speech=user_speech,
            stt_confidence=0.95,
            language=language,
            session_key=CallSid,
        )
    except Exception as e:
        logger.error(f"[Exotel] Error processing turn: {e}", exc_info=True)
        res = CoordinatorTurnResult(
            session_id=CallSid,
            spoken_response="வணக்கம். உங்கள் விவரங்கள் பதிவு செய்யப்படுகின்றன.",
            audio_bytes=None,
            state=InterviewState.FIELD_COLLECTION,
            is_completed=False,
            case_id=None,
            current_field=None,
            language_code=language,
        )

    # Use dynamically detected language for subsequent turns
    next_language = getattr(res, "language_code", None) or language
    base_voice_url = settings.voice_api_url.rstrip("/")
    turn_action_url = f"{base_voice_url}/webhooks/exotel/interview-turn?language={next_language}"

    if res.is_completed:
        if res.audio_bytes:
            audio_id = _cache_audio(res.audio_bytes)
            audio_url = f"{base_voice_url}/webhooks/exotel/audio/{audio_id}.wav"
            exoml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>{_escape(audio_url)}</Play>
    <Pause length="1"/>
    <Hangup/>
</Response>"""
        else:
            exoml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Thank you.</Say>
    <Pause length="1"/>
    <Hangup/>
</Response>"""
        return Response(content=exoml, media_type="text/xml")

    # Next turn prompt in the auto-detected language
    if res.audio_bytes:
        audio_id = _cache_audio(res.audio_bytes)
        audio_url = f"{base_voice_url}/webhooks/exotel/audio/{audio_id}.wav"
        
        # If called by Exotel Greeting applet, return the audio URL directly as text/plain
        if request.url.path.endswith("greeting-turn") or data.get("format") == "text":
            return Response(content=audio_url, media_type="text/plain")

        exoml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="{_escape(turn_action_url)}" method="POST" timeout="6" maxDigits="1">
        <Play>{_escape(audio_url)}</Play>
    </Gather>
    <Record action="{_escape(turn_action_url)}" method="POST" timeout="5" maxLength="45" finishOnKey="#" playBeep="false" trimSilence="true"/>
    <Redirect method="POST">{_escape(turn_action_url)}</Redirect>
</Response>"""
    else:
        exoml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>{_escape(res.spoken_response[:300])}</Say>
    <Record action="{_escape(turn_action_url)}" method="POST" timeout="5" maxLength="45" finishOnKey="#" playBeep="false" trimSilence="true"/>
    <Redirect method="POST">{_escape(turn_action_url)}</Redirect>
</Response>"""

    return Response(
        content=exoml, 
        media_type="text/xml",
        headers={"Content-Type": "text/xml; charset=utf-8"}
    )


@router.api_route("/call-end", methods=["GET", "POST"])
@router.api_route("/call-status", methods=["GET", "POST"])
@router.api_route("/disconnect", methods=["GET", "POST"])
async def exotel_call_status(
    request: Request,
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """
    Handles Exotel hangup or status callback.
    Triggers immediate post-call bilingual confirmation dispatch (SMS + WhatsApp)
    with the citizen's exact recorded responses.
    """
    form_data = {}
    if request.method == "POST":
        try:
            form = await request.form()
            form_data = dict(form)
        except Exception:
            pass
    query_data = dict(request.query_params)
    data = {**query_data, **form_data}

    CallSid = data.get("CallSid") or data.get("CallSidLegacy") or ""
    phone = data.get("From") or data.get("Caller") or data.get("To") or ""
    status = data.get("Status") or data.get("CallStatus") or "completed"

    logger.info(f"[Exotel Status] Call {CallSid} for {phone} ended with status: {status}")
    if phone:
        await coordinator.handle_disconnect(phone=phone, channel="ivr", session_key=CallSid or None)

    return Response(content="<Response/>", media_type="text/xml")

