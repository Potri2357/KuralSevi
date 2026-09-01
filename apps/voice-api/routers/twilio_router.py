"""
Kural Sevi — Twilio IVR & Twilio WhatsApp Transport Adapter (FR-4a, FR-4b)
Pure protocol translation layer:
HTTP / TwiML Forms <───> InterviewCoordinator

Async Pattern for Twilio 15s Webhook Timeout:
  1. /interview-turn: Immediately returns <Play> hold audio + <Redirect> to /interview-result
  2. Background asyncio.Task runs LLM + TTS in parallel
  3. /interview-result: Polls until result is ready, then returns real TwiML
"""
import logging
import uuid
import asyncio
import httpx
from fastapi import APIRouter, Request, Response, Form, Depends
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.twiml.messaging_response import MessagingResponse
from typing import Optional

from services.interview_coordinator import InterviewCoordinator, CoordinatorTurnResult
from services.stt_service import transcribe_audio
from config import settings

router = APIRouter(prefix="/webhooks/twilio", tags=["Twilio IVR & WhatsApp"])
logger = logging.getLogger(__name__)

# Shared application coordinator instance
_coordinator = InterviewCoordinator()

from pathlib import Path

_STATIC_AUDIO_DIR = Path(__file__).resolve().parent.parent / "static_audio"
_AUDIO_DISK_DIR = Path("/tmp/kuralsevi_audio")
_AUDIO_DISK_DIR.mkdir(parents=True, exist_ok=True)

# Minimal 0.5s valid PCM WAV header to prevent Twilio Error 12300/11200
_SILENT_WAV = bytes([
    0x52,0x49,0x46,0x46,0x24,0x00,0x00,0x00,0x57,0x41,0x56,0x45,
    0x66,0x6D,0x74,0x20,0x10,0x00,0x00,0x00,0x01,0x00,0x01,0x00,
    0x40,0x1F,0x00,0x00,0x80,0x3E,0x00,0x00,0x02,0x00,0x10,0x00,
    0x64,0x61,0x74,0x61,0x00,0x00,0x00,0x00
])

# Audio cache: audio_id -> WAV bytes
_audio_cache: dict[str, bytes] = {}

# Pending result cache: turn_id -> CoordinatorTurnResult | None (None = still processing)
_pending_results: dict[str, Optional[CoordinatorTurnResult]] = {}

def get_coordinator() -> InterviewCoordinator:
    return _coordinator


# ── Audio Streaming Endpoint for Twilio <Play> ──────────────────────────────────

@router.api_route("/audio/{audio_id}.wav", methods=["GET", "HEAD", "POST"])
async def get_audio_wav(audio_id: str):
    """Streams synthesized Sarvam AI Tamil audio WAV directly to Twilio."""
    if audio_id in ("hold_ta", "hold"):
        hold_file = _STATIC_AUDIO_DIR / "hold_ta.wav"
        if hold_file.exists():
            return Response(content=hold_file.read_bytes(), media_type="audio/wav")
    if audio_id in ("consent_ta", "consent"):
        consent_file = _STATIC_AUDIO_DIR / "consent_ta.wav"
        if consent_file.exists():
            return Response(content=consent_file.read_bytes(), media_type="audio/wav")

    # 2. In-memory cache
    audio_bytes = _audio_cache.get(audio_id)
    if audio_bytes:
        return Response(content=audio_bytes, media_type="audio/wav")

    # 3. Disk cache
    disk_file = _AUDIO_DISK_DIR / f"{audio_id}.wav"
    if disk_file.exists():
        try:
            data = disk_file.read_bytes()
            _audio_cache[audio_id] = data
            return Response(content=data, media_type="audio/wav")
        except Exception:
            pass

    # 4. Fallback: NEVER return 404 (404 causes Twilio "An application error has occurred" drop)
    logger.warning(f"Audio ID {audio_id} not found in cache. Serving fallback audio.")
    hold_file = _STATIC_AUDIO_DIR / "hold_ta.wav"
    if hold_file.exists():
        return Response(content=hold_file.read_bytes(), media_type="audio/wav")
    return Response(content=_SILENT_WAV, media_type="audio/wav")


