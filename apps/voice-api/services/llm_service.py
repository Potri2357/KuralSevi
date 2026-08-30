"""
Kural Sevi — LLM Interview Driver (Gemini 2.5)
Drives the conversational interview, extracts structured fields,
and generates confirmation readbacks.
"""
import re
import json
import logging
from typing import Optional
import google.generativeai as genai

from .interview_fsm import InterviewSession, InterviewFSM, InterviewState
from prompts.interview_system_prompt import (
    build_system_prompt, CONSENT_SCRIPTS, WRAP_UP_SCRIPTS, LANGUAGE_GREETINGS
)

logger = logging.getLogger(__name__)

class LLMExtractionResult:
    def __init__(
        self,
        spoken_response: str,
        action: str,            # "ask_field" | "extract" | "confirm" | "unknown" | "wrap_up"
        field_name: Optional[str] = None,
        field_value: Optional[str] = None,
        confidence: float = 0.7,
        readback_text: Optional[str] = None,
    ):
        self.spoken_response = spoken_response
        self.action = action
        self.field_name = field_name
        self.field_value = field_value
        self.confidence = confidence
        self.readback_text = readback_text


class GeminiInterviewDriver:
    """
    Wraps Gemini 2.5 to drive the Kural Sevi interview.
    Maintains conversation history for context.
    """

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash", mock_mode: bool = False):
        self.mock_mode = mock_mode
        if not mock_mode:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model)
        self.conversation_history: list[dict] = []

    async def process_turn(
        self,
        session: InterviewSession,
        fsm: InterviewFSM,
        user_speech: Optional[str] = None,
        is_initial: bool = False,
    ) -> LLMExtractionResult:
        """Process one conversation turn and return spoken response + extraction."""

        if self.mock_mode:
            return self._mock_response(session, fsm, user_speech, is_initial)

        context = fsm.get_next_question_context()
        action = context.get("action", "unknown")

        # ── Initial greeting ──
        if is_initial or action == "ask_consent":
            greeting = LANGUAGE_GREETINGS.get(session.language_code, LANGUAGE_GREETINGS["hi"])
            consent = CONSENT_SCRIPTS.get(session.language_code, CONSENT_SCRIPTS["hi"])
            spoken = f"{greeting}\n\n{consent}"
            return LLMExtractionResult(spoken_response=spoken, action="ask_consent")

        # ── Wrap up ──
        if action == "wrap_up":
            case_id = session.session_id[:12].upper()
            spoken = WRAP_UP_SCRIPTS.get(session.language_code, WRAP_UP_SCRIPTS["hi"]).format(case_id=case_id)
            return LLMExtractionResult(spoken_response=spoken, action="wrap_up")

        # ── Build system prompt ──
        confirmed_fields = {
            k: v.value for k, v in session.fields.items()
            if v.status == "confirmed" and v.value
        }
        system_prompt = build_system_prompt(
            language_code=session.language_code,
            current_field=context.get("field_name", ""),
            confirmed_fields=confirmed_fields,
        )

        # Build message
        if action == "ask_field":
            user_msg = user_speech or f"Please ask about {context.get('field_name')}"
        elif action == "confirm_field":
            user_msg = user_speech or "Please confirm the extracted field."
        else:
            user_msg = user_speech or "Continue the interview."

        # Add to history
        if user_speech:
            self.conversation_history.append({"role": "user", "parts": [user_speech]})

        # Call Gemini
        try:
            chat = self.model.start_chat(history=self.conversation_history)
            response = await chat.send_message_async(
                f"{system_prompt}\n\nUser said: {user_msg}",
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=300,
                )
            )
            raw_text = response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return LLMExtractionResult(
                spoken_response="Sorry, please repeat that.",
                action="ask_field",
                field_name=context.get("field_name"),
            )

        # Add model response to history
        self.conversation_history.append({"role": "model", "parts": [raw_text]})

        return self._parse_llm_response(raw_text, context)

    def _parse_llm_response(self, raw_text: str, context: dict) -> LLMExtractionResult:
        """Parse structured EXTRACT::, UNKNOWN::, CONFIRM:: tokens from LLM output."""
        spoken_lines = []
        result_action = "ask_field"
        field_name = context.get("field_name")
        field_value = None
        confidence = 0.7
        readback_text = None

        for line in raw_text.split("\n"):
            line = line.strip()

            if line.startswith("EXTRACT::"):
                try:
                    data = json.loads(line[len("EXTRACT::"):])
                    field_name = data.get("field", field_name)
                    field_value = data.get("value")
                    confidence = float(data.get("confidence", 0.7))
                    readback_text = data.get("readback", "")
                    result_action = "extract"
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse EXTRACT JSON: {line}")

            elif line.startswith("UNKNOWN::"):
                result_action = "unknown"

            elif line.startswith("CONFIRM::"):
                try:
                    data = json.loads(line[len("CONFIRM::"):])
                    readback_text = data.get("question", "")
                    result_action = "confirm"
                except json.JSONDecodeError:
                    pass
            else:
                if line:
                    spoken_lines.append(line)

        spoken_response = " ".join(spoken_lines).strip() or "Please continue."
        return LLMExtractionResult(
            spoken_response=spoken_response,
            action=result_action,
            field_name=field_name,
            field_value=field_value,
            confidence=confidence,
            readback_text=readback_text,
        )

    def _mock_response(
        self, session: InterviewSession, fsm: InterviewFSM,
        user_speech: Optional[str], is_initial: bool
    ) -> LLMExtractionResult:
        """Mock responses for local development without real API keys."""
        context = fsm.get_next_question_context()
        action = context.get("action", "unknown")
        lang = session.language_code

        mock_spoken = {
            "ask_consent": LANGUAGE_GREETINGS.get(lang, "") + " " + CONSENT_SCRIPTS.get(lang, ""),
            "ask_field": f"[MOCK] Please tell me about your {context.get('field_name', 'information')}.",
            "confirm_field": f"[MOCK] You said: {context.get('field_value', 'something')}. Is that correct?",
            "wrap_up": WRAP_UP_SCRIPTS.get(lang, "Thank you!").format(case_id="KS-MOCK-001"),
        }.get(action, "[MOCK] Please continue.")

        # Auto-extract mock values for testing
        mock_values = {
            "educational_background": "Completed 8th standard, can read and write",
            "family_occupation": "Traditional weaving family, 3 generations",
            "current_livelihood": "Daily wage agricultural labour",
            "skills_and_interests": "Hand embroidery, tailoring basic stitching, interested in food processing",
            "mobility_constraints": "Can travel 10km, no disability, has 2 children to care for",
            "employment_preference": "Self employment preferred",
            "local_economic_context": "Textile mills nearby, weekly market in town",
        }

        if action == "ask_field" and user_speech:
            field = context.get("field_name", "")
            return LLMExtractionResult(
                spoken_response=f"[MOCK] I understood: {mock_values.get(field, 'noted')}. Let me confirm that.",
                action="extract",
                field_name=field,
                field_value=mock_values.get(field, "unknown"),
                confidence=0.88,
                readback_text=f"You said: {mock_values.get(field, 'information noted')}",
            )

        return LLMExtractionResult(spoken_response=mock_spoken, action=action)
