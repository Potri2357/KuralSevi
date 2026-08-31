"""
Kural Sevi — Voice Orchestration API
FastAPI application entry point.
"""
import logging
import base64
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from routers.twilio_router import router as twilio_router, handle_twilio_whatsapp
from routers.whatsapp_router import router as meta_whatsapp_router
from services.interview_coordinator import InterviewCoordinator
from services.stt_service import transcribe_audio
from services.tts_service import synthesize_speech
from config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# Shared interview coordinator
_shared_coordinator = InterviewCoordinator()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Kural Sevi Voice API starting up...")
    yield
    logger.info("Kural Sevi Voice API shutting down...")

app = FastAPI(
    title="Kural Sevi Voice API",
    description="AI-driven voice interview service for PM-AJAY GIA livelihood mapping",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Primary Routers
app.include_router(twilio_router)
app.include_router(meta_whatsapp_router)

# Support exact URL: /webhook/whatsapp and /webhooks/whatsapp mapping to Twilio WhatsApp
app.add_api_route("/webhook/whatsapp", handle_twilio_whatsapp, methods=["POST"], tags=["Twilio WhatsApp Alias"])
app.add_api_route("/webhooks/whatsapp/twilio", handle_twilio_whatsapp, methods=["POST"], tags=["Twilio WhatsApp Alias"])


# ── Stage 1: Interactive Browser Voice Test Endpoint ────────────────────────────

@app.post("/api/voice/process-speech")
async def process_browser_speech(
    audio: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None),
    language: str = Form(default="ta"),
    speaker: Optional[str] = Form(default=None),
    phone: str = Form(default="+919876543210"),
    session_key: str = Form(default="web_test_session"),
):
    """
    Direct Browser Voice Test endpoint (Stage 1).
    Takes real microphone audio from user's Mac/browser, runs:
    1. Sarvam AI STT (Tamil/Hindi)
    2. Gemini 2.5 Flash Profile Extraction & Dialogue
    3. Sarvam AI TTS (audio synthesis with selectable voice)
    Returns transcript, AI response, and playable base64 audio.
    """
    user_speech = text or ""
    stt_confidence = 0.9

    if audio:
        audio_content = await audio.read()
        logger.info(f"Received browser audio: {len(audio_content)} bytes, filename: {audio.filename}")
        try:
            stt_res = await transcribe_audio(
                audio_bytes=audio_content,
                language_code=language,
                sarvam_api_key=settings.sarvam_api_key,
                sarvam_stt_url=settings.sarvam_stt_url,
                mock_mode=settings.enable_mock_stt,
                filename=audio.filename or "audio.wav",
                content_type=audio.content_type or "audio/wav",
            )
            user_speech = stt_res.transcript
            stt_confidence = stt_res.confidence
            logger.info(f"Sarvam STT success: '{user_speech}' (confidence={stt_confidence})")
        except Exception as e:
            logger.error(f"Sarvam STT failed: {e}", exc_info=True)
            return {"error": f"STT processing failed: {str(e)}", "status": "failed"}

    # Process through interview coordinator
    turn_res = await _shared_coordinator.process_turn(
        phone=phone,
        channel="web_voice",
        user_speech=user_speech,
        stt_confidence=stt_confidence,
        language=language,
        session_key=session_key,
        is_initial=not bool(user_speech),
        speaker=speaker,
    )

    # Convert synthesized audio bytes to base64 for browser playback
    audio_b64 = None
    if turn_res.audio_bytes:
        audio_b64 = base64.b64encode(turn_res.audio_bytes).decode("utf-8")
    elif turn_res.spoken_response and not settings.enable_mock_tts:
        try:
            tts_res = await synthesize_speech(
                text=turn_res.spoken_response,
                language_code=language,
                sarvam_api_key=settings.sarvam_api_key,
                sarvam_tts_url=settings.sarvam_tts_url,
            )
            audio_b64 = base64.b64encode(tts_res.audio_bytes).decode("utf-8")
        except Exception as e:
            logger.error(f"Sarvam TTS failed: {e}", exc_info=True)

    return {
        "status": "success",
        "user_transcript": user_speech,
        "stt_confidence": stt_confidence,
        "ai_response_text": turn_res.spoken_response,
        "is_completed": turn_res.is_completed,
        "current_field": turn_res.current_field,
        "audio_base64": audio_b64,
        "audio_mime_type": "audio/wav",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "kural-sevi-voice-api"}


@app.get("/")
async def root():
    return {
        "name": "Kural Sevi Voice API",
        "version": "1.0.0",
        "stages": {
            "stage_1_voice": "Sarvam AI (STT/TTS) + Gemini 2.5 Flash LLM Extraction",
            "stage_2_phone_call": "Twilio IVR Telephony (/webhooks/twilio/interview-start)",
            "stage_3_whatsapp": "Twilio WhatsApp Sandbox (/webhook/whatsapp)"
        },
        "endpoints": {
            "health": "/health",
            "voice_mic_test": "/api/voice/process-speech",
            "twilio_phone_start": "/webhooks/twilio/interview-start",
            "twilio_phone_turn": "/webhooks/twilio/interview-turn",
            "twilio_whatsapp": "/webhook/whatsapp",
            "meta_whatsapp": "/webhooks/whatsapp"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
