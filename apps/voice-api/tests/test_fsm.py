"""
Tests for the Interview FSM — FR-13a resume/continuity
"""
import unittest
from datetime import datetime, timezone
from services.interview_fsm import InterviewFSM, InterviewSession, InterviewState, PS_FIELDS_ORDER


def make_session(session_id: str = "test-123", lang: str = "ta") -> InterviewSession:
    return InterviewSession(session_id=session_id, language_code=lang)


def make_fsm(session: InterviewSession = None) -> InterviewFSM:
    return InterviewFSM(session or make_session())


class TestConsentFlow(unittest.TestCase):
    def test_initial_state_is_initiated(self):
        fsm = make_fsm()
        assert fsm.session.state == InterviewState.INITIATED

    def test_call_connected_moves_to_consent(self):
        fsm = make_fsm()
        state = fsm.transition("call_connected")
        assert state == InterviewState.CONSENT_PENDING

    def test_consent_given_moves_to_field_collection(self):
        fsm = make_fsm()
        fsm.transition("call_connected")
        state = fsm.transition("consent_given")
        assert state == InterviewState.FIELD_COLLECTION
        assert fsm.session.consent_given is True

    def test_consent_refused_moves_to_abandoned(self):
        fsm = make_fsm()
        fsm.transition("call_connected")
        state = fsm.transition("consent_refused")
        assert state == InterviewState.ABANDONED


class TestFieldCollection(unittest.TestCase):
    def test_field_extracted_moves_to_confirmation(self):
        session = make_session()
        fsm = make_fsm(session)
        fsm.transition("call_connected")
        fsm.transition("consent_given")
        state = fsm.transition(
            "field_extracted",
            field_name="educational_background",
            field_value="8th standard",
            confidence=0.88,
            readback_text="You said: 8th standard"
        )
        assert state == InterviewState.CONFIRMATION
        assert session.fields["educational_background"].status == "extracted"
        assert session.fields["educational_background"].value == "8th standard"

    def test_field_confirmed_marks_confirmed_and_advances(self):
        session = make_session()
        fsm = make_fsm(session)
        fsm.transition("call_connected")
        fsm.transition("consent_given")
        fsm.transition("field_extracted", field_name="educational_background",
                        field_value="8th standard", confidence=0.88, readback_text="confirmed")
        fsm.transition("field_confirmed", field_name="educational_background")
        assert session.fields["educational_background"].status == "confirmed"
        assert session.last_confirmed_field == "educational_background"

    def test_field_rejected_goes_back_to_collection(self):
        session = make_session()
        fsm = make_fsm(session)
        fsm.transition("call_connected")
        fsm.transition("consent_given")
        fsm.transition("field_extracted", field_name="educational_background",
                        field_value="wrong value", confidence=0.5, readback_text="wrong")
        state = fsm.transition("field_rejected", field_name="educational_background")
        assert state == InterviewState.FIELD_COLLECTION
        assert session.fields["educational_background"].status == "rejected"


class TestResumeOnDisconnect(unittest.TestCase):
    def test_resume_skips_confirmed_fields(self):
        """FR-13a: On reconnect, confirmed fields are not re-asked."""
        session = make_session()
        fsm = make_fsm(session)
        fsm.transition("call_connected")
        fsm.transition("consent_given")

        # Confirm the first 2 fields
        for i, field in enumerate(PS_FIELDS_ORDER[:2]):
            fsm.transition("field_extracted", field_name=field, field_value=f"value_{i}", confidence=0.9, readback_text="ok")
            fsm.transition("field_confirmed", field_name=field)

        assert session.last_confirmed_field == PS_FIELDS_ORDER[1]

        # Simulate disconnect
        fsm.transition("call_dropped")
        assert session.state == InterviewState.DROPPED

        # Simulate reconnect
        fsm.transition("call_resumed")
        # Should resume from field index 2 (not 0 or 1)
        assert session.current_field_index == 2
        assert session.current_field == PS_FIELDS_ORDER[2]


class TestCompleteness(unittest.TestCase):
    def test_completeness_zero_at_start(self):
        session = make_session()
        assert session.completeness == 0.0

    def test_completeness_increases_as_fields_confirmed(self):
        session = make_session()
        fsm = make_fsm(session)
        fsm.transition("call_connected")
        fsm.transition("consent_given")
        for field in PS_FIELDS_ORDER[:3]:
            fsm.transition("field_extracted", field_name=field, field_value="test", confidence=0.9, readback_text="ok")
            fsm.transition("field_confirmed", field_name=field)
        assert abs(session.completeness - 3/7) < 0.01


if __name__ == '__main__':
    unittest.main()
