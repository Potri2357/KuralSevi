"""
Kural Sevi — Interview Finite State Machine (FR-13a)
Manages the full interview lifecycle:
  CONSENT → FIELD_COLLECTION → CONFIRMATION → COMPLETE
Supports resume on disconnect (FR-13a): saves partial progress per confirmed field.
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class InterviewState(str, Enum):
    INITIATED = "initiated"
    CONSENT_PENDING = "consent_pending"
    CONSENT_CAPTURED = "consent_captured"
    FIELD_COLLECTION = "field_collection"
    CONFIRMATION = "confirmation"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    DROPPED = "dropped"

# Ordered list of 7 PS-mandated fields
PS_FIELDS_ORDER = [
    "educational_background",
    "family_occupation",
    "current_livelihood",
    "skills_and_interests",
    "mobility_constraints",
    "employment_preference",
    "local_economic_context",
]

@dataclass
class FieldData:
    name: str
    value: Optional[str] = None
    raw_transcript: Optional[str] = None
    confidence: float = 0.0
    status: str = "pending"  # pending | extracted | confirmed | rejected | unknown
    readback_text: Optional[str] = None
    confirmed_at: Optional[str] = None

@dataclass
class InterviewSession:
    session_id: str
    beneficiary_id: Optional[str] = None
    language_code: str = "ta"
    state: InterviewState = InterviewState.INITIATED
    fields: dict[str, FieldData] = field(default_factory=lambda: {
        f: FieldData(name=f) for f in PS_FIELDS_ORDER
    })
    current_field_index: int = 0
    consent_given: bool = False
    stt_confidences: list[float] = field(default_factory=list)
    extraction_certainties: list[float] = field(default_factory=list)
    turn_count: int = 0
    last_confirmed_field: Optional[str] = None
    
    @property
    def current_field(self) -> Optional[str]:
        if self.current_field_index < len(PS_FIELDS_ORDER):
            return PS_FIELDS_ORDER[self.current_field_index]
        return None
    
    @property
    def all_fields_collected(self) -> bool:
        return all(
            f.status in ("confirmed", "unknown")
            for f in self.fields.values()
        )
    
    @property
    def completeness(self) -> float:
        confirmed = sum(1 for f in self.fields.values() if f.status == "confirmed")
        return confirmed / len(PS_FIELDS_ORDER)
    
    @property
    def avg_stt_confidence(self) -> float:
        return sum(self.stt_confidences) / len(self.stt_confidences) if self.stt_confidences else 0.7
    
    @property
    def avg_extraction_certainty(self) -> float:
        return sum(self.extraction_certainties) / len(self.extraction_certainties) if self.extraction_certainties else 0.7

    def advance_to_next_field(self):
        """Move to next uncollected field."""
        for i in range(self.current_field_index + 1, len(PS_FIELDS_ORDER)):
            f = self.fields[PS_FIELDS_ORDER[i]]
            if f.status in ("pending", "rejected"):
                self.current_field_index = i
                return
        # All fields processed
        self.current_field_index = len(PS_FIELDS_ORDER)

    def resume_from_last_confirmed(self):
        """
        FR-13a: On reconnect, resume from the last confirmed field.
        Skips already-confirmed fields.
        """
        if self.last_confirmed_field:
            last_idx = PS_FIELDS_ORDER.index(self.last_confirmed_field)
            # Start from field after the last confirmed one
            for i in range(last_idx + 1, len(PS_FIELDS_ORDER)):
                f = self.fields[PS_FIELDS_ORDER[i]]
                if f.status not in ("confirmed", "unknown"):
                    self.current_field_index = i
                    logger.info(f"Resuming session {self.session_id} from field: {PS_FIELDS_ORDER[i]}")
                    return
        # Nothing confirmed yet — restart from the beginning
        self.current_field_index = 0


class InterviewFSM:
    """
    Manages state transitions for an interview session.
    Used by the LLM service to drive conversation flow.
    """
    
    def __init__(self, session: InterviewSession):
        self.session = session
    
    def transition(self, event: str, **kwargs) -> InterviewState:
        """Apply an event to transition the state machine."""
        s = self.session
        
        if event == "call_connected" and s.state == InterviewState.INITIATED:
            s.state = InterviewState.CONSENT_PENDING
        
        elif event == "consent_given" and s.state == InterviewState.CONSENT_PENDING:
            s.consent_given = True
            s.state = InterviewState.CONSENT_CAPTURED
            s.state = InterviewState.FIELD_COLLECTION  # immediate transition
        
        elif event == "consent_refused" and s.state == InterviewState.CONSENT_PENDING:
            s.state = InterviewState.ABANDONED
        
        elif event == "field_extracted" and s.state == InterviewState.FIELD_COLLECTION:
            field_name = kwargs["field_name"]
            field_value = kwargs.get("field_value", "")
            confidence = kwargs.get("confidence", 0.7)
            readback = kwargs.get("readback_text", "")
            
            s.fields[field_name].value = field_value
            s.fields[field_name].confidence = confidence
            s.fields[field_name].status = "extracted"
            s.fields[field_name].readback_text = readback
            s.extraction_certainties.append(confidence)
            s.state = InterviewState.CONFIRMATION
        
        elif event == "field_unknown" and s.state == InterviewState.FIELD_COLLECTION:
            field_name = kwargs["field_name"]
            s.fields[field_name].status = "unknown"
            s.last_confirmed_field = field_name
            s.advance_to_next_field()
            
            if s.all_fields_collected:
                s.state = InterviewState.COMPLETED
            else:
                s.state = InterviewState.FIELD_COLLECTION
        
        elif event == "field_confirmed" and s.state == InterviewState.CONFIRMATION:
            field_name = kwargs["field_name"]
            from datetime import datetime, timezone
            s.fields[field_name].status = "confirmed"
            s.fields[field_name].confirmed_at = datetime.now(timezone.utc).isoformat()
            s.last_confirmed_field = field_name
            s.advance_to_next_field()
            
            if s.all_fields_collected:
                s.state = InterviewState.COMPLETED
            else:
                s.state = InterviewState.FIELD_COLLECTION
        
        elif event == "field_rejected" and s.state == InterviewState.CONFIRMATION:
            field_name = kwargs["field_name"]
            s.fields[field_name].status = "rejected"
            s.fields[field_name].value = None
            s.state = InterviewState.FIELD_COLLECTION  # Re-ask the field
        
        elif event == "call_dropped":
            s.dropped_at = kwargs.get("dropped_at")
            s.state = InterviewState.DROPPED
        
        elif event == "call_resumed":
            s.resume_from_last_confirmed()
            if s.consent_given:
                s.state = InterviewState.FIELD_COLLECTION
            else:
                s.state = InterviewState.CONSENT_PENDING
        
        s.turn_count += 1
        return s.state
    
    def get_next_question_context(self) -> dict:
        """Returns context for the LLM to generate the next question."""
        if self.session.state == InterviewState.CONSENT_PENDING:
            return {"action": "ask_consent", "language": self.session.language_code}
        
        if self.session.state == InterviewState.FIELD_COLLECTION:
            field_name = self.session.current_field
            if field_name:
                confirmed_so_far = {
                    k: v.value for k, v in self.session.fields.items()
                    if v.status == "confirmed"
                }
                return {
                    "action": "ask_field",
                    "field_name": field_name,
                    "language": self.session.language_code,
                    "confirmed_fields": confirmed_so_far,
                    "field_index": self.session.current_field_index,
                    "total_fields": len(PS_FIELDS_ORDER),
                }
        
        if self.session.state == InterviewState.CONFIRMATION:
            current = self.session.current_field
            if current and self.session.fields[current].status == "extracted":
                return {
                    "action": "confirm_field",
                    "field_name": current,
                    "field_value": self.session.fields[current].value,
                    "readback_text": self.session.fields[current].readback_text,
                    "language": self.session.language_code,
                }
        
        if self.session.state == InterviewState.COMPLETED:
            return {"action": "wrap_up", "language": self.session.language_code}
        
        return {"action": "unknown"}
