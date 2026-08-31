"""
Kural Sevi — Twilio IVR & Twilio WhatsApp Transport Adapter (FR-4a, FR-4b)
Pure protocol translation layer:
HTTP / TwiML Forms <───> InterviewCoordinator
"""
import logging
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

def get_coordinator() -> InterviewCoordinator:
    return _coordinator


# ── Twilio IVR Telephony ────────────────────────────────────────────────────────

@router.post("/incoming-call")
async def handle_incoming_call(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
):
    """Handles missed call callback acknowledgment."""
    logger.info(f"Incoming call {CallSid} from {From}")
    response = VoiceResponse()
    response.say(
        "குரல் சேவிக்கு அழைத்ததற்கு நன்றி. உங்கள் PM-AJAY வாழ்வாதார நேர்காணலுக்காக விரைவில் உங்களைத் திரும்ப அழைப்போம். நன்றி, வணக்கம்.",
        language="ta-IN",
    )
    response.hangup()
    return Response(content=str(response), media_type="application/xml")


@router.post("/interview-start")
async def start_interview(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    language: str = Form(default="ta"),
    district: str = Form(default="Namakkal"),
    state: str = Form(default="Tamil Nadu"),
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """Initiates or resumes an IVR interview turn."""
    turn_result: CoordinatorTurnResult = await coordinator.process_turn(
        phone=From,
        channel="ivr",
        language=language,
        session_key=CallSid,
        is_initial=True,
    )

    response = VoiceResponse()
    response.say(turn_result.spoken_response[:400], language=f"{language}-IN")

    gather = Gather(
        input="speech",
        action=f"{settings.voice_api_url}/webhooks/twilio/interview-turn",
        method="POST",
        language=f"{language}-IN",
        speech_timeout="auto",
    )
    response.append(gather)
    response.redirect(f"{settings.voice_api_url}/webhooks/twilio/interview-turn?CallSid={CallSid}&timeout=true")

    return Response(content=str(response), media_type="application/xml")


@router.post("/interview-turn")
async def process_turn(
    request: Request,
    CallSid: str = Form(...),
    From: Optional[str] = Form(default=None),
    SpeechResult: Optional[str] = Form(default=None),
    Confidence: Optional[float] = Form(default=0.7),
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """Processes spoken input and produces next TwiML step."""
    phone = From or CallSid

    turn_result: CoordinatorTurnResult = await coordinator.process_turn(
        phone=phone,
        channel="ivr",
        user_speech=SpeechResult or "",
        stt_confidence=float(Confidence or 0.7),
        session_key=CallSid,
    )

    response = VoiceResponse()
    response.say(turn_result.spoken_response[:400], language="ta-IN")

    if turn_result.is_completed:
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

    gather = Gather(
        input="speech",
        action=f"{settings.voice_api_url}/webhooks/twilio/interview-turn",
        method="POST",
        language="ta-IN",
        speech_timeout="auto",
    )
    response.append(gather)
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
