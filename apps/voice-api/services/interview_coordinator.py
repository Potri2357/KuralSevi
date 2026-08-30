"""
Kural Sevi — Interview Coordinator
Application Service / Clean Architecture Boundary:
Coordinates the conversational interview workflow across all channels (IVR, WhatsApp, Field-worker).
Routers are thin protocol adapters; this service handles the business orchestration.
"""
import logging
from dataclasses import dataclass
from typing import Optional

from .session_manager import SessionManager
from .llm_service import GeminiInterviewDriver, LLMExtractionResult
from .interview_fsm import InterviewFSM, InterviewSession, InterviewState
from .tts_service import synthesize_speech, TTSResult
from ..config import settings

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
    Unified application coordinator for interview turns across IVR and WhatsApp.
    Ensures that conversation rules, consent checks, and confirmation loops
    are identical and isolated from telephony or messaging transport protocols.
    """

    def __init__(
        self,
        session_manager: Optional[SessionManager] = None,
        llm_driver: Optional[GeminiInterviewDriver] = None,
    ):
        self.sm = session_manager or SessionManager(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
            hmac_secret=settings.consent_hmac_secret,
        )
        self.llm = llm_driver or GeminiInterviewDriver(
            api_key=settings.google_ai_api_key,
            model=settings.gemini_model,
            mock_mode=settings.enable_mock_llm,
        )
        # Session cache indexed by session_token or channel identifier
        self._active_sessions: dict[str, dict] = {}

    async def get_or_create_session(
        self,
        phone: str,
        channel: str,
        language: str = "ta",
        district: str = "Unknown",
        state: str = "Tamil Nadu",
        session_key: Optional[str] = None,
    ) -> tuple[InterviewSession, InterviewFSM, bool]:
        key = session_key or f"{channel}_{phone}"

        if key in self._active_sessions:
            item = self._active_sessions[key]
            return item["session"], item["fsm"], False

        # Attempt to resume dropped session (FR-13a)
        resumed = await self.sm.resume_session(phone=phone, call_sid=key)
        if resumed:
            fsm = InterviewFSM(resumed)
            self._active_sessions[key] = {"session": resumed, "fsm": fsm}
            return resumed, fsm, True

        # Create new beneficiary and session
        beneficiary = await self.sm.find_or_create_beneficiary(
            phone=phone, district=district, state=state, language_code=language
        )
        new_session = await self.sm.create_session(
            beneficiary_id=beneficiary["id"],
            channel=channel,
            language_code=language,
            phone=phone,
            call_sid=key,
        )
        fsm = InterviewFSM(new_session)
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
    ) -> CoordinatorTurnResult:
        key = session_key or f"{channel}_{phone}"
        session, fsm, is_resumed = await self.get_or_create_session(
            phone=phone, channel=channel, language=language, session_key=key
        )

        session.stt_confidences.append(stt_confidence)
        user_lower = user_speech.lower().strip()

        # 1. Handle Consent Stage
        if session.state == InterviewState.CONSENT_PENDING:
            consent_given = any(w in user_lower for w in ["yes", "ஆமாம்", "हाँ", "అవును", "ok", "okay"])
            fsm.transition("consent_given" if consent_given else "consent_refused")

            await self.sm.save_consent(
                beneficiary_id=session.beneficiary_id,
                session_id=session.session_id,
                channel=channel,
                language_code=session.language_code,
                consent_text=f"Consent {'given' if consent_given else 'refused'} via {channel}",
                consent_given=consent_given,
            )

            if not consent_given:
                return CoordinatorTurnResult(
                    session_id=session.session_id,
                    spoken_response="Thank you. Consent was not provided. Goodbye.",
                    audio_bytes=None,
                    state=session.state,
                    is_completed=True,
                    case_id=None,
                    current_field=None,
                )

        # 2. Handle Confirmation Stage
        elif session.state == InterviewState.CONFIRMATION:
            confirmed = any(w in user_lower for w in ["yes", "ஆமாம்", "हाँ", "అవును", "correct", "right", "ok"])
            current = session.current_field
            if current:
                if confirmed:
                    fsm.transition("field_confirmed", field_name=current)
                    await self.sm.confirm_field(session.session_id, current)
                else:
                    fsm.transition("field_rejected", field_name=current)

        # 3. Handle Field Collection via LLM
        elif session.state == InterviewState.FIELD_COLLECTION and user_speech:
            llm_result: LLMExtractionResult = await self.llm.process_turn(session, fsm, user_speech=user_speech)
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
            elif llm_result.action == "unknown" and llm_result.field_name:
                fsm.transition("field_unknown", field_name=llm_result.field_name)
                await self.sm.mark_field_unknown(session.session_id, llm_result.field_name)

        # 4. Check if Interview is now Completed
        if session.state == InterviewState.COMPLETED:
            await self.sm.mark_session_completed(session.session_id)
            profile_id = await self.sm.create_profile_from_session(session)
            case_id = session.session_id[:12].upper()
            spoken = f"Your interview is complete. Case ID: {case_id}. An officer will contact you within 3 days."
            if key in self._active_sessions:
                del self._active_sessions[key]
            return CoordinatorTurnResult(
                session_id=session.session_id,
                spoken_response=spoken,
                audio_bytes=None,
                state=InterviewState.COMPLETED,
                is_completed=True,
                case_id=case_id,
                current_field=None,
            )

        # 5. Generate Next Conversational Turn Prompt
        next_turn = await self.llm.process_turn(session, fsm, is_initial=is_initial)
        spoken_text = next_turn.spoken_response

        # 6. Synthesize TTS Audio
        audio_bytes = None
        try:
            tts_res: TTSResult = await synthesize_speech(
                text=spoken_text,
                language_code=session.language_code,
                sarvam_api_key=settings.sarvam_api_key,
                sarvam_tts_url=settings.sarvam_tts_url,
                mock_mode=settings.enable_mock_tts,
            )
            audio_bytes = tts_res.audio_bytes
        except Exception as e:
            logger.error(f"TTS synthesis error in coordinator: {e}")

        return CoordinatorTurnResult(
            session_id=session.session_id,
            spoken_response=spoken_text,
            audio_bytes=audio_bytes,
            state=session.state,
            is_completed=False,
            case_id=None,
            current_field=session.current_field,
        )

    async def handle_disconnect(self, phone: str, channel: str, session_key: Optional[str] = None):
        key = session_key or f"{channel}_{phone}"
        if key in self._active_sessions:
            session = self._active_sessions[key]["session"]
            await self.sm.mark_session_dropped(session.session_id)
            del self._active_sessions[key]
            logger.info(f"Marked session {session.session_id} as dropped.")