def _cache_audio(audio_bytes: bytes) -> str:
    """Stores audio bytes in memory and on disk, returns playable URL path segment."""
    audio_id = str(uuid.uuid4())
    _audio_cache[audio_id] = audio_bytes
    try:
        (_AUDIO_DISK_DIR / f"{audio_id}.wav").write_bytes(audio_bytes)
    except Exception as e:
        logger.warning(f"Failed to persist audio {audio_id} to disk: {e}")
    return audio_id


def _play_or_say(response: VoiceResponse, turn_result: CoordinatorTurnResult, log_label: str = ""):
    """Appends <Play> or <Say> depending on whether audio was synthesized."""
    if turn_result.audio_bytes:
        audio_id = _cache_audio(turn_result.audio_bytes)
        audio_url = f"{settings.voice_api_url}/webhooks/twilio/audio/{audio_id}.wav"
        logger.info(f"Serving Sarvam TTS {log_label} via <Play>: {audio_url}")
        response.play(audio_url)
    else:
        logger.warning(f"No Sarvam audio {log_label}, falling back to Tamil <Say>")
        response.say(turn_result.spoken_response[:300], language="ta-IN")


def _build_gather_response(turn_result: CoordinatorTurnResult) -> VoiceResponse:
    """Builds a final TwiML response with nested <Gather><Play>...</Play></Gather> for natural barge-in and zero conversational lag."""
    response = VoiceResponse()
    if turn_result.is_completed:
        _play_or_say(response, turn_result, log_label="(completion)")
        response.hangup()
        return response

    gather = Gather(
        input="speech",
        action=f"{settings.voice_api_url}/webhooks/twilio/interview-turn",
        method="POST",
        language="ta-IN",
        speech_timeout="1",        
        timeout=8,
        action_on_empty_result=True,
        speech_model="phone_call",
        barge_in=True,
    )
    if turn_result.audio_bytes:
        audio_id = _cache_audio(turn_result.audio_bytes)
        audio_url = f"{settings.voice_api_url}/webhooks/twilio/audio/{audio_id}.wav"
        logger.info(f"Serving Sarvam TTS (turn) via nested <Gather><Play>: {audio_url}")
        gather.play(audio_url)
    else:
        hold_url = f"{settings.voice_api_url}/webhooks/twilio/audio/hold_ta.wav"
        logger.warning("No Sarvam audio (turn), serving static Tamil audio via nested <Gather><Play>")
        gather.play(hold_url)

    response.append(gather)
    # Safety redirect: if Gather still gets nothing, re-prompt
    response.redirect(f"{settings.voice_api_url}/webhooks/twilio/interview-turn", method="POST")
    return response


# ── Twilio IVR Telephony ────────────────────────────────────────────────────────

