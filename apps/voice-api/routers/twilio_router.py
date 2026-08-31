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

# Audio cache: audio_id -> WAV bytes
_audio_cache: dict[str, bytes] = {}

# Pending result cache: turn_id -> CoordinatorTurnResult | None (None = still processing)
_pending_results: dict[str, Optional[CoordinatorTurnResult]] = {}

def get_coordinator() -> InterviewCoordinator:
    return _coordinator


# ── Audio Streaming Endpoint for Twilio <Play> ──────────────────────────────────

@router.api_route("/audio/{audio_id}.wav", methods=["GET", "HEAD"])
async def get_audio_wav(audio_id: str):
    """Streams synthesized Sarvam AI Tamil audio WAV directly to Twilio."""
    audio_bytes = _audio_cache.get(audio_id)
    if not audio_bytes:
        logger.warning(f"Audio ID {audio_id} not found in cache")
        return Response(status_code=404)
    return Response(content=audio_bytes, media_type="audio/wav")


def _cache_audio(audio_bytes: bytes) -> str:
    """Stores audio bytes and returns the playable URL path segment."""
    audio_id = str(uuid.uuid4())
    _audio_cache[audio_id] = audio_bytes
    return audio_id


def _play_or_say(response: VoiceResponse, turn_result: CoordinatorTurnResult, log_label: str = ""):
    """Appends <Play> or <Say> depending on whether audio was synthesized."""
    if turn_result.audio_bytes:
        audio_id = _cache_audio(turn_result.audio_bytes)
        audio_url = f"{settings.voice_api_url}/webhooks/twilio/audio/{audio_id}.wav"
        logger.info(f"Serving Sarvam TTS {log_label} via <Play>: {audio_url}")
        response.play(audio_url)
    else:
        logger.warning(f"No Sarvam audio {log_label}, falling back to <Say>")
        response.say(turn_result.spoken_response[:300], language="en-IN")


def _build_gather_response(turn_result: CoordinatorTurnResult) -> VoiceResponse:
    """Builds a final TwiML response with <Play> + <Gather> for the next speech turn."""
    response = VoiceResponse()
    _play_or_say(response, turn_result, log_label="(turn)")
    if turn_result.is_completed:
        response.hangup()
        return response
    gather = Gather(
        input="speech",
        action=f"{settings.voice_api_url}/webhooks/twilio/interview-turn",
        method="POST",
        language="ta-IN",
        speech_timeout="auto",
        timeout=10,           # Wait up to 10s for caller to start speaking
        action_on_empty_result=True,  # Still POST even if no speech (prevents hangup)
    )
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
    Uses static pre-rendered Tamil consent audio for zero-latency first greeting.
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
    From = data.get("From") or data.get("Caller") or "+910000000000"
    language = data.get("language") or "ta"

    turn_result: CoordinatorTurnResult = await coordinator.process_turn(
        phone=From,
        channel="ivr",
        language=language,
        session_key=CallSid,
        is_initial=True,
    )

    response = VoiceResponse()
    _play_or_say(response, turn_result, log_label="(start)")

    gather = Gather(
        input="speech",
        action=f"{settings.voice_api_url}/webhooks/twilio/interview-turn",
        method="POST",
        language="ta-IN",
        speech_timeout="auto",
        timeout=10,
        action_on_empty_result=True,
    )
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

    phone = From or CallSid
    turn_id = str(uuid.uuid4())
    _pending_results[turn_id] = None  # Mark as "processing"

    # Fire LLM + TTS in background (non-blocking)
    asyncio.create_task(_process_turn_background(
        turn_id=turn_id,
        phone=phone,
        call_sid=CallSid,
        speech_result=SpeechResult or "",
        confidence=Confidence,
        coordinator=coordinator,
    ))

    # Use a short silent pause instead of hold audio — avoids repetitive phrase
    # Twilio will immediately redirect to interview-result which polls for the real answer
    response = VoiceResponse()
    response.pause(length=1)  # 1s silence, then redirect to poll
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
        # Store a safe fallback result so Twilio doesn't hang indefinitely
        from services.interview_coordinator import CoordinatorTurnResult
        from services.interview_fsm import InterviewState
        _pending_results[turn_id] = CoordinatorTurnResult(
            session_id=call_sid,
            spoken_response="மன்னிக்கவும், சிறிது நிறுத்தம் ஏற்பட்டது. மீண்டும் சொல்லுங்கள்.",
            audio_bytes=None,
            state=InterviewState.FIELD_COLLECTION,
            is_completed=False,
            case_id=None,
            current_field=None,
        )


@router.api_route("/interview-result/{turn_id}", methods=["GET", "POST"])
async def get_interview_result(turn_id: str):
    """
    Polling endpoint: Twilio hits this after the 1s pause.
    Polls up to 14s (100ms × 140) for background LLM+TTS, then returns TwiML.
    If still not ready, plays a short wait phrase once and redirects back to poll again.
    """
    # Poll for up to 14 seconds (100ms intervals)
    for _ in range(140):
        result = _pending_results.get(turn_id)
        if result is not None:
            del _pending_results[turn_id]  # Clean up
            response = _build_gather_response(result)
            return Response(content=str(response), media_type="application/xml")
        await asyncio.sleep(0.1)

    # Timeout: LLM took >14s — play ONE wait phrase and try once more
    logger.warning(f"Turn {turn_id} timed out (14s). Playing wait phrase.")
    response = VoiceResponse()
    response.say("கொஞ்சம் நேரம் பொறுங்கள்.", language="en-IN")
    response.redirect(f"{settings.voice_api_url}/webhooks/twilio/interview-result/{turn_id}")
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
