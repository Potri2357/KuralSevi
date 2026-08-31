"""
Kural Sevi — Interview Coordinator
Application Service / Clean Architecture Boundary:
Coordinates the conversational interview workflow across all channels (IVR, WhatsApp, Field-worker).
Routers are thin protocol adapters; this service handles the business orchestration.
All responses are natively voiced in regional languages (Tamil, Hindi, Telugu).
"""
import os
import logging
from dataclasses import dataclass
from typing import Optional


from .session_manager import SessionManager
from .llm_service import GeminiInterviewDriver, LLMExtractionResult
from .interview_fsm import InterviewFSM, InterviewSession, InterviewState
from .tts_service import synthesize_speech, TTSResult
from prompts.interview_system_prompt import CONSENT_SCRIPTS, WRAP_UP_SCRIPTS, REFUSAL_SCRIPTS
from config import settings

logger = logging.getLogger(__name__)

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
        channel: str,
        language: str = "ta",
        session_key: Optional[str] = None,
    ) -> tuple[InterviewSession, InterviewFSM, bool]:
        """
        Retrieves or initializes an active interview session and its FSM.
        Handles FR-13a resume logic if call dropped.
        """
        key = session_key or f"{channel}_{phone}"

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
    ) -> CoordinatorTurnResult:
        key = session_key or f"{channel}_{phone}"
        session, fsm, is_resumed = await self.get_or_create_session(
            phone=phone, channel=channel, language=language, session_key=key
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
                await self.sm.save_consent(
                    beneficiary_id=session.beneficiary_id,
                    session_id=session.session_id,
                    channel=channel,
                    language_code=session.language_code,
                    consent_text=f"Consent refused via {channel}",
                    consent_given=False,
                )
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
                await self.sm.save_consent(
                    beneficiary_id=session.beneficiary_id,
                    session_id=session.session_id,
                    channel=channel,
                    language_code=session.language_code,
                    consent_text=f"Consent given via {channel}",
                    consent_given=True,
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

            if llm_result.action == "extract" and llm_result.field_name and llm_result.field_value:
                fsm.transition(
                    "field_extracted",
                    field_name=llm_result.field_name,
                    field_value=llm_result.field_value,
                    confidence=llm_result.confidence,
                    readback_text=llm_result.readback_text or llm_result.field_value,
                )
                await self.sm.save_field_extraction(
                    session_id=session.session_id,
                    field_name=llm_result.field_name,
                    field_value=llm_result.field_value,
                    raw_transcript=user_speech,
                    confidence=llm_result.confidence,
                    readback_text=llm_result.readback_text or "",
                )
                # Auto-confirm in conversational flow so interview advances smoothly
                fsm.transition("field_confirmed", field_name=llm_result.field_name)
                await self.sm.confirm_field(session.session_id, llm_result.field_name)

            elif llm_result.action == "unknown" and llm_result.field_name:
                fsm.transition("field_unknown", field_name=llm_result.field_name)
                await self.sm.mark_field_unknown(session.session_id, llm_result.field_name)

        # ── Turn 4: Check if Interview is now Completed ────────────────────────
        if session.state == InterviewState.COMPLETED:
            await self.sm.mark_session_completed(session.session_id)
            profile_id = await self.sm.create_profile_from_session(session)
            case_id = session.session_id[:12].upper()
            spoken = WRAP_UP_SCRIPTS.get(session.language_code, WRAP_UP_SCRIPTS["ta"]).format(case_id=case_id)
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

        # ── Turn 6: Synthesize TTS Audio via Sarvam AI ──────────────────────────
        audio_bytes = await self._synthesize_safe(spoken_text, session.language_code, speaker=speaker)

        return CoordinatorTurnResult(
            session_id=session.session_id,
            spoken_response=spoken_text,
            audio_bytes=audio_bytes,
            state=session.state,
            is_completed=False,
            case_id=None,
            current_field=session.current_field,
        )

    async def _synthesize_safe(self, text: str, language_code: str, speaker: Optional[str] = None) -> Optional[bytes]:
        """Safely generates TTS audio with static cache and network retries."""
        if settings.enable_mock_tts or not text:
            return None

        # Fast path: Pre-rendered static prompt for instant zero-latency playback
        if "இந்த தகவல்கள் உங்கள் கல்வி" in text:
            for p in ("static_audio/consent_ta.wav", "apps/voice-api/static_audio/consent_ta.wav"):
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
