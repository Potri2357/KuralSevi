"""
Kural Sevi — Session Manager
Persists interview sessions to Supabase with in-memory fallback for local development.
Handles FR-13a resume/continuity on call drop.
"""
import asyncio
import hashlib
import hmac
import secrets
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from supabase import create_client, Client

from .interview_fsm import InterviewSession, FieldData, InterviewState, PS_FIELDS_ORDER

logger = logging.getLogger(__name__)
SESSION_TOKEN_TTL_MINUTES = 120  # 2 hours for reconnect window


def hash_phone(phone: str, secret: str) -> str:
    return hmac.new(secret.encode(), phone.encode(), hashlib.sha256).hexdigest()


def hash_aadhaar(aadhaar: str, secret: str) -> str:
    return hmac.new(secret.encode(), aadhaar.encode(), hashlib.sha256).hexdigest()


class SessionManager:
    # Circuit breaker: skip Supabase after N consecutive failures (opens for 5 min)
    _CB_THRESHOLD = 1   # Open immediately on first failure (tables don't exist yet)
    _CB_RESET_SECONDS = 300

    def __init__(self, supabase_url: str, service_role_key: str, hmac_secret: str):
        try:
            self.db: Optional[Client] = create_client(supabase_url, service_role_key)
        except Exception as e:
            logger.warning(f"Supabase client initialization warning: {e}. In-memory mode active.")
            self.db = None
        self.hmac_secret = hmac_secret

        # Resilient in-memory storage for local development & fallback
        self._mem_beneficiaries: Dict[str, dict] = {}
        self._mem_sessions: Dict[str, InterviewSession] = {}
        self._mem_session_records: Dict[str, dict] = {}

        # Pre-seed demo known beneficiary for standard test line (+919876543210)
        demo_phone_hash = hash_phone("+919876543210", self.hmac_secret)
        self._mem_beneficiaries[demo_phone_hash] = {
            "id": "ben-demo-001",
            "case_id": "KS-2026-00142",
            "phone_hash": demo_phone_hash,
            "name": "ராமசாமி",
            "district": "நாமக்கல்",
            "state": "Tamil Nadu",
            "language_code": "ta",
            "is_known": True,
        }

        # Circuit breaker state
        self._cb_failures = 0
        self._cb_open_until: Optional[datetime] = None
        if self.db:
            try:
                self.db.table("sessions").select("id").limit(1).execute()
            except Exception as e:
                self._cb_record_failure(e)

    def _db_ok(self) -> bool:
        """Returns True if Supabase calls should be attempted (circuit closed)."""
        if not self.db:
            return False
        if self._cb_open_until and datetime.now(timezone.utc) < self._cb_open_until:
            return False  # Circuit open — skip DB
        return True

    def _cb_record_failure(self, err: Optional[Exception] = None):
        self._cb_failures += 1
        err_str = str(err or "")
        if any(k in err_str for k in ["PGRST205", "Could not find the table", "Connection reset", "ConnectError", "Errno 54"]):
            # Tables do not exist or Supabase connection reset. Permanently switch to in-memory mode for this run.
            self._cb_open_until = datetime.now(timezone.utc) + timedelta(days=365)
            logger.info("Supabase unavailable or not initialized. Operating in zero-latency in-memory mode.")
            return

        if self._cb_failures >= self._CB_THRESHOLD:
            self._cb_open_until = datetime.now(timezone.utc) + timedelta(seconds=self._CB_RESET_SECONDS)
            logger.warning(f"Supabase circuit breaker OPENED for {self._CB_RESET_SECONDS}s after {self._cb_failures} failures")

    def _cb_record_success(self):
        self._cb_failures = 0
        self._cb_open_until = None

    # ── Beneficiary lookup / creation ──────────────────────────────────────────

    async def find_or_create_beneficiary(
        self,
        phone: str,
        district: str,
        state: str,
        language_code: str,
    ) -> dict:
        phone_hash = hash_phone(phone, self.hmac_secret)

        if self._db_ok():
            try:
                # Look up existing beneficiary by phone hash
                result = self.db.table("beneficiaries").select("*").eq("phone_hash", phone_hash).limit(1).execute()
                if result.data:
                    self._cb_record_success()
                    ben = result.data[0]
                    ben["is_known"] = bool(ben.get("name_encrypted") or ben.get("name"))
                    ben["name"] = ben.get("name") or ben.get("name_encrypted")
                    return ben

                # Generate a new case ID
                case_id = f"KS-2026-{secrets.randbelow(90000) + 10000}"
                try:
                    case_id_result = self.db.rpc("generate_case_id").execute()
                    if case_id_result.data:
                        case_id = case_id_result.data
                except Exception:
                    pass

                new_beneficiary = {
                    "case_id": case_id,
                    "phone_hash": phone_hash,
                    "district": district,
                    "state": state,
                    "language_code": language_code,
                }
                created = self.db.table("beneficiaries").insert(new_beneficiary).execute()
                if created.data:
                    self._cb_record_success()
                    ben = created.data[0]
                    ben["is_known"] = False
                    ben["name"] = None
                    return ben
            except Exception as e:
                self._cb_record_failure(e)
                logger.warning(f"Supabase beneficiary query failed ({e}). Using in-memory fallback.")

        # In-memory fallback
        if phone_hash in self._mem_beneficiaries:
            ben = self._mem_beneficiaries[phone_hash]
            ben["is_known"] = bool(ben.get("name"))
            return ben

        case_id = f"KS-2026-{secrets.randbelow(90000) + 10000}"
        beneficiary = {
            "id": str(uuid.uuid4()),
            "case_id": case_id,
            "phone_hash": phone_hash,
            "name": None,
            "district": district,
            "state": state,
            "language_code": language_code,
            "is_known": False,
        }
        self._mem_beneficiaries[phone_hash] = beneficiary
        return beneficiary

    async def update_beneficiary_identity(
        self,
        beneficiary_id: str,
        name: str,
        place: Optional[str] = None,
    ):
        """Persists extracted or corrected name and place to the beneficiary record."""
        # Update in memory
        for b in self._mem_beneficiaries.values():
            if b.get("id") == beneficiary_id:
                b["name"] = name
                if place:
                    b["district"] = place
                b["is_known"] = True
                logger.info(f"Updated in-memory beneficiary {beneficiary_id}: name='{name}', place='{place}'")
                break

        if self._db_ok():
            def _sync():
                try:
                    update_data = {"name_encrypted": name}
                    if place:
                        update_data["district"] = place
                    self.db.table("beneficiaries").update(update_data).eq("id", beneficiary_id).execute()
                    logger.info(f"Updated database beneficiary {beneficiary_id}: name='{name}'")
                except Exception as e:
                    logger.warning(f"Failed to update beneficiary identity in DB: {e}")
            await asyncio.to_thread(_sync)

    # ── Session lifecycle ──────────────────────────────────────────────────────

    async def create_session(
        self,
        beneficiary_id: str,
        channel: str,
        language_code: str,
        phone: str,
        call_sid: Optional[str] = None,
    ) -> InterviewSession:
        phone_hash = hash_phone(phone, self.hmac_secret)
        session_token = secrets.token_urlsafe(32)
        token_expiry = (datetime.now(timezone.utc) + timedelta(minutes=SESSION_TOKEN_TTL_MINUTES)).isoformat()
        session_id = str(uuid.uuid4())

        if self._db_ok():
            try:
                db_session = {
                    "beneficiary_id": beneficiary_id,
                    "channel": channel,
                    "state": "initiated",
                    "language_code": language_code,
                    "phone_number_hash": phone_hash,
                    "session_token": session_token,
                    "session_token_expires_at": token_expiry,
                    "call_sid": call_sid,
                }
                result = self.db.table("sessions").insert(db_session).execute()
                if result.data:
                    self._cb_record_success()
                    session_id = result.data[0]["id"]
            except Exception as e:
                self._cb_record_failure(e)
                logger.warning(f"Supabase session creation failed ({e}). Using in-memory session.")

        interview_session = InterviewSession(
            session_id=session_id,
            beneficiary_id=beneficiary_id,
            language_code=language_code,
        )
        self._mem_sessions[session_id] = interview_session
        self._mem_session_records[session_id] = {
            "id": session_id,
            "beneficiary_id": beneficiary_id,
            "phone_hash": phone_hash,
            "call_sid": call_sid,
            "state": "initiated",
        }
        return interview_session

    async def resume_session(self, phone: str, call_sid: str) -> Optional[InterviewSession]:
        phone_hash = hash_phone(phone, self.hmac_secret)
        now = datetime.now(timezone.utc).isoformat()

        if self._db_ok():
            try:
                result = (
                    self.db.table("sessions")
                    .select("*")
                    .eq("phone_number_hash", phone_hash)
                    .eq("state", "dropped")
                    .gt("session_token_expires_at", now)
                    .order("created_at", desc=True)
                    .limit(1)
                    .execute()
                )

                if result.data:
                    db_session = result.data[0]
                    session_id = db_session["id"]

                    fields_result = (
                        self.db.table("session_fields")
                        .select("*")
                        .eq("session_id", session_id)
                        .execute()
                    )

                    interview_session = InterviewSession(
                        session_id=session_id,
                        beneficiary_id=db_session["beneficiary_id"],
                        language_code=db_session["language_code"],
                    )
                    interview_session.state = InterviewState(db_session["state"])
                    interview_session.last_confirmed_field = db_session.get("last_confirmed_field")
                    interview_session.consent_given = True

                    for field_row in (fields_result.data or []):
                        fname = field_row["field_name"]
                        if fname in interview_session.fields:
                            interview_session.fields[fname] = FieldData(
                                name=fname,
                                value=field_row.get("field_value"),
                                raw_transcript=field_row.get("raw_transcript_excerpt"),
                                confidence=field_row.get("extraction_confidence", 0.7),
                                status=field_row.get("status", "pending"),
                                readback_text=field_row.get("readback_text"),
                                confirmed_at=field_row.get("confirmed_at"),
                            )

                    interview_session.resume_from_last_confirmed()
                    self.db.table("sessions").update({
                        "state": "field_collection",
                        "resumed_count": (db_session.get("resumed_count", 0) + 1),
                        "call_sid": call_sid,
                    }).eq("id", session_id).execute()
                    self._cb_record_success()

                    logger.info(f"Resumed session {session_id} from field: {interview_session.last_confirmed_field}")
                    return interview_session
            except Exception as e:
                self._cb_record_failure(e)
                logger.warning(f"Supabase resume query failed ({e}). Checking in-memory sessions.")

        # In-memory check
        for s_id, s in self._mem_sessions.items():
            rec = self._mem_session_records.get(s_id, {})
            if rec.get("phone_hash") == phone_hash and rec.get("state") == "dropped":
                s.resume_from_last_confirmed()
                rec["state"] = "field_collection"
                return s

        return None

    # ── Field persistence ──────────────────────────────────────────────────────

    async def save_field_extraction(
        self,
        session_id: str,
        field_name: str,
        field_value: str,
        raw_transcript: str,
        confidence: float,
        readback_text: str,
    ):
        if self._db_ok():
            def _sync():
                try:
                    self.db.table("session_fields").upsert({
                        "session_id": session_id,
                        "field_name": field_name,
                        "field_value": field_value,
                        "raw_transcript_excerpt": raw_transcript[:500],
                        "extraction_confidence": confidence,
                        "status": "extracted",
                        "readback_text": readback_text,
                    }, on_conflict="session_id,field_name").execute()
                except Exception as e:
                    self._cb_record_failure(e)
                    logger.warning(f"Supabase save_field_extraction failed ({e}).")
            await asyncio.to_thread(_sync)

    async def confirm_field(self, session_id: str, field_name: str):
        if self._db_ok():
            def _sync():
                try:
                    now_str = datetime.now(timezone.utc).isoformat()
                    self.db.table("session_fields").update({
                        "status": "confirmed",
                        "confirmed_at": now_str,
                    }).eq("session_id", session_id).eq("field_name", field_name).execute()

                    self.db.table("sessions").update({
                        "last_confirmed_field": field_name,
                    }).eq("id", session_id).execute()
                except Exception as e:
                    self._cb_record_failure(e)
                    logger.warning(f"Supabase confirm_field failed ({e}).")
            await asyncio.to_thread(_sync)

    async def mark_field_unknown(self, session_id: str, field_name: str):
        if self._db_ok():
            def _sync():
                try:
                    self.db.table("session_fields").upsert({
                        "session_id": session_id,
                        "field_name": field_name,
                        "status": "unknown",
                    }, on_conflict="session_id,field_name").execute()
                except Exception as e:
                    self._cb_record_failure(e)
                    logger.warning(f"Supabase mark_field_unknown failed ({e}).")
            await asyncio.to_thread(_sync)

    async def mark_session_dropped(self, session_id: str):
        if session_id in self._mem_session_records:
            self._mem_session_records[session_id]["state"] = "dropped"
        if self._db_ok():
            def _sync():
                try:
                    self.db.table("sessions").update({
                        "state": "dropped",
                        "dropped_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", session_id).execute()
                except Exception as e:
                    self._cb_record_failure(e)
                    logger.warning(f"Supabase mark_session_dropped failed ({e}).")
            await asyncio.to_thread(_sync)

    async def mark_session_completed(self, session_id: str):
        if session_id in self._mem_session_records:
            self._mem_session_records[session_id]["state"] = "completed"
        if self._db_ok():
            def _sync():
                try:
                    self.db.table("sessions").update({
                        "state": "completed",
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", session_id).execute()
                except Exception as e:
                    self._cb_record_failure(e)
                    logger.warning(f"Supabase mark_session_completed failed ({e}).")
            await asyncio.to_thread(_sync)

    # ── Consent ────────────────────────────────────────────────────────────────

    async def save_consent(
        self,
        beneficiary_id: str,
        session_id: str,
        channel: str,
        language_code: str,
        consent_text: str,
        consent_given: bool,
    ):
        if self._db_ok():
            def _sync():
                try:
                    consent_hash = hashlib.sha256(consent_text.encode()).hexdigest()
                    self.db.table("consent_records").insert({
                        "beneficiary_id": beneficiary_id,
                        "session_id": session_id,
                        "channel": channel,
                        "language_code": language_code,
                        "consent_text_hash": consent_hash,
                        "consent_given": consent_given,
                        "purpose": "Livelihood profiling and NSQF-aligned skilling recommendations under PM-AJAY GIA",
                    }).execute()
                except Exception as e:
                    self._cb_record_failure(e)
                    logger.warning(f"Supabase save_consent failed ({e}).")
            await asyncio.to_thread(_sync)

    # ── Profile creation ───────────────────────────────────────────────────────

    async def create_profile_from_session(self, session: InterviewSession) -> Optional[str]:
        if not session.all_fields_collected:
            logger.warning(f"Session {session.session_id} not all fields collected, skipping profile")
            return None

        import json as _json

        def fval(name: str):
            f = session.fields.get(name)
            return f.value if f and f.status in ("confirmed",) else None

        profile_id = str(uuid.uuid4())
        if self._db_ok():
            try:
                profile_data = {
                    "beneficiary_id": session.beneficiary_id,
                    "session_id": session.session_id,
                    "educational_background": _json.dumps({"raw": fval("educational_background")}),
                    "family_occupation": _json.dumps({"raw": fval("family_occupation")}),
                    "current_livelihood": _json.dumps({"raw": fval("current_livelihood")}),
                    "skills_and_interests": _json.dumps({"raw": fval("skills_and_interests")}),
                    "mobility_constraints": _json.dumps({"raw": fval("mobility_constraints")}),
                    "employment_preference": fval("employment_preference") or "either",
                    "local_economic_context": _json.dumps({"raw": fval("local_economic_context")}),
                    "profile_completeness": session.completeness,
                    "is_complete": session.completeness >= 0.8,
                }
                result = self.db.table("profiles").insert(profile_data).execute()
                if result.data:
                    profile_id = result.data[0]["id"]
            except Exception as e:
                logger.warning(f"Supabase profile creation failed ({e}).")

        return profile_id
