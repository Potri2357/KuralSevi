"""
Kural Sevi — Voice Orchestration API
FastAPI application entry point.
"""
import logging
import base64
import json
from typing import Optional
from contextlib import asynccontextmanager
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from routers.twilio_router import router as twilio_router, handle_twilio_whatsapp, handle_twilio_sms
from routers.whatsapp_router import router as meta_whatsapp_router
from services.interview_coordinator import InterviewCoordinator, get_completed_calls_records, clear_completed_calls_records
from services.field_normalizer import normalize_field_to_english
from services.stt_service import transcribe_audio
from services.tts_service import synthesize_speech
from config import settings

import collections
from fastapi.responses import HTMLResponse, RedirectResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# Ring buffer for live call logging (last 300 entries)
_live_logs = collections.deque(maxlen=300)

class RingBufferHandler(logging.Handler):
    def emit(self, record):
        try:
            msg = self.format(record)
            _live_logs.append({
                "time": record.asctime if hasattr(record, "asctime") else "",
                "level": record.levelname,
                "name": record.name,
                "message": record.getMessage(),
                "formatted": msg,
            })
        except Exception:
            pass

_rb_handler = RingBufferHandler()
_rb_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
logging.getLogger().addHandler(_rb_handler)

# Shared interview coordinator
_shared_coordinator = InterviewCoordinator()

from services.llm_service import warmup_llm
from services.tts_service import warmup_tts
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Kural Sevi Voice API starting up...")
    # Pre-warm TLS connection pools in background for instant zero-latency first turn
    asyncio.create_task(asyncio.to_thread(warmup_llm))
    asyncio.create_task(asyncio.to_thread(warmup_tts))
    # Pre-check database table presence so unmigrated DB never blocks call turns
    def _probe_db():
        if _shared_coordinator.sm.db:
            try:
                _shared_coordinator.sm.db.table("sessions").select("id").limit(1).execute()
            except Exception as e:
                _shared_coordinator.sm._cb_record_failure(e)
    asyncio.create_task(asyncio.to_thread(_probe_db))
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

# Support exact URL: /webhook/sms and /webhooks/sms mapping to Twilio SMS
app.add_api_route("/webhook/sms", handle_twilio_sms, methods=["POST"], tags=["Twilio SMS Alias"])
app.add_api_route("/webhooks/sms", handle_twilio_sms, methods=["POST"], tags=["Twilio SMS Alias"])


# ── Live Call Monitoring Dashboard & API ────────────────────────────────────────

@app.get("/api/logs")
async def get_raw_logs(limit: int = 100):
    """Returns the last N log entries as JSON for programmatic inspection."""
    logs_list = list(_live_logs)
    return {"count": len(logs_list), "logs": logs_list[-limit:]}


