"""
Tests for Interactive Voice Course Selection at Interview Wrap-Up
"""
import unittest
import asyncio
from unittest.mock import MagicMock

from services.interview_fsm import InterviewSession, InterviewFSM, InterviewState, PS_FIELDS_ORDER
from services.interview_coordinator import (
    compute_top_recommended_courses,
    get_localized_course_name,
    InterviewCoordinator,
    CATALOG_COURSES,
)
from services.notification_service import NotificationService


class TestCourseLocalizationAndScoring(unittest.TestCase):
    def test_localized_course_names_exist(self):
        for course in CATALOG_COURSES:
            for lang in ["ta", "hi", "ml", "te"]:
                loc_name = get_localized_course_name(course, lang)
                self.assertTrue(bool(loc_name), f"Missing {lang} name for {course['qp_name']}")

    def test_compute_top_recommended_courses_matching(self):
        confirmed = {
            "skills_and_interests": "tailoring and garment stitching",
            "current_livelihood": "stitching",
        }
        top = compute_top_recommended_courses(confirmed)
        self.assertGreaterEqual(len(top), 2)
        # Tailor course should be top ranked
        self.assertEqual(top[0]["qp_code"], "APP/Q0301")


class TestCourseSelectionFSM(unittest.TestCase):
    def test_fsm_course_selection_transitions(self):
        session = InterviewSession(session_id="test-sess-1", language_code="ta")
        fsm = InterviewFSM(session)
        fsm.transition("call_connected")
        fsm.transition("consent_given")

        # Simulate all fields confirmed
        for f in PS_FIELDS_ORDER:
            fsm.transition("field_extracted", field_name=f, field_value="ok")
            fsm.transition("field_confirmed", field_name=f)

        # Transition to COURSE_SELECTION
        fsm.transition("course_selection_started")
        self.assertEqual(session.state, InterviewState.COURSE_SELECTION)

        # Select course
        fsm.transition("course_selected", selected_course="Tailor - Garment Construction", choice_idx=1)
        self.assertEqual(session.state, InterviewState.COMPLETED)
        self.assertEqual(session.citizen_selected_course, "Tailor - Garment Construction")
        self.assertEqual(session.citizen_selected_choice, 1)


class TestCoordinatorCourseSelectionTurn(unittest.IsolatedAsyncioTestCase):
    async def test_full_course_selection_turn_flow(self):
        coordinator = InterviewCoordinator()
        # Mock TTS to return dummy bytes quickly
        coordinator._synthesize_safe = MagicMock(return_value=asyncio.Future())
        coordinator._synthesize_safe.return_value.set_result(b"dummy_wav_bytes")

        # Create session with all fields confirmed except the last one
        session, fsm, _ = await coordinator._get_or_create_session(
            phone="+919876543210",
            channel="VOICE_CALL",
            language="ta",
            force_fresh=True,
        )
        session.consent_given = True
        session.identity_asked = True
        session.identity_confirmed = True
        session.state = InterviewState.FIELD_COLLECTION

        # Pre-confirm first 6 fields
        for field_name in PS_FIELDS_ORDER[:6]:
            session.fields[field_name].status = "confirmed"
            session.fields[field_name].value = "Known value"
        session.fields["skills_and_interests"].value = "tailoring / garment stitching"

        # Current field is local_economic_context (last field)
        session.current_field_index = 6

        # Citizen answers the 7th field with tailoring interest
        res1 = await coordinator.process_turn(
            phone="+919876543210",
            channel="VOICE_CALL",
            user_speech="தையல் வேலை கடை இருக்கு சந்தை பக்கத்துல",
            language="ta",
            session_key=f"VOICE_CALL_+919876543210",
        )

        # Should transition to COURSE_SELECTION and ask choice
        self.assertEqual(res1.state, InterviewState.COURSE_SELECTION)
        self.assertFalse(res1.is_completed)
        self.assertIn("பயிற்சி", res1.spoken_response)
        self.assertIn("ஆர்வம்", res1.spoken_response)

        # Citizen replies choosing option 1 / tailoring
        res2 = await coordinator.process_turn(
            phone="+919876543210",
            channel="VOICE_CALL",
            user_speech="முதல் தையல் பயிற்சி தான் விருப்பம்",
            language="ta",
            session_key=f"VOICE_CALL_+919876543210",
        )

        # Call completes!
        self.assertEqual(res2.state, InterviewState.COMPLETED)
        self.assertTrue(res2.is_completed)
        self.assertIn("பதிவாகிவிட்டது", res2.spoken_response)
        self.assertNotIn("பயிற்சி பயிற்சி", res2.spoken_response)

        # Verify completed call record
        from services.interview_coordinator import _completed_calls_records
        self.assertTrue(len(_completed_calls_records) > 0)
        rec = _completed_calls_records[0]
        self.assertEqual(rec["status"], "BENEFICIARY_CONFIRMED")
        self.assertTrue(rec["citizen_confirmed"])
        self.assertEqual(rec["confirmed_via"], "VOICE_CALL")
        self.assertIn("Tailor", rec["citizen_selected_course"])
        self.assertTrue(len(rec["transcript"]) > 0)
        last_turn = rec["transcript"][-1]
        self.assertEqual(last_turn["user"], "முதல் தையல் பயிற்சி தான் விருப்பம்")
        self.assertIn("பதிவாகிவிட்டது", last_turn["assistant"])


