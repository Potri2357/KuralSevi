import unittest
import asyncio
from services.course_catalog import (
    CATALOG_COURSES,
    compute_top_recommended_courses,
    get_localized_course_name,
)
from services.interview_coordinator import (
    InterviewCoordinator,
    _infer_semantic_fields_fast,
    _generate_conversational_acknowledgement,
    _get_question_for_field,
)
from services.interview_fsm import InterviewSession, InterviewState, FieldData


class TestNSQFCourseCatalog(unittest.TestCase):
    def test_catalog_size_and_codes(self):
        self.assertEqual(len(CATALOG_COURSES), 22)
        codes = [c["qp_code"] for c in CATALOG_COURSES]
        self.assertEqual(len(codes), len(set(codes)), "Duplicate QP codes found!")
        self.assertIn("AMH/Q0301", codes)  # Sewing Machine Operator
        self.assertIn("FIC/Q0103", codes)  # Pickle Making & Food Processing

    def test_driver_recommendation(self):
        profile = {
            "current_livelihood": "Auto driver / commercial driving",
            "skills_and_interests": "Driving cars and autos",
        }
        recs = compute_top_recommended_courses(profile)
        top_codes = [c["qp_code"] for c in recs[:2]]
        self.assertIn("ASC/Q9705", top_codes, "Commercial Vehicle Driver (ASC/Q9705) should be top recommendation")
        self.assertNotIn("LSS/Q2301", top_codes, "Footwear should not be recommended for driver")

    def test_tailoring_recommendation(self):
        profile = {
            "skills_and_interests": "தையல் வேலை தையல் மிஷின்",
            "employment_preference": "சுயதொழில் சொந்த கடை",
        }
        recs = compute_top_recommended_courses(profile)
        top_codes = [c["qp_code"] for c in recs[:2]]
        self.assertTrue(
            "APP/Q0301" in top_codes or "AMH/Q0301" in top_codes,
            "Tailor or Sewing Machine Operator should be recommended"
        )
        self.assertNotIn("LSS/Q2301", top_codes)

    def test_electrician_recommendation(self):
        profile = {
            "skills_and_interests": "Electrical wiring and current work",
        }
        recs = compute_top_recommended_courses(profile)
        top_codes = [c["qp_code"] for c in recs[:2]]
        self.assertTrue(
            "ELE/Q3101" in top_codes or "SGJ/Q0101" in top_codes,
            "Domestic Electrician or Solar should be recommended"
        )

    def test_catering_recommendation(self):
        profile = {
            "skills_and_interests": "சமையல் மற்றும் கேட்டரிங் பிரியாணி மாஸ்டர்",
        }
        recs = compute_top_recommended_courses(profile)
        top_codes = [c["qp_code"] for c in recs[:2]]
        self.assertTrue(
            "FIC/Q0201" in top_codes or "FIC/Q0103" in top_codes,
            "Food Catering (FIC/Q0201) or Pickle/Food Processing should be recommended"
        )

    def test_zero_score_fallback_no_footwear_default(self):
        # Blank profile with self-employment
        profile_self = {
            "employment_preference": "Self-Employment (Own Business / Shop)",
        }
        recs_self = compute_top_recommended_courses(profile_self)
        top_self = [c["qp_code"] for c in recs_self[:2]]
        self.assertNotIn("LSS/Q2301", top_self, "Footwear should not be default for self-employment")
        self.assertTrue("MEP/Q0101" in top_self or "APP/Q0301" in top_self or "RAS/Q0104" in top_self)

        # Blank profile with wage employment
        profile_wage = {
            "employment_preference": "Wage Employment (Monthly Salary)",
        }
        recs_wage = compute_top_recommended_courses(profile_wage)
        top_wage = [c["qp_code"] for c in recs_wage[:2]]
        self.assertNotIn("LSS/Q2301", top_wage, "Footwear should not be default for wage employment")
        self.assertTrue("ELE/Q3101" in top_wage or "RAS/Q0104" in top_wage or "ASC/Q9705" in top_wage)


