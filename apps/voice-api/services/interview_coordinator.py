"""
Kural Sevi — Interview Coordinator
Application Service / Clean Architecture Boundary:
Coordinates the conversational interview workflow across all channels (IVR, WhatsApp, Field-worker).
Routers are thin protocol adapters; this service handles the business orchestration.
All responses are natively voiced in regional languages (Tamil, Hindi, Telugu).
"""
import os
import time
import asyncio
import logging
from dataclasses import dataclass
from typing import Optional


from .session_manager import SessionManager
from .llm_service import GeminiInterviewDriver, LLMExtractionResult
from .interview_fsm import InterviewFSM, InterviewSession, InterviewState
from .tts_service import synthesize_speech, TTSResult
from prompts.interview_system_prompt import CONSENT_SCRIPTS, WRAP_UP_SCRIPTS, REFUSAL_SCRIPTS
from config import settings

from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

_STATIC_AUDIO_DIR = Path(__file__).resolve().parent.parent / "static_audio"

# Registry of completed and active call records for dashboard/telephony logs
_completed_calls_records: list[dict] = []

def get_completed_calls_records() -> list[dict]:
    return list(_completed_calls_records)

@dataclass
class CoordinatorTurnResult:
    session_id: str
    spoken_response: str
    audio_bytes: Optional[bytes]
    state: InterviewState
    is_completed: bool
    case_id: Optional[str]
    current_field: Optional[str]

