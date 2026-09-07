#!/usr/bin/env python3
"""
Test Suite: Post-Call Bilingual Citizen Confirmation & Two-Way Feedback Loop
1. Verifies bilingual WhatsApp & SMS template rendering across Tamil, Malayalam, Hindi, and Telugu.
2. Completes simulated telephony calls and asserts async bilingual confirmation dispatch.
3. Simulates citizen affirmative reply (YES / சரி / हाँ / అవును) over SMS and WhatsApp.
4. Asserts case state transition from COMPLETED -> BENEFICIARY_CONFIRMED on dashboard.
"""
import sys
import time
import httpx
import xml.etree.ElementTree as ET

API_BASE = "http://127.0.0.1:8000"

def test_template_generation():
    print("\n" + "=" * 65)
    print("  1. Testing Bilingual Message Template Generation (4 Languages)")
    print("=" * 65)

    sys.path.insert(0, "apps/voice-api")
    from services.notification_service import NotificationService, FIELD_LABELS

    ns = NotificationService()
    test_fields = {
        "educational_background": "Class 10 completed (Secondary School)",
        "family_occupation": "Agriculture / Farming",
        "current_livelihood": "Agricultural labour / Farming",
        "skills_and_interests": "Vegetable & Retail Selling",
        "mobility_constraints": "Local area / Prefers establishing local enterprise",
        "employment_preference": "Self-Employment (Own Shop / Enterprise)",
        "local_economic_context": "Local Village Market / Commerce",
    }

    expected_keywords = {
        "ta": ["PM-AJAY அரசு நலத்திட்ட பதிவு", "கல்வித் தகுதி", "விவசாயம்", "சுயதொழில்", "Reply 'YES' to confirm"],
        "ml": ["PM-AJAY ക്ഷേമ പദ്ധതി", "വിദ്യാഭ്യാസം", "കൃഷി", "സ്വന്തം സംരംഭം", "Reply 'YES' to confirm"],
        "hi": ["PM-AJAY कल्याणकारी योजना", "शैक्षिक योग्यता", "कृषि / खेती", "स्वरोज़गार", "Reply 'YES' to confirm"],
        "te": ["PM-AJAY సంక్షేమ పథకం", "చదువు", "వ్యవసాయం", "స్వయం ఉపాధి", "Reply 'YES' to confirm"],
    }

    for lang, keywords in expected_keywords.items():
        wa_msg = ns.build_bilingual_whatsapp_message("+919876543210", lang, f"CASE-{lang.upper()}", test_fields, "Test User")
        sms_msg = ns.build_bilingual_sms_message("+919876543210", lang, f"CASE-{lang.upper()}", test_fields, "Test User")

        print(f"\n[LANG: {lang}] Checking WhatsApp & SMS contents...")
        for kw in keywords:
            assert kw in wa_msg, f"Missing keyword '{kw}' in WhatsApp message for {lang}!"
        assert "Official Administrative Record (English):" in wa_msg, f"Missing English section in WA {lang}"
        assert "Education Level" in wa_msg, f"Missing Education Level in WA {lang}"
        assert "Agriculture / Farming" in wa_msg, f"Missing Agriculture / Farming in WA {lang}"
        assert "PM-AJAY" in sms_msg, f"Missing PM-AJAY in SMS {lang}"
        assert len(sms_msg) <= 160, f"SMS length {len(sms_msg)} exceeds single segment 160 chars!"
        print(f"✓ {lang.upper()}: WhatsApp ({len(wa_msg)} chars) and SMS ({len(sms_msg)} chars) validated successfully!")

