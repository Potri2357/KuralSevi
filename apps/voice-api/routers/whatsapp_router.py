"""
Kural Sevi — WhatsApp Cloud API Transport Adapter (FR-4b)
Pure protocol translation layer:
Meta Webhook JSON <───> InterviewCoordinator
"""
import httpx
import logging
from fastapi import APIRouter, Request, Query, Depends
from typing import Optional

from ..services.interview_coordinator import InterviewCoordinator, CoordinatorTurnResult
from ..services.stt_service import transcribe_audio
from ..config import settings

router = APIRouter(prefix="/webhooks/whatsapp", tags=["WhatsApp"])
logger = logging.getLogger(__name__)

_coordinator = InterviewCoordinator()

def get_coordinator() -> InterviewCoordinator:
    return _coordinator

WA_API_BASE = "https://graph.facebook.com/v19.0"


@router.get("/")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_challenge: str = Query(alias="hub.challenge"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
):
    """WhatsApp webhook verification (Meta handshake)."""
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_webhook_verify_token:
        return int(hub_challenge)
    return {"error": "Invalid verify token"}, 403


@router.post("/")
async def handle_whatsapp_message(
    request: Request,
    coordinator: InterviewCoordinator = Depends(get_coordinator),
):
    """Processes incoming WhatsApp text or voice note."""
    body = await request.json()
    try:
        entry = body["entry"][0]
        value = entry["changes"][0]["value"]
        if "messages" not in value:
            return {"status": "no_message"}

        message = value["messages"][0]
        from_phone = message["from"]
        message_type = message.get("type")

        user_speech = ""
        stt_confidence = 0.75

        if message_type == "audio":
            media_id = message["audio"]["id"]
            audio_bytes = await _download_whatsapp_media(media_id)
            stt_res = await transcribe_audio(
                audio_bytes=audio_bytes,
                language_code="ta",
                sarvam_api_key=settings.sarvam_api_key,
                sarvam_stt_url=settings.sarvam_stt_url,
                mock_mode=settings.enable_mock_stt,
            )
            user_speech = stt_res.transcript
            stt_confidence = stt_res.confidence
        elif message_type == "text":
            user_speech = message["text"]["body"]

        # Delegate turn handling to the unified InterviewCoordinator
        turn_result: CoordinatorTurnResult = await coordinator.process_turn(
            phone=from_phone,
            channel="whatsapp",
            user_speech=user_speech,
            stt_confidence=stt_confidence,
            language="ta",
        )

        # Dispatch response back over WhatsApp channel
        if turn_result.audio_bytes and not settings.enable_mock_tts:
            await _send_whatsapp_audio(from_phone, turn_result.audio_bytes)
        else:
            await _send_whatsapp_text(from_phone, turn_result.spoken_response)

    except Exception as e:
        logger.error(f"WhatsApp webhook processing error: {e}", exc_info=True)

    return {"status": "ok"}


async def _download_whatsapp_media(media_id: str) -> bytes:
    async with httpx.AsyncClient() as client:
        url_resp = await client.get(
            f"{WA_API_BASE}/{media_id}",
            headers={"Authorization": f"Bearer {settings.whatsapp_api_token}"},
        )
        media_url = url_resp.json().get("url", "")
        audio_resp = await client.get(
            media_url,
            headers={"Authorization": f"Bearer {settings.whatsapp_api_token}"},
        )
        return audio_resp.content


async def _send_whatsapp_audio(to: str, audio_bytes: bytes):
    async with httpx.AsyncClient() as client:
        upload_resp = await client.post(
            f"{WA_API_BASE}/{settings.whatsapp_phone_number_id}/media",
            headers={"Authorization": f"Bearer {settings.whatsapp_api_token}"},
            files={"file": ("response.wav", audio_bytes, "audio/wav")},
            data={"messaging_product": "whatsapp"},
        )
        media_id = upload_resp.json().get("id")
        if media_id:
            await client.post(
                f"{WA_API_BASE}/{settings.whatsapp_phone_number_id}/messages",
                headers={
                    "Authorization": f"Bearer {settings.whatsapp_api_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "messaging_product": "whatsapp",
                    "to": to,
                    "type": "audio",
                    "audio": {"id": media_id},
                },
            )


async def _send_whatsapp_text(to: str, text: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{WA_API_BASE}/{settings.whatsapp_phone_number_id}/messages",
            headers={
                "Authorization": f"Bearer {settings.whatsapp_api_token}",
                "Content-Type": "application/json",
            },
            json={
                "messaging_product": "whatsapp",
                "to": to,
                "type": "text",
                "text": {"body": text[:1000]},
            },
        )
