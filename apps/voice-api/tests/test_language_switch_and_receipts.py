"""
Unit tests for:
1. Dynamic language detection & telephony auto-switching from initial English.
2. Dual-language course formatting with native names first.
3. SMS ASCII/GSM-7 segment safety to guarantee delivery.
"""
import unittest
from unittest.mock import MagicMock
import asyncio

from services.course_catalog import (
    CATALOG_COURSES,
    get_localized_course_name,
    get_short_english_name,
    find_course_in_catalog,
    format_course_selection_whatsapp,
    format_recommended_course_item,
)
from services.interview_coordinator import (
    InterviewCoordinator,
    detect_spoken_language,
)
from services.interview_fsm import InterviewState
from services.notification_service import NotificationService


class TestLanguageDetectionAndAutoSwitch(unittest.TestCase):
    def test_detect_spoken_language_scripts(self):
        # Native script utterances
        self.assertEqual(detect_spoken_language("வணக்கம் பேசலாம்", "en"), "ta")
        self.assertEqual(detect_spoken_language("नमस्ते, क्या हाल है?", "en"), "hi")
        self.assertEqual(detect_spoken_language("నమస్కారం మాట్లాడండి", "en"), "te")
        self.assertEqual(detect_spoken_language("നമസ്കാരം പറയാമോ?", "en"), "ml")

        # English utterances
        self.assertEqual(detect_spoken_language("Yes please proceed with verification", "en"), "en")
        self.assertEqual(detect_spoken_language("Sure, let's start the interview", "en"), "en")

        # Romanized / phonetic utterances
        self.assertEqual(detect_spoken_language("vanakkam aama pesalam", "en"), "ta")
        self.assertEqual(detect_spoken_language("namaste haan shuru kijiye", "en"), "hi")
        self.assertEqual(detect_spoken_language("namaskaram avunu", "en"), "te")
        self.assertEqual(detect_spoken_language("namaskaram athe", "en"), "ml")

    def test_detect_spoken_language_fallback(self):
        # Empty speech retains current language
        self.assertEqual(detect_spoken_language("", "en"), "en")
        self.assertEqual(detect_spoken_language("", "ta"), "ta")


class TestCoordinatorAutoLanguageSwitchTurn(unittest.IsolatedAsyncioTestCase):
    async def test_coordinator_starts_english_switches_to_tamil(self):
        coordinator = InterviewCoordinator()
        coordinator._synthesize_safe = MagicMock(return_value=asyncio.Future())
        coordinator._synthesize_safe.return_value.set_result(b"dummy_audio")

        # 1. Turn 0: Initial call greeting starts in English
        turn0 = await coordinator.process_turn(
            phone="+919876500001",
            channel="ivr",
            language="en",
            session_key="test_call_en_ta",
            is_initial=True,
            force_fresh=True,
        )
        self.assertEqual(turn0.language_code, "en")
        self.assertIn("PM-AJAY", turn0.spoken_response)

        # 2. Turn 1: User speaks Tamil consent
        turn1 = await coordinator.process_turn(
            phone="+919876500001",
            channel="ivr",
            user_speech="வணக்கம் பேசலாம்",
            session_key="test_call_en_ta",
        )
        # Session language must automatically switch to 'ta'
        self.assertEqual(turn1.language_code, "ta")
        self.assertTrue("பேரு" in turn1.spoken_response or "சந்தோஷம்" in turn1.spoken_response)


class TestDualLanguageCourseFormatting(unittest.TestCase):
    def test_whatsapp_selected_course_native_first(self):
        hdr, bold_line, details_line = format_course_selection_whatsapp(
            "Tailor - Garment Construction",
            lang="ta"
        )
        self.assertEqual(hdr, "உங்களால் தேர்ந்தெடுக்கப்பட்ட பயிற்சி:")
        self.assertEqual(bold_line, "🎯 *தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி*")
        self.assertIn("Tailor - Garment Construction", details_line)
        self.assertIn("QP Code: APP/Q0301", details_line)

    def test_whatsapp_recommended_course_formatting(self):
        tailor_course = find_course_in_catalog("APP/Q0301")
        self.assertIsNotNone(tailor_course)
        line = format_recommended_course_item(1, tailor_course, lang="ta")
        # Format: 1. *தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி* (Tailor) - NSQF Level 4 (300 hrs)
        self.assertIn("1. *தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி* (Tailor)", line)
        self.assertIn("NSQF Level 4", line)
        self.assertIn("300 hrs", line)

    def test_sms_gsm7_safety_and_compactness(self):
        svc = NotificationService()
        sms = svc.build_bilingual_sms_message(
            phone="+918618437517",
            language_code="ta",
            case_id="F5EBA9A11234",
            confirmed_fields={
                "educational_background": "Class 10 completed",
                "current_livelihood": "Tailoring helper",
            },
            caller_name="செந்தில் குமார்",  # Non-ASCII Tamil name
            selected_course="தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி",  # Non-ASCII course name
        )

        # Must NOT contain non-ASCII characters that trigger UCS-2 on SMS
        non_ascii = [c for c in sms if ord(c) >= 128]
        self.assertEqual(len(non_ascii), 0, f"Found non-ASCII chars in SMS: {non_ascii}")

        # Length must be compact (under 200 chars)
        self.assertLessEqual(len(sms), 200)
        self.assertIn("PM-AJAY Ref: F5EBA9A1", sms)
        self.assertIn("Status: CONFIRMED", sms)


if __name__ == "__main__":
    unittest.main()