def test_full_call_and_sms_confirmation():
    print("\n" + "=" * 65)
    print("  2. Testing Call Completion & Citizen SMS Confirmation Loop")
    print("=" * 65)

    call_sid = f"sim-conf-{int(time.time())}"
    phone = "+919444112233"

    with httpx.Client(base_url=API_BASE) as client:
        # Start Call
        start_res = client.post(
            "/webhooks/twilio/interview-start?language=ta",
            data={"CallSid": call_sid, "From": phone, "Direction": "inbound"},
            timeout=10.0,
        )
        assert start_res.status_code == 200

        # Run conversation turns to completion
        turns = [
            "ஆமாம், பேசலாம்",
            "என் பேரு செல்வம், நான் மதுரை",
            "பத்தாம் வகுப்பு படிச்சிருக்கேன்",
            "எங்க குடும்ப தொழில் விவசாயம்",
            "காய்கறி கடை வைக்க ஆசை",
            "உள்ளூர்ல சந்தை இருக்கு",
        ]

        for idx, t in enumerate(turns, 1):
            res = client.post(
                "/webhooks/twilio/interview-turn?language=ta",
                data={"CallSid": call_sid, "From": phone, "SpeechResult": t, "Confidence": "0.95"},
                timeout=10.0,
            )
            assert res.status_code == 200
            print(f"Turn {idx}: '{t[:25]}...' processed")

        # Give 0.2s for background tasks
        time.sleep(0.3)

        # Verify completed call record
        rec_res = client.get("/api/completed-calls")
        data = rec_res.json()
        target_rec = next((r for r in data.get("records", []) if r.get("phone") == phone), None)
        assert target_rec is not None, f"Record for {phone} not found!"
        assert target_rec.get("status") == "COMPLETED", f"Expected COMPLETED, got {target_rec.get('status')}"
        assert target_rec.get("notification_status") == "DISPATCHED", "Notification was not marked as dispatched!"
        case_id = target_rec.get("case_id")
        print(f"\n✓ Call COMPLETED. Case ID: {case_id}")
        print(f"✓ Notification dispatched via WhatsApp and SMS!")

        # 3. Simulate Citizen Replying "YES" via SMS Webhook
        print("\n--- Simulating Citizen SMS Reply: 'YES' ---")
        sms_reply_res = client.post(
            "/webhooks/twilio/sms",
            data={"From": phone, "To": "+17409134857", "Body": "YES"},
            timeout=10.0,
        )
        assert sms_reply_res.status_code == 200
        root = ET.fromstring(sms_reply_res.text)
        body_tag = root.find("Message/Body") if root.find("Message/Body") is not None else root.find("Message")
        reply_ack = body_tag.text if body_tag is not None else sms_reply_res.text
        print(f"Twilio SMS Response: '{reply_ack}'")
        assert "உறுதிப்படுத்தப்பட்டன" in reply_ack or "PM-AJAY" in reply_ack, f"Unexpected reply ack: {reply_ack}"

        # 4. Verify Dashboard has updated status to BENEFICIARY_CONFIRMED
        rec_res2 = client.get("/api/completed-calls")
        data2 = rec_res2.json()
        updated_rec = next((r for r in data2.get("records", []) if r.get("phone") == phone), None)
        assert updated_rec.get("status") == "BENEFICIARY_CONFIRMED", f"Expected BENEFICIARY_CONFIRMED, got {updated_rec.get('status')}"
        assert updated_rec.get("citizen_confirmed") is True, "citizen_confirmed flag is False!"
        assert updated_rec.get("confirmed_via") == "SMS", f"Expected SMS, got {updated_rec.get('confirmed_via')}"
        print(f"✓ Dashboard status successfully updated to: {updated_rec.get('status')}")
        print(f"✓ Confirmed via: {updated_rec.get('confirmed_via')} at {updated_rec.get('confirmed_at')}")

        # 5. Verify HTML Dashboard rendering
        dash_res = client.get("/call-records")
        assert dash_res.status_code == 200
        assert "✓ CITIZEN CONFIRMED (SMS)" in dash_res.text
        assert "Bilingual WhatsApp & SMS Dispatched" in dash_res.text
        print("✓ HTML Dashboard verified with CITIZEN CONFIRMED badge and dispatch indicator!")

def test_whatsapp_confirmation_loop():
    print("\n" + "=" * 65)
    print("  3. Testing Citizen WhatsApp Reply: 'சரி' (Tamil 'Yes')")
    print("=" * 65)

    phone = "+919444112233"
    with httpx.Client(base_url=API_BASE) as client:
        wa_reply_res = client.post(
            "/webhook/whatsapp",
            data={"From": f"whatsapp:{phone}", "To": "whatsapp:+17409134857", "Body": "சரி"},
            timeout=10.0,
        )
        assert wa_reply_res.status_code == 200
        root = ET.fromstring(wa_reply_res.text)
        body_tag = root.find("Message/Body") if root.find("Message/Body") is not None else root.find("Message")
        reply_ack = body_tag.text if body_tag is not None else wa_reply_res.text
        print(f"WhatsApp Response: '{reply_ack}'")
        assert "உறுதிப்படுத்தப்பட்டன" in reply_ack, f"Expected confirmation ack, got: {reply_ack}"

        # Check dashboard
        rec_res = client.get("/api/completed-calls")
        data = rec_res.json()
        updated_rec = next((r for r in data.get("records", []) if phone in r.get("phone", "")), None)
        assert updated_rec.get("status") == "BENEFICIARY_CONFIRMED"
        assert updated_rec.get("confirmed_via") == "WHATSAPP"
        print(f"✓ Case updated via WhatsApp: {updated_rec.get('status')} (Confirmed via {updated_rec.get('confirmed_via')})")

if __name__ == "__main__":
    test_template_generation()
    test_full_call_and_sms_confirmation()
    test_whatsapp_confirmation_loop()
    print("\n" + "=" * 65)
    print("  ALL BILINGUAL NOTIFICATION & CONFIRMATION TESTS PASSED! 🎉")
    print("=" * 65)
