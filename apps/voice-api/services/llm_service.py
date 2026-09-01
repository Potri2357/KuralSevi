"""
Kural Sevi — LLM Interview Driver (Gemini 2.5)
Drives the conversational interview, extracts structured fields,
and generates confirmation readbacks.
"""
import re
import json
import time
import logging
import asyncio
from typing import Optional
import httpx
import google.generativeai as genai

from config import settings
from .interview_fsm import InterviewSession, InterviewFSM, InterviewState, PS_FIELDS_ORDER
from prompts.interview_system_prompt import (
    build_system_prompt, CONSENT_SCRIPTS, WRAP_UP_SCRIPTS, LANGUAGE_GREETINGS
)

from .circuit_breaker import circuit_breaker

logger = logging.getLogger(__name__)

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Global persistent keep-alive requests session with retries for Groq (eliminates [Errno 54] drops)
_groq_sync_session: Optional[requests.Session] = None

def _get_groq_sync_session() -> requests.Session:
    global _groq_sync_session
    if _groq_sync_session is None:
        _groq_sync_session = requests.Session()
        retries = Retry(total=1, connect=1, read=0, backoff_factor=0.05, allowed_methods=['POST', 'GET'])
        adapter = HTTPAdapter(max_retries=retries, pool_connections=10, pool_maxsize=20)
        _groq_sync_session.mount('https://', adapter)
        _groq_sync_session.headers.update({
            'User-Agent': 'KuralSevi-VoiceAPI/1.0',
            'Content-Type': 'application/json',
        })
    return _groq_sync_session

def warmup_llm():
    """Warms up TLS socket to Groq in background thread."""
    if not settings.groq_api_key:
        return
    try:
        session = _get_groq_sync_session()
        session.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            json={"model": settings.groq_model or "qwen/qwen3.8-27b", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 1},
            timeout=3.0,
        )
    except Exception:
        pass

class LLMExtractionResult:
    def __init__(
        self,
        spoken_response: str,
        action: str = "ask_field",
        field_name: Optional[str] = None,
        field_value: Optional[str] = None,
        confidence: float = 0.95,
        readback_text: Optional[str] = None,
        extracted_fields: Optional[dict[str, str]] = None,
    ):
        self.spoken_response = spoken_response
        self.action = action
        self.field_name = field_name
        self.field_value = field_value
        self.confidence = confidence
        self.readback_text = readback_text
        self.extracted_fields = extracted_fields or {}