class TestNotificationFormatting(unittest.TestCase):
    def test_whatsapp_message_with_selected_course(self):
        svc = NotificationService()
        msg = svc.build_bilingual_whatsapp_message(
            phone="+919876543210",
            language_code="ta",
            case_id="KURAL123456",
            confirmed_fields={
                "educational_background": "10th Std",
                "current_livelihood": "Daily wage laborer",
                "skills_and_interests": "tailoring and garment construction",
                "mobility_constraints": "Local only",
                "employment_preference": "Self-employment",
                "local_economic_context": "Weekly village bazaar",
            },
            caller_name="Selvi",
            selected_course="Tailor - Garment Construction",
            recommended_courses=[{
                "qp_code": "APP/Q0301",
                "qp_name": "Tailor - Garment Construction",
                "nsqf_level": 4,
                "duration_hours": 300,
            }],
        )
        # Check that real vernacular values appear
        self.assertIn("உங்களால் தேர்ந்தெடுக்கப்பட்ட பயிற்சி", msg)
        self.assertIn("Tailor - Garment Construction", msg)
        self.assertIn("10-ஆம் வகுப்பு முடித்தது", msg)
        self.assertIn("தையல் மற்றும் ஆடை வடிவமைப்பு", msg)
        self.assertIn("சுயதொழில்", msg)
        # Check that official English administrative records appear
        self.assertIn("Official Administrative Record (English):", msg)
        self.assertIn("Education Level: 10th Std", msg)
        self.assertIn("Skills & Interests: tailoring and garment construction", msg)
        self.assertIn("குரல் அழைப்பு மூலம் வெற்றிகரமாக உறுதி செய்யப்பட்டுள்ளது", msg)
        self.assertIn("QP Code: APP/Q0301 | NSQF Level: 4", msg)
        self.assertIn("Training Duration: 300 Hours", msg)

    def test_sms_message_with_real_data(self):
        svc = NotificationService()
        sms = svc.build_bilingual_sms_message(
            phone="+919876543210",
            language_code="ta",
            case_id="KURAL123456",
            confirmed_fields={
                "educational_background": "10th Std",
                "current_livelihood": "Tailoring Assistant",
                "skills_and_interests": "Sewing and Garments",
            },
            caller_name="Selvi",
            selected_course="Tailor - Garment Construction",
        )
        self.assertIn("PM-AJAY Ref: KURAL123", sms)
        self.assertIn("Beneficiary: Selvi", sms)
        self.assertIn("Edu: 10th Std", sms)
        self.assertIn("Work: Tailoring Assistant", sms)
        self.assertIn("Chosen Course: Tailor - Garment Construction", sms)
        self.assertIn("CONFIRMED via Voice Call", sms)


if __name__ == "__main__":
    unittest.main()