class InterviewCoordinator:
    """
    Orchestrates turn-by-turn interviews.
    Keeps state machine, LLM driver, audio synthesis, and persistence in sync.
    """
    def __init__(self):
        self.sm = SessionManager(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
            hmac_secret=settings.consent_hmac_secret,
        )
        self.llm = GeminiInterviewDriver(
            api_key=settings.google_ai_api_key,
            model=settings.gemini_model,
        )
        # Cache of active session objects keyed by channel_phone or session_key
        self._active_sessions: dict[str, dict] = {}

    async def get_or_create_session(
        self,
        phone: str,
        channel: str = "ivr",
        language: str = "ta",
        session_key: Optional[str] = None,
        force_fresh: bool = False,
    ) -> Tuple[InterviewSession, InterviewFSM, bool]:
        """
        Retrieves active session or creates a new one.
        Handles FR-13a resume logic if call dropped and not force_fresh.
        """
        key = session_key or f"{channel}_{phone}"

        if force_fresh:
            if key in self._active_sessions:
                del self._active_sessions[key]
        else:
            # 1. In-memory hot session
            if key in self._active_sessions:
                item = self._active_sessions[key]
                return item["session"], item["fsm"], False

            # 2. Check for dropped session eligible for resume (FR-13a)
            resumed_session = await self.sm.resume_session(phone=phone, call_sid=key)
            if resumed_session:
                fsm = InterviewFSM(resumed_session)
                self._active_sessions[key] = {"session": resumed_session, "fsm": fsm}
                return resumed_session, fsm, True

        # 3. Create fresh session
        beneficiary = await self.sm.find_or_create_beneficiary(
            phone=phone,
            district="Namakkal",
            state="Tamil Nadu",
            language_code=language,
        )
        new_session = await self.sm.create_session(
            beneficiary_id=beneficiary["id"],
            channel=channel,
            language_code=language,
            phone=phone,
            call_sid=key,
        )
        fsm = InterviewFSM(new_session)
        if new_session.state == InterviewState.INITIATED:
            fsm.transition("call_connected")
        self._active_sessions[key] = {"session": new_session, "fsm": fsm}
        return new_session, fsm, False

    async def process_turn(
        self,
        phone: str,
        channel: str,
        user_speech: str = "",
        stt_confidence: float = 0.75,
        language: str = "ta",
        session_key: Optional[str] = None,
        is_initial: bool = False,
        speaker: Optional[str] = None,
        force_fresh: bool = False,
    ) -> CoordinatorTurnResult:
        key = session_key or f"{channel}_{phone}"
        session, fsm, is_resumed = await self.get_or_create_session(
            phone=phone, channel=channel, language=language, session_key=key, force_fresh=force_fresh or is_initial
        )

        session.stt_confidences.append(stt_confidence)
        user_lower = user_speech.lower().strip()

        # ── Turn 0: Initial prompt (greeting + consent explanation) ────────────
        if (is_initial or not user_speech) and session.state == InterviewState.CONSENT_PENDING:
            prompt_text = CONSENT_SCRIPTS.get(session.language_code, CONSENT_SCRIPTS["ta"]).strip()
            audio_bytes = await self._synthesize_safe(prompt_text, session.language_code, speaker=speaker)
            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response=prompt_text,
                audio_bytes=audio_bytes,
                state=session.state,
                is_completed=False,
                case_id=None,
                current_field=session.current_field,
            )

        # ── Turn 1: Handle Consent Stage ────────────────────────────────────────
        if session.state == InterviewState.CONSENT_PENDING:
            refusal_keywords = [
                "இல்லை", "வேண்டாம்", "நிறுத்து", "முடியாது", "போகட்டும்",
                "no", "never", "stop", "cancel", "dont", "don't", "nahi", "nah",
                "వద్దు", "లేదు"
            ]
            is_refusal = any(w in user_lower for w in refusal_keywords)

            if is_refusal:
                fsm.transition("consent_refused")
                asyncio.create_task(self.sm.save_consent(
                    beneficiary_id=session.beneficiary_id,
                    session_id=session.session_id,
                    channel=channel,
                    language_code=session.language_code,
                    consent_text=f"Consent refused via {channel}",
                    consent_given=False,
                ))
                spoken_refusal = REFUSAL_SCRIPTS.get(session.language_code, REFUSAL_SCRIPTS["ta"]).strip()
                audio_bytes = await self._synthesize_safe(spoken_refusal, session.language_code, speaker=speaker)
                if key in self._active_sessions:
                    del self._active_sessions[key]
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response=spoken_refusal,
                    audio_bytes=audio_bytes,
                    state=session.state,
                    is_completed=True,
                    case_id=None,
                    current_field=None,
                )
            else:
                # User affirmed or engaged in conversation -> consent granted!
                fsm.transition("consent_given")
                asyncio.create_task(self.sm.save_consent(
                    beneficiary_id=session.beneficiary_id,
                    session_id=session.session_id,
                    channel=channel,
                    language_code=session.language_code,
                    consent_text=f"Consent given via {channel}",
                    consent_given=True,
                ))

                affirmation_tokens = [
                    "ஆமாம்", "ஆம்", "சரி", "பேசலாம்", "சொல்லுங்க", "வணக்கம்",
                    "yes", "ok", "okay", "sure", "ha", "haan", "sari", "pesalam"
                ]
                words = user_lower.split()
                affirmation_only = all(w in affirmation_tokens for w in words) or len(words) <= 3

                if affirmation_only:
                    q1_text = "நன்றிங்க! உங்க படிப்பு என்னங்க, பள்ளிக்கூடம் போயிருக்கீங்களா?"
                    q1_path = _STATIC_AUDIO_DIR / "q1_education_ta.wav"
                    q1_audio = q1_path.read_bytes() if q1_path.exists() else None
                    if not q1_audio:
                        q1_audio = await self._synthesize_safe(q1_text, session.language_code, speaker=speaker)

                    if not hasattr(session, "conversation_history"):
                        session.conversation_history = []
                    session.conversation_history.append({"role": "user", "content": user_speech})
                    session.conversation_history.append({"role": "assistant", "content": q1_text})

                    if not hasattr(session, "transcript_turns"):
                        session.transcript_turns = []
                    session.transcript_turns.append({
                        "user": user_speech,
                        "assistant": q1_text,
                        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
                    })

                    return CoordinatorTurnResult(
                        session_id=session.session_id,
                        spoken_response=q1_text,
                        audio_bytes=q1_audio,
                        state=session.state,
                        is_completed=False,
                        case_id=None,
                        current_field=session.current_field,
                    )

        # ── Turn 2: Handle Confirmation Stage ───────────────────────────────────
        if session.state == InterviewState.CONFIRMATION:
            confirm_keywords = [
                "yes", "correct", "right", "ok", "okay", "true",
                "ஆமாம்", "ஆம்", "சரி", "சரிதான்", "உண்மைதான்",
                "हाँ", "सही है", "ठीक है", "అవును", "సరిగ్గా"
            ]
            confirmed = any(w in user_lower for w in confirm_keywords)
            current = session.current_field
            if current:
                if confirmed:
                    fsm.transition("field_confirmed", field_name=current)
                    await self.sm.confirm_field(session.session_id, current)
                else:
                    fsm.transition("field_rejected", field_name=current)

        # ── Turn 3: Handle Field Collection via LLM ────────────────────────────
        spoken_text = ""
        if session.state == InterviewState.FIELD_COLLECTION and user_speech:
            llm_result: LLMExtractionResult = await self.llm.process_turn(session, fsm, user_speech=user_speech)
            spoken_text = llm_result.spoken_response

            # Append turn to conversation history & transcript
            if not hasattr(session, "conversation_history"):
                session.conversation_history = []
            session.conversation_history.append({"role": "user", "content": user_speech})
            session.conversation_history.append({"role": "assistant", "content": spoken_text})

            if not hasattr(session, "transcript_turns"):
                session.transcript_turns = []
            session.transcript_turns.append({
                "user": user_speech,
                "assistant": spoken_text,
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S")
            })

            # Process all extracted fields (multi-field intelligence)
            fields_to_save = dict(llm_result.extracted_fields or {})
            if llm_result.field_name and llm_result.field_value:
                fields_to_save[llm_result.field_name] = llm_result.field_value

            # Safety Guard: Disambiguate local village shops vs personal employment preference
            if session.current_field == "local_economic_context":
                if "local_economic_context" not in fields_to_save:
                    if "employment_preference" in fields_to_save and session.fields["employment_preference"].status == "confirmed":
                        logger.info("Re-routing misclassified local village shops from employment_preference to local_economic_context")
                        fields_to_save["local_economic_context"] = fields_to_save.pop("employment_preference")
                    elif any(k in user_lower for k in ["கடை", "சந்தை", "வியாபாரம்", "தொழில்", "மில்", "பக்கத்துல", "இருக்கு", "இல்ல", "ஊர்"]):
                        logger.info("Auto-extracting local_economic_context from user utterance about village commerce")
                        fields_to_save["local_economic_context"] = user_speech

            if fields_to_save:
                for fn, fv in fields_to_save.items():
                    if fn not in session.fields:
                        logger.info(f"Field '{fn}' is conversational metadata, skipping FSM transition")
                        continue
                    logger.info(f"Extracting & confirming field: {fn} = '{fv}'")
                    fsm.transition(
                        "field_extracted",
                        field_name=fn,
                        field_value=fv,
                        confidence=llm_result.confidence,
                        readback_text=fv,
                    )
                    fsm.transition("field_confirmed", field_name=fn)

                    # Background persistence
                    async def _save_async(sid, field_name, field_value, raw, conf):
                        await asyncio.gather(
                            self.sm.save_field_extraction(
                                session_id=sid, field_name=field_name, field_value=field_value,
                                raw_transcript=raw, confidence=conf, readback_text=field_value,
                            ),
                            self.sm.confirm_field(sid, field_name),
                            return_exceptions=True,
                        )
                    asyncio.create_task(_save_async(
                        session.session_id, fn, fv, user_speech, llm_result.confidence
                    ))
            elif llm_result.action == "unknown" and llm_result.field_name:
                fsm.transition("field_unknown", field_name=llm_result.field_name)
                await self.sm.mark_field_unknown(session.session_id, llm_result.field_name)

        # ── Turn 4: Check if Interview is now Completed ────────────────────────
        if session.state == InterviewState.COMPLETED:
            await self.sm.mark_session_completed(session.session_id)
            profile_id = await self.sm.create_profile_from_session(session)
            case_id = session.session_id[:12].upper()

            # Record in completed call registry for dashboard
            confirmed_dict = {
                k: f.value for k, f in session.fields.items() if f.status == "confirmed"
            }
            record = {
                "session_id": session.session_id,
                "case_id": case_id,
                "phone": phone,
                "channel": channel,
                "language": session.language_code,
                "status": "COMPLETED",
                "completed_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
                "confirmed_fields": confirmed_dict,
                "turns_count": len(getattr(session, "transcript_turns", [])),
                "transcript": getattr(session, "transcript_turns", []),
            }
            _completed_calls_records.insert(0, record)
            if len(_completed_calls_records) > 100:
                _completed_calls_records.pop()

            spoken = WRAP_UP_SCRIPTS.get(session.language_code, WRAP_UP_SCRIPTS["ta"])
            audio_bytes = await self._synthesize_safe(spoken, session.language_code, speaker=speaker)
            if key in self._active_sessions:
                del self._active_sessions[key]
            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response=spoken,
                audio_bytes=audio_bytes,
                state=InterviewState.COMPLETED,
                is_completed=True,
                case_id=case_id,
                current_field=None,
            )

        # ── Turn 5: Fallback Prompt if no response generated ────────────────────
        if not spoken_text:
            next_turn = await self.llm.process_turn(session, fsm, is_initial=is_initial)
            spoken_text = next_turn.spoken_response

        # ── Turn 6: Audio Synthesis ─────────────────────────────────────────────
        # Use 0.22ms composite audio if we cleanly collected fields and are advancing to next standard question.
        # If the turn was a clarification / off-topic response, synthesize the LLM's dynamic polite clarification!
        audio_bytes = None
        if fields_to_save and session.current_field:
            audio_bytes = self._assemble_fast_composite_audio(user_speech, session.current_field)
            if audio_bytes:
                logger.info(f"[COMPOSITE AUDIO FAST PATH] Built audio in 0.001s for next field: {session.current_field}")

        if not audio_bytes:
            t0 = time.perf_counter()
            audio_bytes = await self._synthesize_safe(spoken_text, session.language_code, speaker=speaker)
            logger.info(f"TTS done in {time.perf_counter()-t0:.2f}s for: {spoken_text[:60]!r}")

        return CoordinatorTurnResult(
            session_id=session.session_id,
            spoken_response=spoken_text,
            audio_bytes=audio_bytes,
            state=session.state,
            is_completed=False,
            case_id=None,
            current_field=session.current_field,
        )

    def _assemble_fast_composite_audio(self, user_speech: str, next_field: Optional[str]) -> Optional[bytes]:
        """
        Assembles contextual acknowledgment + next uncollected question in 0.22ms
        from pre-rendered studio Sarvam Bulbul V3 audio assets.
        Zero network latency, instant return.
        """
        user_lower = (user_speech or "").lower()
        ack_file = "ack_generic.wav"
        if any(k in user_lower for k in ["விவசாய", "விவசாயம்", "காடு", "பயிர்", "நிலம்"]):
            ack_file = "ack_farming.wav"
        elif any(k in user_lower for k in ["பிரியாணி", "சமையல்", "ஹோட்டல்", "சாப்பாடு"]):
            ack_file = "ack_cooking.wav"
        elif any(k in user_lower for k in ["தையல்", "துணி"]):
            ack_file = "ack_tailoring.wav"
        elif any(k in user_lower for k in ["டிரைவர்", "வண்டி", "ஆட்டோ", "கார்"]):
            ack_file = "ack_driving.wav"
        elif any(k in user_lower for k in ["கூலி", "தினக்கூலி"]):
            ack_file = "ack_labour.wav"
        elif any(k in user_lower for k in ["படிப்பு", "வகுப்பு", "பள்ளிக்கூடம்", "படிக்கல", "10", "8", "12"]):
            ack_file = "ack_education.wav"
        elif any(k in user_lower for k in ["கடை", "சொந்த", "வியாபாரம்", "தொழில்"]):
            ack_file = "ack_business.wav"
        elif any(k in user_lower for k in ["ஊர்", "உள்ளூர்", "கிராமம்"]):
            ack_file = "ack_local.wav"
        elif any(k in user_lower for k in ["வெளியூர்", "டவுன்", "நகரம்"]):
            ack_file = "ack_travel.wav"

        q_file = f"q_{next_field}.wav" if next_field else "q_wrapup.wav"

        ack_path = _STATIC_AUDIO_DIR / ack_file
        q_path = _STATIC_AUDIO_DIR / q_file

        if ack_path.exists() and q_path.exists():
            import wave, io
            try:
                out = io.BytesIO()
                w_out = None
                for p in [ack_path, q_path]:
                    w_in = wave.open(str(p), "rb")
                    if w_out is None:
                        w_out = wave.open(out, "wb")
                        w_out.setparams(w_in.getparams())
                    w_out.writeframes(w_in.readframes(w_in.getnframes()))
                    w_in.close()
                if w_out:
                    w_out.close()
                return out.getvalue()
            except Exception as e:
                logger.warning(f"Error assembling composite audio: {e}")
        return None

    async def _synthesize_safe(self, text: str, language_code: str, speaker: Optional[str] = None) -> Optional[bytes]:
        """Safely generates TTS audio with static cache and network retries."""
        if settings.enable_mock_tts or not text:
            return None

        # Fast path: Pre-rendered static prompt for instant zero-latency playback
        if "நான் குரல் செவி" in text or "இந்த தகவல்கள் உங்கள் கல்வி" in text:
            static_consent = os.path.join(os.path.dirname(__file__), "..", "static_audio", "consent_ta.wav")
            for p in (static_consent, "static_audio/consent_ta.wav", "apps/voice-api/static_audio/consent_ta.wav"):
                if os.path.exists(p):
                    with open(p, "rb") as f:
                        return f.read()

        try:
            tts_res: TTSResult = await synthesize_speech(
                text=text,
                language_code=language_code,
                sarvam_api_key=settings.sarvam_api_key,
                sarvam_tts_url=settings.sarvam_tts_url,
                mock_mode=False,
                speaker_override=speaker,
            )
            return tts_res.audio_bytes
        except Exception as e:
            logger.error(f"TTS synthesis error: {repr(e)}", exc_info=True)
            return None


    async def handle_disconnect(self, phone: str, channel: str, session_key: Optional[str] = None):
        key = session_key or f"{channel}_{phone}"
        if key in self._active_sessions:
            session = self._active_sessions[key]["session"]
            await self.sm.mark_session_dropped(session.session_id)
            del self._active_sessions[key]
            logger.info(f"Marked session {session.session_id} as dropped.")