@router.post("/incoming-call")
async def handle_incoming_call(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """Initiates live Tamil IVR interview directly on incoming call."""
    return await start_interview(
        request=request,
        CallSid=CallSid,
        From=From,
        language="ta",
        coordinator=coordinator,
    )


@router.api_route("/interview-start", methods=["GET", "POST"])
async def start_interview(
    request: Request,
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """
    Initiates an IVR interview turn. Accepts both GET and POST.
    Uses static pre-rendered Tamil consent audio for zero-latency instant first greeting.
    Session creation runs in background to eliminate dial-in delay.
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
    # For outbound calls, the beneficiary is 'To'; for inbound calls, the beneficiary is 'From'
    is_outbound = data.get("Direction") == "outbound-api"
    target_phone = (data.get("To") if is_outbound else None) or data.get("From") or data.get("Caller") or "+910000000000"
    language = data.get("language") or "ta"

    # Fire fresh session initialization in background (0ms dial-in delay)
    asyncio.create_task(coordinator.process_turn(
        phone=target_phone,
        channel="ivr",
        language=language,
        session_key=CallSid,
        is_initial=True,
        force_fresh=True,
    ))
    # Pre-call health probe across Groq, OpenRouter, and Gemini while caller listens to consent greeting
    asyncio.create_task(coordinator.llm.probe_fastest_provider())
    response = VoiceResponse()
    consent_url = f"{settings.voice_api_url}/webhooks/twilio/audio/consent_ta.wav"

    gather = Gather(
        input="speech",
        action=f"{settings.voice_api_url}/webhooks/twilio/interview-turn",
        method="POST",
        language="ta-IN",
        speech_timeout="1",        
        timeout=8,
        action_on_empty_result=True,
        speech_model="phone_call",
        barge_in=True,
    )
    gather.play(consent_url)
    response.append(gather)
    # Redirect fallback if no speech detected within timeout — explicit POST
    response.redirect(f"{settings.voice_api_url}/webhooks/twilio/interview-turn?CallSid={CallSid}&timeout=true", method="POST")

    return Response(content=str(response), media_type="application/xml")


@router.api_route("/interview-turn", methods=["GET", "POST"])
async def process_turn(
    request: Request,
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """
    Async deferred processing to beat Twilio's 15s webhook timeout.
    Accepts both GET and POST (via query params or form data).
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
    From = data.get("From") or data.get("Caller") or CallSid
    SpeechResult = data.get("SpeechResult") or ""
    Confidence = float(data.get("Confidence") or 0.7)

    is_outbound = data.get("Direction") == "outbound-api"
    phone = (data.get("To") if is_outbound else None) or data.get("From") or data.get("Caller") or CallSid
    turn_id = str(uuid.uuid4())
    _pending_results[turn_id] = None  # Mark as "processing"

    # Fire LLM + TTS processing
    task = asyncio.create_task(_process_turn_background(
        turn_id=turn_id,
        phone=phone,
        call_sid=CallSid,
        speech_result=SpeechResult or "",
        confidence=Confidence,
        coordinator=coordinator,
    ))

    # Fast path: Wait up to 7.0s directly — returns <Play> + <Gather> in 1 HTTP hop, eliminating redirect round-trips!
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=7.0)
        turn_result = _pending_results.get(turn_id)
        if turn_result is not None:
            del _pending_results[turn_id]
            response = _build_gather_response(turn_result)
            return Response(content=str(response), media_type="application/xml")
    except asyncio.TimeoutError:
        logger.info(f"Turn {turn_id} exceeded 7.0s direct response window, falling back to deferred redirect.")

    # Safety fallback redirect if processing took >3.2s
    response = VoiceResponse()
    response.redirect(f"{settings.voice_api_url}/webhooks/twilio/interview-result/{turn_id}", method="POST")
    return Response(content=str(response), media_type="application/xml")


async def _process_turn_background(
    turn_id: str,
    phone: str,
    call_sid: str,
    speech_result: str,
    confidence: float,
    coordinator: InterviewCoordinator,
):
    """Background task: runs LLM + TTS and stores result in _pending_results."""
    try:
        turn_result = await coordinator.process_turn(
            phone=phone,
            channel="ivr",
            user_speech=speech_result,
            stt_confidence=confidence,
            session_key=call_sid,
        )
        _pending_results[turn_id] = turn_result
        logger.info(f"Background turn {turn_id} completed. Spoken: {turn_result.spoken_response[:60]}")
    except Exception as e:
        logger.error(f"Background turn {turn_id} failed: {e}", exc_info=True)
        # Store a safe fallback result with real audio so Twilio NEVER plays dead silence!
        from services.interview_coordinator import CoordinatorTurnResult
        from services.interview_fsm import InterviewState
        apology_text = "மன்னிக்கவும், நீங்கள் கூறியதை மீண்டும் ஒருமுறை கூற முடியுமா?"
        fallback_audio = await coordinator._synthesize_safe(apology_text, "ta")
        if not fallback_audio:
            hold_file = _STATIC_AUDIO_DIR / "hold_ta.wav"
            fallback_audio = hold_file.read_bytes() if hold_file.exists() else _SILENT_WAV
        _pending_results[turn_id] = CoordinatorTurnResult(
            session_id=call_sid,
            spoken_response=apology_text,
            audio_bytes=fallback_audio,
            state=InterviewState.FIELD_COLLECTION,
            is_completed=False,
            case_id=None,
            current_field=None,
        )


@router.api_route("/interview-result/{turn_id}", methods=["GET", "POST"])
async def get_interview_result(turn_id: str):
    """
    Polling endpoint: Twilio hits this immediately after interview-turn.
    Polls up to 12s with 50ms intervals for rapid turnaround as soon as LLM+TTS finishes.
    """
    # 600 iterations * 20ms = 12 seconds max polling
    for _ in range(600):
        result = _pending_results.get(turn_id)
        if result is not None:
            del _pending_results[turn_id]  # Clean up
            response = _build_gather_response(result)
            return Response(content=str(response), media_type="application/xml")
        await asyncio.sleep(0.02)

    # Timeout: LLM+TTS took >12s — play pre-recorded Tamil hold audio via <Play> and retry
    logger.warning(f"Turn {turn_id} timed out (12s). Playing Tamil hold audio and retrying.")
    response = VoiceResponse()
    hold_url = f"{settings.voice_api_url}/webhooks/twilio/audio/hold_ta.wav"
    response.play(hold_url)
    response.redirect(f"{settings.voice_api_url}/webhooks/twilio/interview-result/{turn_id}", method="POST")
    return Response(content=str(response), media_type="application/xml")


@router.post("/call-status")
async def call_status(
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """Handles disconnect events (FR-13a)."""
    if CallStatus in ("no-answer", "busy", "failed", "completed"):
        await coordinator.handle_disconnect(phone=CallSid, channel="ivr", session_key=CallSid)
    return {"status": "ok"}


# ── Twilio WhatsApp Sandbox & Production API ────────────────────────────────────

@router.post("/whatsapp")
async def handle_twilio_whatsapp(
    From: str = Form(...),
    To: str = Form(...),
    Body: Optional[str] = Form(default=""),
    NumMedia: Optional[str] = Form(default="0"),
    MediaUrl0: Optional[str] = Form(default=None),
    MediaContentType0: Optional[str] = Form(default=None),
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """
    Twilio WhatsApp Sandbox & Messaging Webhook (FR-4b alternative).
    Receives incoming WhatsApp messages (text or voice note) and responds with TwiML.
    No Meta Cloud API token or Facebook Business Manager verification required!
    """
    phone = From.replace("whatsapp:", "")
    user_speech = Body or ""
    stt_confidence = 0.85

    # If an audio voice note was sent via WhatsApp
    if MediaUrl0:
        logger.info(f"Received WhatsApp voice note from {phone}: {MediaUrl0}")
        try:
            async with httpx.AsyncClient() as client:
                audio_resp = await client.get(
                    MediaUrl0,
                    auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                    follow_redirects=True,
                )
                if audio_resp.status_code == 200:
                    stt_res = await transcribe_audio(
                        audio_bytes=audio_resp.content,
                        language_code="ta",
                        sarvam_api_key=settings.sarvam_api_key,
                        sarvam_stt_url=settings.sarvam_stt_url,
                        mock_mode=settings.enable_mock_stt,
                    )
                    user_speech = stt_res.transcript
                    stt_confidence = stt_res.confidence
                    logger.info(f"Transcribed audio voice note: '{user_speech}' (confidence: {stt_confidence})")
        except Exception as e:
            logger.error(f"Error transcribing WhatsApp audio: {e}", exc_info=True)

    turn_result: CoordinatorTurnResult = await coordinator.process_turn(
        phone=phone,
        channel="whatsapp",
        user_speech=user_speech,
        stt_confidence=stt_confidence,
        language="ta",
        session_key=f"tw_wa_{phone}",
        is_initial=not bool(user_speech),
    )

    msg_resp = MessagingResponse()
    msg_resp.message(turn_result.spoken_response)
    return Response(content=str(msg_resp), media_type="application/xml")
