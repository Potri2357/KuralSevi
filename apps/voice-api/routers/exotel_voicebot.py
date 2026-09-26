"""
Kural Sevi — Exotel Voicebot WebSocket Handler
Enables natural, turn-taking conversational AI voice streaming for Exotel phone calls.
- Inbound: Streams caller audio from Exotel -> VAD silence detection -> Sarvam Saaras STT
- Processing: InterviewCoordinator (Gemini 2.5 + Dynamic Language Detection)
- Outbound: Sarvam Bulbul v3 TTS -> 16-bit 8kHz PCM chunks -> Exotel WebSocket
- Echo Prevention: Acoustic guard interval prevents self-triggering while bot is speaking.
"""
import io
import wave
import json
import math
import struct
import base64
import logging
import asyncio
import time
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.interview_coordinator import (
    InterviewCoordinator,
    CoordinatorTurnResult,
)
from services.stt_service import transcribe_audio
from config import settings

router = APIRouter(tags=["Exotel Voicebot WebSocket"])
logger = logging.getLogger(__name__)

_coordinator = InterviewCoordinator()
_STATIC_AUDIO_DIR = Path(__file__).resolve().parent.parent / "static_audio"

def audio_to_pcm8k(audio_bytes: bytes, target_rate: int = 8000) -> bytes:
    """
    Guarantees raw 16-bit linear PCM at target_rate (default 8000Hz mono).
    1. Fast-path: If already 8000Hz 16-bit mono WAV, extracts frames in 0.05ms.
    2. Fallback: If MP3, 16kHz WAV, 24kHz WAV, or any other encoding, uses ffmpeg to resample cleanly.
    Never returns raw MP3 bitstream or corrupted headers!
    """
    if not audio_bytes:
        return b""
    # Fast path: standard 8kHz 16-bit mono WAV
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as w:
            if w.getframerate() == target_rate and w.getnchannels() == 1 and w.getsampwidth() == 2:
                return w.readframes(w.getnframes())
    except Exception:
        pass

    # Clean decode/resample via ffmpeg
    try:
        import subprocess
        cmd = [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-i", "pipe:0",
            "-ar", str(target_rate),
            "-ac", "1",
            "-f", "s16le",
            "pipe:1"
        ]
        res = subprocess.run(cmd, input=audio_bytes, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=3.0)
        if res.returncode == 0 and res.stdout:
            return res.stdout
    except Exception as e:
        logger.error(f"[audio_to_pcm8k] ffmpeg decoding error: {e}")

    # Safe fallback: skip RIFF header if present
    if audio_bytes.startswith(b"RIFF") and len(audio_bytes) > 44:
        return audio_bytes[44:]
    return b""