class TestConversationalDialogue(unittest.TestCase):
    def test_conversational_acknowledgements(self):
        # Driving
        ack_en = _generate_conversational_acknowledgement("I have been working as an auto driver", "en")
        self.assertIsNotNone(ack_en)
        self.assertIn("Driving", ack_en)

        ack_ta = _generate_conversational_acknowledgement("நான் ஆட்டோ ஓட்டுகிறேன்", "ta")
        self.assertIsNotNone(ack_ta)
        self.assertIn("வாகனம்", ack_ta)

        # Tailoring
        ack_tailor = _generate_conversational_acknowledgement("I do tailoring and stitching at home", "en")
        self.assertIsNotNone(ack_tailor)
        self.assertIn("Tailoring", ack_tailor)

        # Electrical
        ack_elec = _generate_conversational_acknowledgement("நான் எலக்ட்ரீசியன் கரண்ட் வேலை செய்றேன்", "ta")
        self.assertIsNotNone(ack_elec)
        self.assertIn("மின்சார", ack_elec)

    def test_get_question_for_field_open_and_two_sentences(self):
        session = InterviewSession(session_id="test_sess", language_code="en")
        session.caller_name = "Ramesh"
        
        # English field question should combine warm acknowledgement + open question
        q_file, q_text = _get_question_for_field("skills_and_interests", "I have been driving auto for 5 years", session)
        self.assertIn("Driving", q_text)
        self.assertIn("skills", q_text.lower())
        # Verify it has at least 2 sentences
        sentences = [s.strip() for s in q_text.split("!") if s.strip()]
        self.assertGreaterEqual(len(sentences), 2)

    def test_fast_coinference_skips_redundant_questions(self):
        inferred = _infer_semantic_fields_fast("I run an auto and want to start my own transport business in my village", "en")
        self.assertEqual(inferred.get("employment_preference"), "Self-Employment (Own Business / Shop)")
        self.assertEqual(inferred.get("mobility_constraints"), "Local Area Only (Within Village / Block)")
        self.assertEqual(inferred.get("current_livelihood"), "Commercial Driver / Vehicle Operator")


class TestEnglishCoordinatorFlow(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.coord = InterviewCoordinator()

    async def test_full_english_flow(self):
        phone = "+919998887771"
        ch = "TELEPHONY"
        
        # Turn 0: Greeting
        t0 = await self.coord.process_turn(phone, ch, is_initial=True, language="en", force_fresh=True)
        self.assertFalse(t0.is_completed)
        self.assertIn("PM-AJAY", t0.spoken_response)

        # Turn 1: Consent granted
        t1 = await self.coord.process_turn(phone, ch, user_speech="Yes, I am happy to speak", language="en")
        self.assertIn("tell me your name", t1.spoken_response)

        # Turn 2: Identity -> Q2 education
        t2 = await self.coord.process_turn(phone, ch, user_speech="My name is Rajesh from Madurai", language="en")
        self.assertIn("schooling or education", t2.spoken_response)
        self.assertEqual(t2.current_field, "educational_background")

        # Turn 3: Education response -> Family occupation
        t3 = await self.coord.process_turn(phone, ch, user_speech="I studied up to 10th standard", language="en")
        self.assertIn("family", t3.spoken_response.lower())
        self.assertEqual(t3.current_field, "family_occupation")

        # Turn 4: Family occupation + multi-field proactive statement:
        t4 = await self.coord.process_turn(
            phone, ch,
            user_speech="My family did farming, but I drive a taxi and I want to start my own transport business in my village",
            language="en"
        )
        session = self.coord._active_sessions[f"{ch}_{phone}"]["session"]
        # Proactively stated fields: employment_preference and mobility should be confirmed
        self.assertEqual(session.fields["employment_preference"].status, "confirmed")
        self.assertEqual(session.fields["mobility_constraints"].status, "confirmed")

        # Turn 5: Clarification trigger in English
        t_clarif = await self.coord.process_turn(phone, ch, user_speech="Could you repeat that?", language="en")
        self.assertIn("Sorry, I could not hear that clearly", t_clarif.spoken_response)


if __name__ == "__main__":
    unittest.main()