class GeminiInterviewDriver:
    """
    Wraps LLM APIs (Groq, OpenRouter, Gemini 3.5) to drive the Kural Sevi interview.
    Features 1-second proactive health probing, automatic failover, and conversation history.
    """
    def __init__(self, api_key: str, model: str = "gemini-3.5-flash-lite", mock_mode: bool = False):
        self.mock_mode = mock_mode
        self.candidate_models = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.5-flash"]
        self.fastest_provider: str = "openrouter"
        self._last_probe: float = 0.0
        if not mock_mode:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(self.candidate_models[0])

    async def probe_fastest_provider(self) -> str:
        """
        Pings Groq, OpenRouter, and Gemini in parallel with a strict 1.0s timeout.
        Updates self.fastest_provider to the lowest-latency healthy provider.
        """
        now = time.perf_counter()
        if now - self._last_probe < 20.0 and self.fastest_provider:
            return self.fastest_provider

        async def _ping_groq():
            t0 = time.perf_counter()
            if not settings.groq_api_key or not circuit_breaker.is_available("groq"):
                return "groq", 999.0
            def _req():
                s = _get_groq_sync_session()
                return s.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                    json={"model": "qwen/qwen3.8-27b", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 1},
                    timeout=1.0,
                )
            try:
                r = await asyncio.to_thread(_req)
                if r.status_code == 200:
                    return "groq", time.perf_counter() - t0
                elif r.status_code == 429:
                    circuit_breaker.trip("groq", "429 Rate Limit", cooldown=30.0)
            except Exception as e:
                circuit_breaker.trip("groq", f"Probe failed ({str(e)[:40]})", cooldown=20.0)
            return "groq", 999.0

        async def _ping_openrouter():
            t0 = time.perf_counter()
            if not settings.openrouter_api_key or not circuit_breaker.is_available("openrouter"):
                return "openrouter", 999.0
            def _req():
                s = _get_groq_sync_session()
                return s.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.openrouter_api_key}", "HTTP-Referer": "https://kuralsevi.gov.in"},
                    json={"model": "meta-llama/llama-3.3-70b-instruct", "messages": [{"role": "user", "content": "hi"}], "max_tokens": 1},
                    timeout=1.0,
                )
            try:
                r = await asyncio.to_thread(_req)
                if r.status_code == 200:
                    return "openrouter", time.perf_counter() - t0
                elif r.status_code == 429:
                    circuit_breaker.trip("openrouter", "429 Rate Limit", cooldown=30.0)
            except Exception as e:
                circuit_breaker.trip("openrouter", f"Probe failed ({str(e)[:40]})", cooldown=20.0)
            return "openrouter", 999.0

        async def _ping_gemini():
            t0 = time.perf_counter()
            if not circuit_breaker.is_available("gemini"):
                return "gemini", 999.0
            def _req():
                mod = genai.GenerativeModel("gemini-3.5-flash-lite")
                return mod.generate_content("hi", generation_config={"max_output_tokens": 1})
            try:
                await asyncio.to_thread(_req)
                return "gemini", time.perf_counter() - t0
            except Exception as e:
                circuit_breaker.trip("gemini", f"Probe failed ({str(e)[:40]})", cooldown=20.0)
            return "gemini", 999.0

        results = await asyncio.gather(_ping_groq(), _ping_openrouter(), _ping_gemini(), return_exceptions=True)
        valid = [(name, lat) for res in results if isinstance(res, tuple) for name, lat in [res] if lat < 900.0]
        self._last_probe = now
        if valid:
            valid.sort(key=lambda x: x[1])
            self.fastest_provider = valid[0][0]
            logger.info(f"[AI HEALTH PROBE] Fastest available AI: {self.fastest_provider.upper()} ({valid[0][1]:.3f}s)")
        else:
            self.fastest_provider = "gemini"
            logger.warning("[AI HEALTH PROBE] All cloud probes timed out, defaulting to Gemini")
        return self.fastest_provider

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
            if v.status == "confirmed"
        }
        system_prompt = build_system_prompt(
            language_code=session.language_code,
            current_field=context.get("field_name", ""),
            confirmed_fields=confirmed_fields,
        )

        user_msg = user_speech or f"Please ask about {context.get('field_name', 'information')}"
        prompt = (
            f"{system_prompt}\n\n"
            f"Beneficiary Spoke: \"{user_msg}\"\n\n"
            "Instructions: Extract fields into EXTRACT, speak in Tamil in SPOKEN."
        )

        raw_text = None
        last_err = None
        history = getattr(session, "conversation_history", [])

        # Dynamic Provider Order based on pre-call health probe
        await self.probe_fastest_provider()
        ordered_providers = ["groq", "openrouter", "gemini"]
        if self.fastest_provider == "openrouter":
            ordered_providers = ["openrouter", "groq", "gemini"]
        elif self.fastest_provider == "gemini":
            ordered_providers = ["gemini", "openrouter", "groq"]

        for prov in ordered_providers:
            if raw_text:
                break
            if prov == "groq" and settings.groq_api_key and circuit_breaker.is_available("groq"):
                try:
                    raw_text = await self._call_groq(system_prompt, user_msg, model="qwen/qwen3.8-27b", history=history)
                    if raw_text:
                        logger.info("Groq primary succeeded with qwen/qwen3.8-27b")
                        break
                except Exception as ge:
                    logger.warning(f"Groq failed: {ge}")
            elif prov == "openrouter" and settings.openrouter_api_key and circuit_breaker.is_available("openrouter"):
                try:
                    raw_text = await self._call_openrouter(system_prompt, user_msg)
                    if raw_text:
                        logger.info("OpenRouter succeeded")
                        break
                except Exception as oe:
                    logger.warning(f"OpenRouter failed: {oe}")
            elif prov == "gemini" and circuit_breaker.is_available("gemini"):
                for m_name in self.candidate_models:
                    try:
                        mod = genai.GenerativeModel(m_name)
                        response = await mod.generate_content_async(
                            prompt,
                            generation_config=genai.types.GenerationConfig(
                                temperature=0.2,
                                max_output_tokens=200,
                            )
                        )
                        raw_text = response.text
                        if raw_text:
                            circuit_breaker.record_success("gemini")
                            logger.info(f"Gemini succeeded with {m_name}")
                            break
                    except Exception as ge:
                        logger.warning(f"Gemini model {m_name} failed: {ge}")

        # Local Ollama fallback on M5 (last line of sovereign defense)
        if not raw_text and circuit_breaker.is_available("ollama"):
            try:
                raw_text = await self._call_ollama(system_prompt, user_msg)
                if raw_text:
                    logger.info("Local Ollama fallback succeeded")
            except Exception as le:
                logger.warning(f"Local Ollama fallback failed: {le}")

        if not raw_text:
            logger.error(f"All LLM providers exhausted. Last error: {last_err}")
            return LLMExtractionResult(
                spoken_response="மன்னிக்கவும், நீங்கள் கூறியதை மீண்டும் ஒருமுறை கூற முடியுமா?",
                action="ask_field",
                field_name=context.get("field_name"),
            )

        logger.info(f"LLM RAW TEXT:\n{raw_text}")
        return self._parse_llm_response(raw_text, context)

    async def _call_ollama(self, system_prompt: str, user_msg: str, model: str = "qwen2.5:7b") -> Optional[str]:
        """Local Ollama instance on M5 (0ms network ping, air-gapped sovereign backup)."""
        url = "http://localhost:11434/v1/chat/completions"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Beneficiary Spoke: \"{user_msg}\""},
            ],
            "temperature": 0.1,
            "max_tokens": 150,
        }
        try:
            async with httpx.AsyncClient(http1=True, http2=False, timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    circuit_breaker.record_success("ollama")
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.warning(f"Ollama error ({resp.status_code}): {resp.text}")
        except Exception as e:
            circuit_breaker.trip("ollama", f"Connection error: {e}", cooldown=30.0)
            logger.warning(f"Ollama local inference failed: {e}")
        return None

    async def _call_groq(
        self,
        system_prompt: str,
        user_msg: str,
        model: Optional[str] = None,
        history: Optional[list[dict[str, str]]] = None,
    ) -> Optional[str]:
        """Groq API: fastest LLM (~0.3s). Uses robust requests session with automatic TLS retries."""
        if not settings.groq_api_key:
            return None
        url = "https://api.groq.com/openai/v1/chat/completions"
        chosen_model = model or settings.groq_model or "qwen/qwen3.8-27b"

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history[-6:])
        messages.append({"role": "user", "content": f"Beneficiary Spoke: \"{user_msg}\""})

        def _sync_request():
            session = _get_groq_sync_session()
            headers = {
                "Authorization": f"Bearer {settings.groq_api_key}",
            }
            payload = {
                "model": chosen_model,
                "messages": messages,
                "temperature": 0.35,
                "max_tokens": 150,
            }
            return session.post(url, headers=headers, json=payload, timeout=4.0)

        try:
            resp = await asyncio.to_thread(_sync_request)
            if resp.status_code == 200:
                circuit_breaker.record_success("groq")
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return content
            elif resp.status_code == 429 or "429" in resp.text:
                circuit_breaker.trip("groq", "429 Rate Limit (RPM Exceeded)", cooldown=15.0)
                return None
            elif resp.status_code == 404:
                return None
            else:
                logger.warning(f"Groq model {chosen_model} error ({resp.status_code}): {resp.text[:160]}")
                return None
        except Exception as e:
            if "429" in str(e):
                circuit_breaker.trip("groq", "429 Rate Limit", cooldown=15.0)
                return None
            logger.warning(f"Groq request to {chosen_model} failed: {repr(e)}")
            return None


    async def _call_openrouter(self, system_prompt: str, user_msg: str) -> Optional[str]:
        """OpenRouter API fallback using universal endpoint with robust session and retries."""
        if not settings.openrouter_api_key:
            return None
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "HTTP-Referer": "https://kuralsevi.gov.in",
            "X-Title": "Kural Sevi Voice Assistant",
        }
        chosen_model = settings.openrouter_model or "meta-llama/llama-3.3-70b-instruct"
        payload = {
            "model": chosen_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Beneficiary Spoke: \"{user_msg}\""},
            ],
            "temperature": 0.2,
            "max_tokens": 180,
        }
        def _sync_request():
            session = _get_groq_sync_session()
            return session.post(url, headers=headers, json=payload, timeout=4.0)

        try:
            resp = await asyncio.to_thread(_sync_request)
            if resp.status_code == 200:
                circuit_breaker.record_success("openrouter")
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                logger.info(f"OpenRouter fallback succeeded using model {chosen_model}")
                return content
            elif resp.status_code == 429:
                circuit_breaker.trip("openrouter", "429 Rate Limit", cooldown=15.0)
                return None
            else:
                logger.warning(f"OpenRouter API error ({resp.status_code}): {resp.text}")
        except Exception as e:
            if "429" in str(e):
                circuit_breaker.trip("openrouter", "429 Rate Limit", cooldown=15.0)
            logger.warning(f"OpenRouter request failed: {e}")
        return None

    def _parse_llm_response(self, raw_text: str, context: dict) -> LLMExtractionResult:
        """Parse structured EXTRACT::, UNKNOWN::, CONFIRM:: tokens from LLM output (handles multi-field map & legacy JSON)."""
        result_action = "ask_field"
        field_name = context.get("field_name")
        field_value = None
        confidence = 0.7
        readback_text = None
        extracted_fields: dict[str, str] = {}

        # 1. Match EXTRACT with balanced brace parsing
        extract_match = re.search(r"EXTRACT:?\s*:?\s*(\{.*)", raw_text, re.DOTALL | re.IGNORECASE)
        if extract_match:
            candidate = extract_match.group(1).strip()
            open_cnt = 0
            end_pos = -1
            for i, ch in enumerate(candidate):
                if ch == "{":
                    open_cnt += 1
                elif ch == "}":
                    open_cnt -= 1
                    if open_cnt == 0:
                        end_pos = i + 1
                        break
            if end_pos != -1:
                json_str = candidate[:end_pos]
                try:
                    data = json.loads(json_str)
                except Exception:
                    try:
                        cleaned = re.sub(r",\s*([\}\]])", r"\1", json_str)
                        data = json.loads(cleaned)
                    except Exception as e:
                        logger.warning(f"Failed to parse EXTRACT JSON: {e}")
                        data = None

                if data and isinstance(data, dict):
                    confidence = float(data.get("confidence", 0.85))
                    readback_text = data.get("readback", "")
                    invalid_values = ("none", "null", "unknown", "n/a", "nil", "")

                    # Multi-field map: "fields": {"field1": "val1", "field2": "val2"}
                    if "fields" in data and isinstance(data["fields"], dict):
                        for fn, fv in data["fields"].items():
                            if fv and str(fv).strip().lower() not in invalid_values:
                                extracted_fields[fn] = str(fv).strip()
                        if extracted_fields:
                            result_action = "extract"
                            field_name = next(iter(extracted_fields))
                            field_value = extracted_fields[field_name]

                    # Single field (legacy): "field": "...", "value": "..."
                    if not extracted_fields and "field" in data:
                        fn = data.get("field")
                        fv = data.get("value")
                        if fn and fv and str(fv).strip().lower() not in invalid_values and confidence >= 0.5:
                            extracted_fields[fn] = str(fv).strip()
                            result_action = "extract"
                            field_name = fn
                            field_value = str(fv).strip()

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
            extracted_fields=extracted_fields,
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