def _pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 8000) -> bytes:
    """Packages raw 16-bit linear PCM into standard WAV format for STT."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm_bytes)
    return buf.getvalue()

def _calculate_rms(pcm_bytes: bytes) -> float:
    """Calculates root-mean-square audio amplitude for energy VAD."""
    if not pcm_bytes:
        return 0.0
    count = len(pcm_bytes) // 2
    if count == 0:
        return 0.0
    shorts = struct.unpack(f"<{count}h", pcm_bytes[:count * 2])
    sum_sq = sum(s * s for s in shorts)
    return math.sqrt(sum_sq / count)

async def _stream_pcm_to_exotel(ws: WebSocket, stream_id: str, pcm_data: bytes, sample_rate: int = 8000):
    """
    Streams raw 16-bit PCM audio to Exotel in chunks of 1600 bytes (100ms at 8kHz).
    Sends the first 2 chunks immediately (0ms delay) to instantly prime Exotel's playout buffer,
    then paces subsequent chunks smoothly at ~25ms so audio starts playing on the caller's phone
    with 0 perceived latency while preventing buffer underruns.
    """
    chunk_size = 1600
    total = len(pcm_data)

    chunk_count = 0
    for i in range(0, total, chunk_size):
        chunk = pcm_data[i:i + chunk_size]
        payload = base64.b64encode(chunk).decode("utf-8")
        msg = {
            "event": "media",
            "stream_id": stream_id,
            "media": {"payload": payload}
        }
        try:
            await ws.send_text(json.dumps(msg))
        except (WebSocketDisconnect, ConnectionResetError):
            logger.info("[Voicebot WS] Caller hung up or disconnected during playout streaming")
            return
        except Exception as e:
            logger.warning(f"[Voicebot WS] Error sending audio chunk: {e}")
            return
        chunk_count += 1
        # Burst initial chunks to start speaker instantly, then pace at 25ms
        if chunk_count > 2:
            await asyncio.sleep(0.025)

@router.websocket("/ws/voicebot")
@router.websocket("/ws/exotel-voicebot")
async def handle_exotel_voicebot_stream(websocket: WebSocket):
    """
    Full-duplex Exotel Voicebot WebSocket stream.
    Natural turn-taking conversation:
    1. Bot speaks question
    2. Bot waits for caller to finish speaking their answer
    3. AI processes answer and asks next question
    """
    await websocket.accept()
    logger.info("[Voicebot WS] Exotel caller connected to WebSocket stream")

    stream_id: Optional[str] = None
    call_sid: str = "voicebot_call"
    target_phone: str = "+919342900638"
    query_lang = websocket.query_params.get("language") or websocket.query_params.get("lang") or "en"
    current_lang: str = query_lang
    sample_rate: int = 8000

    # Acoustic Echo Guard: timestamp until which incoming audio must be discarded
    playback_guard_until = 0.0

    # Speech buffering and VAD state
    caller_buffer = bytearray()
    speech_detected = False
    speech_start_time = 0.0
    last_speech_time = 0.0
    speech_consecutive_frames = 0
    processing_turn = False
    initial_greeting_sent = False

    try:
        while True:
            raw_msg = await websocket.receive_text()
            data = json.loads(raw_msg)
            event = data.get("event")

            if event == "connected":
                logger.info("[Voicebot WS] Handshake event received")

            elif event == "start":
                start_data = data.get("start", {})
                stream_id = data.get("stream_id") or start_data.get("stream_id") or "default_stream"
                call_sid = start_data.get("call_sid") or data.get("call_sid") or call_sid
                target_phone = start_data.get("from") or target_phone
                sr_param = data.get("sample_rate") or start_data.get("sample_rate")
                if sr_param:
                    try:
                        sample_rate = int(sr_param)
                    except Exception:
                        pass

                start_lang = start_data.get("language") or start_data.get("lang") or data.get("language") or data.get("lang") or "en"
                if start_lang:
                    current_lang = start_lang

                logger.info(f"[Voicebot WS] Call started: stream={stream_id} sid={call_sid} phone={target_phone} lang={current_lang} rate={sample_rate}")

                # Send initial welcome greeting in selected language
                if not initial_greeting_sent:
                    initial_greeting_sent = True
                    consent_file = f"consent_{current_lang}.wav"
                    consent_path = _STATIC_AUDIO_DIR / consent_file
                    if not consent_path.exists():
                        consent_path = _STATIC_AUDIO_DIR / "consent_en.wav"
                    if not consent_path.exists():
                        consent_path = _STATIC_AUDIO_DIR / "consent_ta.wav"
                    if consent_path.exists():
                        greeting_wav = consent_path.read_bytes()
                        greeting_pcm = audio_to_pcm8k(greeting_wav, target_rate=sample_rate)
                        duration_sec = len(greeting_pcm) / (sample_rate * 2)
                        playback_guard_until = time.time() + duration_sec + 0.12
                        logger.info(f"[Voicebot WS] Playing {current_lang} greeting ({duration_sec:.1f}s)...")
                        await _stream_pcm_to_exotel(websocket, stream_id, greeting_pcm, sample_rate)
                        logger.info("[Voicebot WS] Greeting finished. Now listening for caller response...")

            elif event == "media":
                now = time.time()
                # 1. Acoustic Echo Guard: Discard mic frames while bot is playing through phone speaker
                if now < playback_guard_until or processing_turn:
                    caller_buffer.clear()
                    speech_detected = False
                    speech_start_time = 0.0
                    last_speech_time = 0.0
                    speech_consecutive_frames = 0
                    continue

                media_obj = data.get("media", {})
                payload_b64 = media_obj.get("payload", "")
                if not payload_b64:
                    continue

                try:
                    chunk = base64.b64decode(payload_b64)
                except Exception:
                    continue

                energy = _calculate_rms(chunk)

                # Two-tier hysteresis energy threshold:
                # 380 RMS onset to start speech detection (filters telephone line hum ~100-250 RMS)
                # 280 RMS continuation to keep tracking soft sentence endings/trailing syllables
                threshold = 280.0 if speech_detected else 380.0

                if energy >= threshold:
                    speech_consecutive_frames += 1
                    # Require 2 consecutive frames (~40-80ms) above threshold to trigger onset
                    if speech_consecutive_frames >= 2:
                        if not speech_detected:
                            speech_detected = True
                            speech_start_time = now
                            logger.info(f"[Voicebot WS] Caller speech started (energy={energy:.0f})...")
                        last_speech_time = now
                        caller_buffer.extend(chunk)
                else:
                    speech_consecutive_frames = 0
                    if speech_detected:
                        # Append the trailing quiet chunk so audio isn't chopped abruptly
                        caller_buffer.extend(chunk)
                        
                        silence_duration = now - last_speech_time
                        spoken_duration = last_speech_time - speech_start_time

                        # Natural Indian vernacular conversational silence threshold:
                        # If caller spoke > 0.8s, require 1.9s of continuous silence before concluding utterance
                        # If caller spoke very briefly (< 0.8s, e.g. "ஹலோ" or "ஆ..."), require 2.3s so they aren't cut off mid-thought
                        required_silence = 1.9 if spoken_duration >= 0.8 else 2.3

                        # Safety max utterance: 25 seconds
                        is_max_timeout = (now - speech_start_time) > 25.0

                        if silence_duration >= required_silence or is_max_timeout:
                            full_pcm = bytes(caller_buffer)
                            caller_buffer.clear()
                            speech_detected = False
                            speech_start_time = 0.0
                            last_speech_time = 0.0
                            speech_consecutive_frames = 0

                            # Ignore brief electrical clicks, coughs, and breath noise (< 0.35s)
                            # Real spoken answers like "பத்து", "டைலர்", "டிரைவர்" (~0.45s-1.2s) are preserved
                            min_speech_bytes = int(sample_rate * 2 * 0.35)
                            if len(full_pcm) < min_speech_bytes:
                                logger.info(f"[Voicebot WS] Ignored brief acoustic noise/breath ({len(full_pcm)} bytes)")
                                continue

                            try:
                                processing_turn = True
                                wav_payload = _pcm_to_wav(full_pcm, sample_rate=sample_rate)
                                logger.info(f"[Voicebot WS] Caller finished speaking ({len(wav_payload)} bytes WAV). Transcribing...")

                                stt_res = await transcribe_audio(
                                    audio_bytes=wav_payload,
                                    language_code=current_lang,
                                    sarvam_api_key=settings.sarvam_api_key,
                                    sarvam_stt_url=settings.sarvam_stt_url,
                                    mock_mode=False,
                                )

                                transcript = (stt_res.transcript if stt_res else "").strip()
                                logger.info(f"[Voicebot WS] Caller said: '{transcript}'")

                                from services.audio_filter import is_noise
                                if not transcript or is_noise(transcript):
                                    logger.info(f"[Voicebot WS] Filtered out acoustic noise / filler: '{transcript}'. Continuing listening...")
                                    processing_turn = False
                                    continue

                                res: CoordinatorTurnResult = await _coordinator.process_turn(
                                    phone=target_phone,
                                    channel="ivr",
                                    user_speech=transcript,
                                    stt_confidence=0.95,
                                    language=current_lang,
                                    session_key=call_sid,
                                )

                                current_lang = getattr(res, "language_code", None) or current_lang
                                logger.info(f"[Voicebot WS] AI Turn complete. Next lang: {current_lang}, State: {res.state}")
                                logger.info(f"[Voicebot WS] AI response: '{res.spoken_response}'")

                                dur_sec = 0.0
                                stream_start = time.time()
                                if res.audio_bytes and stream_id:
                                    reply_pcm = audio_to_pcm8k(res.audio_bytes, target_rate=sample_rate)
                                    dur_sec = len(reply_pcm) / (sample_rate * 2)
                                    playback_guard_until = time.time() + dur_sec + 0.075
                                    logger.info(f"[Voicebot WS] Streaming AI voice reply ({dur_sec:.1f}s)...")
                                    await _stream_pcm_to_exotel(websocket, stream_id, reply_pcm, sample_rate)
                                    logger.info("[Voicebot WS] Finished speaking question. Listening for caller response...")

                                if res.is_completed:
                                    logger.info("[Voicebot WS] Interview completed! Waiting for final audio to finish playing on phone speaker...")
                                    elapsed = time.time() - stream_start
                                    remaining = max(dur_sec - elapsed, 0.0)
                                    # Wait for remaining audio playout plus 1.0s formal ending pause before hanging up
                                    wait_sec = remaining + 1.0
                                    logger.info(f"[Voicebot WS] Audio {dur_sec:.1f}s, elapsed {elapsed:.2f}s, waiting {wait_sec:.2f}s before formal hangup.")
                                    await asyncio.sleep(wait_sec)
                                    logger.info("[Voicebot WS] Formal ending complete. Hanging up.")
                                    try:
                                        await websocket.send_text(json.dumps({"event": "stop", "stream_id": stream_id}))
                                    except Exception:
                                        pass
                                    await websocket.close()
                                    break
                            except WebSocketDisconnect:
                                logger.info(f"[Voicebot WS] Caller {target_phone} disconnected during turn processing")
                                break
                            except Exception as turn_err:
                                logger.error(f"[Voicebot WS] Error in turn processing (call kept alive): {turn_err}", exc_info=True)
                            finally:
                                processing_turn = False

            elif event == "dtmf":
                dtmf_obj = data.get("dtmf", {})
                digit = str(dtmf_obj.get("digit", "")).strip()
                logger.info(f"[Voicebot WS] Caller pressed keypad digit: {digit}")
                user_text = f"Pressed {digit}"
                if digit == "1":
                    user_text = "1 (English)"
                    current_lang = "en"
                elif digit == "2":
                    user_text = "2 (Tamil - தமிழ்)"
                    current_lang = "ta"
                elif digit == "3":
                    user_text = "3 (Hindi - हिंदी)"
                    current_lang = "hi"
                elif digit == "4":
                    user_text = "4 (Telugu - తెలుగు)"
                    current_lang = "te"
                elif digit == "5":
                    user_text = "5 (Malayalam - മലയാളം)"
                    current_lang = "ml"

                try:
                    processing_turn = True
                    res = await _coordinator.process_turn(
                        phone=target_phone,
                        channel="ivr",
                        user_speech=user_text,
                        stt_confidence=1.0,
                        language=current_lang,
                        session_key=call_sid,
                    )
                    current_lang = getattr(res, "language_code", None) or current_lang
                    dur_sec = 0.0
                    stream_start = time.time()
                    if res.audio_bytes and stream_id:
                        reply_pcm = audio_to_pcm8k(res.audio_bytes, target_rate=sample_rate)
                        dur_sec = len(reply_pcm) / (sample_rate * 2)
                        playback_guard_until = time.time() + dur_sec + 0.075
                        await _stream_pcm_to_exotel(websocket, stream_id, reply_pcm, sample_rate)

                    if res.is_completed:
                        logger.info("[Voicebot WS] Interview completed via DTMF! Waiting for final audio to finish on speaker...")
                        elapsed = time.time() - stream_start
                        remaining = max(dur_sec - elapsed, 0.0)
                        # Wait for remaining audio playout plus 1.0s formal ending pause before hanging up
                        wait_sec = remaining + 1.0
                        logger.info(f"[Voicebot WS] Audio {dur_sec:.1f}s, elapsed {elapsed:.2f}s, waiting {wait_sec:.2f}s before formal hangup.")
                        await asyncio.sleep(wait_sec)
                        logger.info("[Voicebot WS] Formal ending complete. Hanging up.")
                        try:
                            await websocket.send_text(json.dumps({"event": "stop", "stream_id": stream_id}))
                        except Exception:
                            pass
                        await websocket.close()
                        break
                except WebSocketDisconnect:
                    logger.info(f"[Voicebot WS] Caller {target_phone} disconnected during DTMF turn")
                    break
                except Exception as dtmf_err:
                    logger.error(f"[Voicebot WS] Error in DTMF turn (call kept alive): {dtmf_err}", exc_info=True)
                finally:
                    processing_turn = False

            elif event == "ping":
                logger.debug("[Voicebot WS] Received app-level ping from Exotel, replying pong")
                try:
                    await websocket.send_text(json.dumps({"event": "pong"}))
                except Exception:
                    pass

            elif event == "stop":
                logger.info("[Voicebot WS] Exotel call stream stopped by caller")
                break

    except WebSocketDisconnect:
        logger.info(f"[Voicebot WS] Caller {target_phone} disconnected")
    except Exception as e:
        logger.error(f"[Voicebot WS] Error in stream loop: {e}", exc_info=True)
    finally:
        logger.info(f"[Voicebot WS] Connection closed for {call_sid}")
        try:
            await _coordinator.handle_disconnect(phone=target_phone, channel="ivr", session_key=call_sid)
        except Exception as disc_err:
            logger.warning(f"[Voicebot WS] Error in handle_disconnect: {disc_err}")
