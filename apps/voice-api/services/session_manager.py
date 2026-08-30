"""
Kural Sevi — Session Manager
Persists interview sessions to Supabase.
Handles FR-13a resume/continuity on call drop.
"""
import hashlib
import hmac
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from supabase import create_client, Client

from .interview_fsm import InterviewSession, FieldData, InterviewState, PS_FIELDS_ORDER

logger = logging.getLogger(__name__)
SESSION_TOKEN_TTL_MINUTES = 120  # 2 hours for reconnect window


def hash_phone(phone: str, secret: str) -> str:
    return hmac.new(secret.encode(), phone.encode(), hashlib.sha256).hexdigest()


def hash_aadhaar(aadhaar: str, secret: str) -> str:
    return hmac.new(secret.encode(), aadhaar.encode(), hashlib.sha256).hexdigest()


class SessionManager:
    def __init__(self, supabase_url: str, service_role_key: str, hmac_secret: str):
        self.db: Client = create_client(supabase_url, service_role_key)
        self.hmac_secret = hmac_secret

    # ── Beneficiary lookup / creation ──────────────────────────────────────────

    async def find_or_create_beneficiary(
        self,
        phone: str,
        district: str,
        state: str,
        language_code: str,
    ) -> dict:
        phone_hash = hash_phone(phone, self.hmac_secret)

        # Look up existing beneficiary by phone hash
        result = self.db.table("beneficiaries").select("*").eq("phone_hash", phone_hash).limit(1).execute()
        if result.data:
            return result.data[0]

        # Generate a new case ID
        case_id_result = self.db.rpc("generate_case_id").execute()
        case_id = case_id_result.data

        # Create new beneficiary (minimal PII — data minimization)
        new_beneficiary = {
            "case_id": case_id,
            "phone_hash": phone_hash,
            "district": district,
            "state": state,
            "language_code": language_code,
        }
        created = self.db.table("beneficiaries").insert(new_beneficiary).execute()
        return created.data[0]

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
        session_id = result.data[0]["id"]

        # Build in-memory FSM session
        interview_session = InterviewSession(
            session_id=session_id,
            beneficiary_id=beneficiary_id,
            language_code=language_code,
        )
        return interview_session

    async def resume_session(self, phone: str, call_sid: str) -> Optional[InterviewSession]:
        """
        FR-13a: Find an in-progress (dropped) session by phone hash and resume it.
        Returns the InterviewSession with state restored from DB.
        """
        phone_hash = hash_phone(phone, self.hmac_secret)
        now = datetime.now(timezone.utc).isoformat()

        # Find latest dropped session with valid token
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

        if not result.data:
            return None

        db_session = result.data[0]
        session_id = db_session["id"]

        # Load confirmed fields from DB
        fields_result = (
            self.db.table("session_fields")
            .select("*")
            .eq("session_id", session_id)
            .execute()
        )

        # Reconstruct InterviewSession
        interview_session = InterviewSession(
            session_id=session_id,
            beneficiary_id=db_session["beneficiary_id"],
            language_code=db_session["language_code"],
        )
        interview_session.state = InterviewState(db_session["state"])
        interview_session.last_confirmed_field = db_session.get("last_confirmed_field")
        interview_session.consent_given = True  # If session existed, consent was given

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

        # Trigger resume logic in FSM
        interview_session.resume_from_last_confirmed()

        # Update session state in DB to resumed
        self.db.table("sessions").update({
            "state": "field_collection",
            "resumed_count": (db_session.get("resumed_count", 0) + 1),
            "call_sid": call_sid,
        }).eq("id", session_id).execute()

        logger.info(f"Resumed session {session_id} from field: {interview_session.last_confirmed_field}")
        return interview_session

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
        """Save an extracted field to DB (status='extracted', not yet confirmed)."""
        self.db.table("session_fields").upsert({
            "session_id": session_id,
            "field_name": field_name,
            "field_value": field_value,
            "raw_transcript_excerpt": raw_transcript[:500],
            "extraction_confidence": confidence,
            "status": "extracted",
            "readback_text": readback_text,
        }, on_conflict="session_id,field_name").execute()

    async def confirm_field(self, session_id: str, field_name: str):
        """Mark a field as confirmed (FR-3: only persisted after confirmation)."""
        from datetime import datetime, timezone
        self.db.table("session_fields").update({
            "status": "confirmed",
            "confirmed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("session_id", session_id).eq("field_name", field_name).execute()

        # Update last_confirmed_field on session
        self.db.table("sessions").update({
            "last_confirmed_field": field_name,
        }).eq("id", session_id).execute()

    async def mark_field_unknown(self, session_id: str, field_name: str):
        self.db.table("session_fields").upsert({
            "session_id": session_id,
            "field_name": field_name,
            "status": "unknown",
        }, on_conflict="session_id,field_name").execute()

    async def mark_session_dropped(self, session_id: str):
        self.db.table("sessions").update({
            "state": "dropped",
            "dropped_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", session_id).execute()

    async def mark_session_completed(self, session_id: str):
        self.db.table("sessions").update({
            "state": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", session_id).execute()

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
        import hashlib
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

    # ── Profile creation ───────────────────────────────────────────────────────

    async def create_profile_from_session(self, session: InterviewSession) -> Optional[str]:
        """Build a confirmed profile from session fields and write to DB."""
        if not session.all_fields_collected:
            logger.warning(f"Session {session.session_id} not all fields collected, skipping profile")
            return None

        import json as _json

        def fval(name: str):
            f = session.fields.get(name)
            return f.value if f and f.status in ("confirmed",) else None

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
        profile_id = result.data[0]["id"]

        # Log to audit
        self.db.table("audit_log").insert({
            "event_type": "profile_created",
            "entity_type": "profile",
            "entity_id": profile_id,
            "actor_type": "system",
            "event_data": {"session_id": session.session_id, "completeness": session.completeness},
        }).execute()

        return profile_id
