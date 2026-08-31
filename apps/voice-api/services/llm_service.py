"""
Kural Sevi — LLM Interview Driver (Gemini 2.5)
Drives the conversational interview, extracts structured fields,
and generates confirmation readbacks.
"""
import re
import json
import logging
from typing import Optional
import httpx
import google.generativeai as genai

from config import settings
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

    def __init__(self, api_key: str, model: str = "gemini-3.5-flash", mock_mode: bool = False):
        self.mock_mode = mock_mode
        self.candidate_models = list(dict.fromkeys([model, "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"]))
        if not mock_mode:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model)

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

        # Call Gemini with system prompt and beneficiary utterance
        prompt = (
            f"{system_prompt}\n\n"
            f"Beneficiary Spoke: \"{user_msg}\"\n\n"
            "Instructions: If the beneficiary answered or mentioned relevant information (e.g. education, work, skills), "
            "IMMEDIATELY extract it using EXTRACT::, warmly acknowledge what they said in Tamil, and ask the next uncollected question. "
            "Never repeat or re-ask what they already told you!"
        )

        raw_text = None
        last_err = None
        for m_name in self.candidate_models:
            try:
                mod = genai.GenerativeModel(m_name)
                response = await mod.generate_content_async(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        max_output_tokens=1024,
                    )
                )
                raw_text = response.text
                if raw_text:
                    break
            except Exception as e:
                last_err = e
                logger.warning(f"Gemini model {m_name} hit error ({e}). Trying fallback model...")

        # 2. Fallback to Groq if Gemini models failed or hit quota
        if not raw_text and settings.groq_api_key:
            logger.info("Falling back to Groq...")
            raw_text = await self._call_groq(system_prompt, user_msg)

        # 3. Fallback to OpenRouter if both Gemini and Groq failed or are unconfigured
        if not raw_text and settings.openrouter_api_key:
            logger.info("Falling back to OpenRouter...")
            raw_text = await self._call_openrouter(system_prompt, user_msg)

        if not raw_text:
            logger.error(f"All LLM providers (Gemini, Groq, OpenRouter) exhausted. Last error: {last_err}")
            return LLMExtractionResult(
                spoken_response="மன்னிக்கவும், நீங்கள் கூறியதை மீண்டும் ஒருமுறை கூற முடியுமா?",
                action="ask_field",
                field_name=context.get("field_name"),
            )

        logger.info(f"LLM RAW TEXT:\n{raw_text}")
        return self._parse_llm_response(raw_text, context)

    async def _call_groq(self, system_prompt: str, user_msg: str) -> Optional[str]:
        """Groq API fallback using OpenAI-compatible chat completions."""
        if not settings.groq_api_key:
            return None
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.groq_model or "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Beneficiary Spoke: \"{user_msg}\""},
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        }
        try:
            async with httpx.AsyncClient(http1=True, http2=False, timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    logger.info(f"Groq fallback succeeded using model {settings.groq_model}")
                    return content
                else:
                    logger.warning(f"Groq API error ({resp.status_code}): {resp.text}")
        except Exception as e:
            logger.warning(f"Groq request failed: {e}")
        return None

    async def _call_openrouter(self, system_prompt: str, user_msg: str) -> Optional[str]:
        """OpenRouter API fallback using universal endpoint."""
        if not settings.openrouter_api_key:
            return None
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://kuralsevi.gov.in",
            "X-Title": "Kural Sevi Voice Assistant",
        }
        payload = {
            "model": settings.openrouter_model or "meta-llama/llama-3.3-70b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Beneficiary Spoke: \"{user_msg}\""},
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        }
        try:
            async with httpx.AsyncClient(http1=True, http2=False, timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    logger.info(f"OpenRouter fallback succeeded using model {settings.openrouter_model}")
                    return content
                else:
                    logger.warning(f"OpenRouter API error ({resp.status_code}): {resp.text}")
        except Exception as e:
            logger.warning(f"OpenRouter request failed: {e}")
        return None

    def _parse_llm_response(self, raw_text: str, context: dict) -> LLMExtractionResult:
        """Parse structured EXTRACT::, UNKNOWN::, CONFIRM:: tokens from LLM output (handles multiline JSON)."""
        result_action = "ask_field"
        field_name = context.get("field_name")
        field_value = None
        confidence = 0.7
        readback_text = None

        # 1. Match EXTRACT: {...} or EXTRACT::{...}
        extract_match = re.search(r"EXTRACT:?\s*:?\s*(\{.*?\})", raw_text, re.DOTALL)
        if extract_match:
            try:
                data = json.loads(extract_match.group(1))
                field_name = data.get("field", field_name)
                field_value = data.get("value")
                confidence = float(data.get("confidence", 0.85))
                readback_text = data.get("readback", "")
                result_action = "extract"
            except Exception as e:
                logger.warning(f"Failed to parse EXTRACT JSON: {e}")

        # 2. Match UNKNOWN::{...}
        unknown_match = re.search(r"UNKNOWN:?\s*:?\s*(\{.*?\})", raw_text, re.DOTALL)
        if unknown_match:
            try:
                data = json.loads(unknown_match.group(1))
                field_name = data.get("field", field_name)
                result_action = "unknown"
            except Exception:
                result_action = "unknown"

        # 3. Match CONFIRM::{...}
        confirm_match = re.search(r"CONFIRM:?\s*:?\s*(\{.*?\})", raw_text, re.DOTALL)
        if confirm_match:
            try:
                data = json.loads(confirm_match.group(1))
                readback_text = data.get("question", "")
                result_action = "confirm"
            except Exception:
                pass

        # 4. Try extracting from SPOKEN: section first
        spoken_response = ""
        spoken_match = re.search(r"SPOKEN:\s*(.*?)(?=(?:EXTRACT|UNKNOWN|CONFIRM|$))", raw_text, re.DOTALL | re.IGNORECASE)
        if spoken_match:
            spoken_response = spoken_match.group(1).strip()

        # Fallback to cleaning raw_text if SPOKEN: prefix was not matched
        if not spoken_response:
            spoken_response = raw_text

        # Purge any residual tokens or JSON braces from spoken_response
        cleaned_lines = []
        for line in spoken_response.split("\n"):
            line = line.strip()
            if any(k in line.upper() for k in ["EXTRACT", "UNKNOWN", "CONFIRM", "{", "}"]):
                continue
            if line.startswith("```") or line.startswith("`") or line.startswith("-") or line.startswith("*"):
                continue
            if line:
                cleaned_lines.append(line)
        spoken_response = " ".join(cleaned_lines).strip()

        if not spoken_response:
            spoken_response = "சரிங்க, அடுத்த தகவலைப் பற்றி பேசுவோம்."

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
