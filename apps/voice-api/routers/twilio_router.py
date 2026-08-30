"""
Kural Sevi — Twilio IVR Transport Adapter (FR-4a)
Pure protocol translation layer:
HTTP / TwiML Forms <───> InterviewCoordinator
"""
import logging
from fastapi import APIRouter, Request, Response, Form, Depends
from twilio.twiml.voice_response import VoiceResponse, Gather
from typing import Optional

from ..services.interview_coordinator import InterviewCoordinator, CoordinatorTurnResult
from ..config import settings

router = APIRouter(prefix="/webhooks/twilio", tags=["Twilio IVR"])
logger = logging.getLogger(__name__)

# Shared application coordinator instance
_coordinator = InterviewCoordinator()

def get_coordinator() -> InterviewCoordinator:
    return _coordinator


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
        "Thank you for calling Kural Sevi. We will call you back shortly for your interview.",
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