@app.api_route("/logs", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def view_logs_dashboard():
    """Real-time browser dashboard displaying live telephony call processing logs."""
    logs_list = list(_live_logs)[-150:]
    logs_list.reverse()
    
    rows = []
    for l in logs_list:
        color = "#10b981" if l["level"] == "INFO" else "#f59e0b" if l["level"] == "WARNING" else "#ef4444"
        rows.append(f"""
        <div style="padding: 6px 12px; border-bottom: 1px solid #1e293b; font-family: ui-monospace, monospace; font-size: 12.5px; line-height: 1.5;">
            <span style="color: #64748b;">{l['time']}</span>
            <span style="color: {color}; font-weight: 600; margin: 0 8px;">[{l['level']}]</span>
            <span style="color: #38bdf8; margin-right: 8px;">{l['name']}:</span>
            <span style="color: #e2e8f0;">{l['message']}</span>
        </div>
        """)
    rows_html = "".join(rows)

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Kural Sevi — Live Call Processing Logs</title>
    <meta http-equiv="refresh" content="2">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; margin: 0; padding: 20px; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 16px; }}
        .badge {{ background: #047857; color: #ecfdf5; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }}
        .badge::before {{ content: ''; width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite; }}
        @keyframes pulse {{ 0% {{ opacity: 1; }} 50% {{ opacity: 0.3; }} 100% {{ opacity: 1; }} }}
        .log-box {{ background: #020617; border: 1px solid #1e293b; border-radius: 8px; overflow-x: auto; max-height: 80vh; overflow-y: auto; }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h2 style="margin: 0; font-size: 20px; color: #38bdf8;">Kural Sevi — Live Call Telephony Logs</h2>
            <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Auto-refreshing every 2s | Inspecting Groq LLM turns, Sarvam TTS/STT, and Twilio webhooks</p>
        </div>
        <div class="badge">Live Monitoring Active</div>
    </div>
    <div class="log-box">
        {rows_html if rows_html else '<div style="padding: 24px; color: #64748b;">No call events logged yet. Trigger a call to see live data.</div>'}
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)


@app.api_route("/api/completed-calls", methods=["GET", "HEAD"])
async def get_completed_calls():
    """Returns the list of all completed call interview records and extracted fields."""
    records = get_completed_calls_records()
    return {"count": len(records), "records": records}


@app.api_route("/api/reset-data", methods=["POST", "GET"])
async def reset_data():
    """Erases all completed call records and resets state to start fresh."""
    clear_completed_calls_records()
    return {"status": "ok", "message": "All call records erased successfully"}


def predict_top_trade(fields: dict) -> dict:
    text = " ".join(str(v) for v in (fields or {}).values()).lower()
    if any(k in text for k in ["tailor", "stitch", "sew", "garment", "cloth"]):
        return {"code": "APP/Q0301", "name": "Tailor - Women's and Men's Garment", "nsqf": 4, "type": "Self-Employment", "confidence": "HIGH"}
    elif any(k in text for k in ["vegetable", "shop", "retail", "selling", "bazaar"]):
        return {"code": "RAS/Q0104", "name": "Retail Sales Associate / Shopkeeper", "nsqf": 3, "type": "Self-Employment", "confidence": "HIGH"}
    elif any(k in text for k in ["food", "papad", "pickle", "cook", "masala"]):
        return {"code": "FIC/Q5001", "name": "Papad and Ready-to-Eat Products Maker", "nsqf": 2, "type": "Home Enterprise", "confidence": "HIGH"}
    elif any(k in text for k in ["farm", "dairy", "cow", "livestock", "agri"]):
        return {"code": "AHC/Q0401", "name": "Livestock Farmer / Pashudhan Mitra", "nsqf": 4, "type": "Self-Employment", "confidence": "HIGH"}
    elif any(k in text for k in ["electric", "solar", "wire", "switch"]):
        return {"code": "ELE/Q3101", "name": "Electrician (Domestic)", "nsqf": 4, "type": "Self-Employment", "confidence": "HIGH"}
    elif any(k in text for k in ["weav", "loom", "handloom"]):
        return {"code": "HAN/Q0101", "name": "Handloom Weaver", "nsqf": 3, "type": "Home Enterprise", "confidence": "MEDIUM"}
    elif any(k in text for k in ["beauty", "parlour", "mehendi", "hair"]):
        return {"code": "BWS/Q0201", "name": "Beauty Therapist", "nsqf": 4, "type": "Self-Employment", "confidence": "HIGH"}
    return {"code": "APP/Q0301", "name": "Tailor - Custom Garments", "nsqf": 4, "type": "Self-Employment", "confidence": "MEDIUM"}


class DialRequest(BaseModel):
    phone: str
    language: Optional[str] = "ta"

@app.post("/calls/dial")
async def trigger_dial_call(req: DialRequest):
    """Initiates an outbound phone call to a beneficiary via Twilio API."""
    import urllib.request
    import urllib.parse
    import urllib.error
    phone = req.phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("0"):
        phone = "+91" + phone[1:]
    elif not phone.startswith("+"):
        phone = "+91" + phone
    
    account_sid = settings.twilio_account_sid
    auth_token = settings.twilio_auth_token
    from_number = settings.twilio_phone_number
    lang = req.language or "ta"
    webhook_url = f"{settings.voice_api_url}/webhooks/twilio/interview-start?language={lang}"
    cli_cmd = f"python3 scripts/trigger-outbound-call.py {phone} {lang}"

    if not account_sid or not auth_token or not from_number:
        return {"success": False, "error": "Twilio credentials not configured in voice-api environment.", "command": cli_cmd}

    api_url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json"
    credentials = f"{account_sid}:{auth_token}"
    auth_header = f"Basic {base64.b64encode(credentials.encode('utf-8')).decode('utf-8')}"

    post_data = urllib.parse.urlencode({
        "To": phone,
        "From": from_number,
        "Url": webhook_url,
        "Method": "POST",
    }).encode("utf-8")

    req_obj = urllib.request.Request(api_url, data=post_data, method="POST")
    req_obj.add_header("Authorization", auth_header)
    req_obj.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(req_obj, timeout=15.0) as resp:
            body = resp.read().decode("utf-8")
            call_data = json.loads(body)
            return {
                "success": True,
                "call_sid": call_data.get("sid"),
                "status": call_data.get("status"),
                "to": call_data.get("to"),
                "command": cli_cmd
            }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        logger.error(f"Twilio dial error: {err_body}")
        return {"success": False, "error": err_body, "command": cli_cmd}
    except Exception as e:
        logger.error(f"Dial exception: {e}")
        return {"success": False, "error": str(e), "command": cli_cmd}


@app.api_route("/call-records", methods=["GET", "HEAD"])
async def view_call_records_dashboard(legacy: bool = False):
    """Redirects to the Next.js Call Records Telephony Workstation UI at /officer/calls."""
    if not legacy:
        return RedirectResponse(url="http://localhost:3000/officer/calls", status_code=307)
    records = get_completed_calls_records()

    cards = []
    for r in records:
        fields_html = ""
        confirmed_f = r.get("confirmed_fields", {})
        for fn, fv in confirmed_f.items():
            nice_name = fn.replace("_", " ").title()
            clean_fv = normalize_field_to_english(fn, str(fv), r.get("language", "ta"))
            fields_html += f"""
            <div style="background: #1e293b; padding: 8px 12px; border-radius: 6px; border: 1px solid #334155;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">{nice_name}</div>
                <div style="font-size: 13.5px; color: #f8fafc; margin-top: 2px; font-weight: 500;">{clean_fv}</div>
            </div>
            """
        if not fields_html:
            fields_html = '<div style="color: #64748b; font-size: 13px;">No fields confirmed yet</div>'

        turns_html = ""
        for t in r.get("transcript", []):
            u_speech = t.get("user", "")
            a_speech = t.get("assistant", "")
            time_str = t.get("timestamp", "")
            turns_html += f"""
            <div style="margin-bottom: 10px; font-size: 13px; line-height: 1.4;">
                <div style="color: #38bdf8; font-weight: 600;">👤 Beneficiary ({time_str}): <span style="color: #e2e8f0; font-weight: 400;">"{u_speech}"</span></div>
                <div style="color: #34d399; font-weight: 600; margin-top: 2px;">🤖 Kural Sevi: <span style="color: #cbd5e1; font-weight: 400;">"{a_speech}"</span></div>
            </div>
            """

        st = r.get('status', 'COMPLETED')
        if st == "BENEFICIARY_CONFIRMED":
            badge_html = f'<span style="background: #047857; color: #a7f3d0; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 8px; border: 1px solid #059669;">✓ CITIZEN CONFIRMED ({r.get("confirmed_via", "SMS")})</span>'
        else:
            badge_html = f'<span style="background: #065f46; color: #34d399; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px;">{st}</span>'

        notif_html = '<span style="background: #1e3a8a; color: #93c5fd; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 600; margin-left: 6px;">📱 Bilingual Dispatched</span>'

        # Recommendation Engine link & evaluation
        top_rec = predict_top_trade(confirmed_f)
        cid = r.get('case_id', 'N/A')
        rec_box_html = f"""
        <div style="background: #022c22; border: 1px solid #059669; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
                <div style="font-size: 11px; color: #6ee7b7; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Recommendation Engine: Rank #1 Matched Pathway</div>
                <div style="font-size: 15px; color: #f0fdf4; font-weight: 700; margin-top: 2px;">
                    {top_rec['name']} <span style="color: #a7f3d0; font-size: 12px; font-weight: 500;">({top_rec['code']} · NSQF Level {top_rec['nsqf']} · {top_rec['type']})</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #065f46; color: #6ee7b7; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; border: 1px solid #10b981;">CONFIDENCE: {top_rec['confidence']}</span>
                <a href="http://localhost:3000/officer/cases/{cid}" target="_blank" style="background: #2563eb; color: #ffffff; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none; border: 1px solid #3b82f6;">Open in Officer Portal ↗</a>
            </div>
        </div>
        """

        cards.append(f"""
        <div style="background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 18px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 14px;">
                <div>
                    <span style="font-size: 16px; font-weight: 700; color: #38bdf8;">📞 {r.get('phone', 'Unknown')}</span>
                    {badge_html}
                    {notif_html}
                    <span style="color: #94a3b8; font-size: 12px; margin-left: 10px;">Case ID: <b>{cid}</b></span>
                </div>
                <div style="font-size: 12px; color: #64748b;">{r.get('completed_at', '')}</div>
            </div>
            {rec_box_html}
            <div style="margin-bottom: 14px;">
                <div style="font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 8px;">PM-AJAY 7 EXTRACTED LIVELIHOOD FIELDS:</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 8px;">
                    {fields_html}
                </div>
            </div>
            <details style="margin-top: 12px; background: #020617; border: 1px solid #1e293b; border-radius: 6px; padding: 10px 14px;">
                <summary style="cursor: pointer; color: #94a3b8; font-size: 12.5px; font-weight: 600;">View Turn-by-Turn Call Transcript ({r.get('turns_count', 0)} turns)</summary>
                <div style="margin-top: 12px;">
                    {turns_html if turns_html else '<div style="color: #64748b; font-size: 12px;">No transcript available</div>'}
                </div>
            </details>
        </div>
        """)

    cards_html = "".join(cards) if cards else '<div style="padding: 40px; text-align: center; color: #64748b;">No completed call records yet. Complete a phone interview to view records here.</div>'

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Kural Sevi — Completed Call Records</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ background: #020617; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 18px; margin-bottom: 24px; }}
        .btn {{ background: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 6px 14px; border-radius: 6px; font-size: 13px; text-decoration: none; font-weight: 500; }}
        .btn:hover {{ background: #334155; }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 style="margin: 0; font-size: 22px; color: #38bdf8; font-weight: 700;">Kural Sevi — Completed Call Records</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Structured PM-AJAY Beneficiary Profiles & Verified Turn Transcripts</p>
        </div>
        <div>
            <a href="/logs" class="btn" style="margin-right: 8px;">View Telephony Logs</a>
            <a href="/api/completed-calls" class="btn">Raw JSON</a>
        </div>
    </div>
    <div style="max-width: 1000px; margin: 0 auto;">
        {cards_html}
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)


# ── Stage 1: Interactive Browser Voice Test Endpoint ────────────────────────────

@app.post("/api/voice/process-speech")
async def process_browser_speech(
    audio: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None),
    language: str = Form(default="ta"),
    speaker: Optional[str] = Form(default=None),
    mime_type: Optional[str] = Form(default=None),
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
                filename=audio.filename or "audio.webm",
                content_type=mime_type or audio.content_type or "audio/webm",
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


class TTSRequest(BaseModel):
    text: str
    language: str = "ta"
    speaker: Optional[str] = None


@app.post("/api/voice/tts")
async def tts_endpoint(req: TTSRequest):
    """
    Synthesize regional speech (Tamil, Hindi, Telugu, English) into natural high-fidelity audio.
    """
    tts_res = await synthesize_speech(
        text=req.text,
        language_code=req.language,
        sarvam_api_key=settings.sarvam_api_key,
        sarvam_tts_url=settings.sarvam_tts_url,
        speaker_override=req.speaker,
    )
    if tts_res and tts_res.audio_bytes:
        audio_b64 = base64.b64encode(tts_res.audio_bytes).decode("utf-8")
        return {
            "status": "success",
            "audio_base64": audio_b64,
            "audio_mime_type": f"audio/{tts_res.audio_format}",
        }
    return {"status": "failed", "error": "TTS synthesis failed"}


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
