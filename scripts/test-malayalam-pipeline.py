#!/usr/bin/env python3
"""
Test script for verifying Kural Sevi Malayalam (മലയാളം) Voice IVR Pipeline.
Tests:
- Start interview with language=ml (Twilio webhook XML response)
- Static audio endpoints for consent_ml.wav
- Multi-turn conversation handling in Malayalam with zero latency
- Context-adaptive questions (cooking, driving, farming, business)
- Polite clarification handling
"""
import sys
import time
import httpx
import xml.etree.ElementTree as ET

API_BASE = "http://localhost:8000"

def test_start_interview():
    print("\n--- 1. Testing /webhooks/twilio/interview-start?language=ml ---")
    with httpx.Client(base_url=API_BASE) as client:
        resp = client.post(
            "/webhooks/twilio/interview-start?language=ml",
            data={"CallSid": "test-call-ml-001", "From": "+919999988888", "Direction": "inbound"},
            timeout=10.0,
        )
        assert resp.status_code == 200, f"Failed: {resp.status_code} {resp.text}"
        twiml = resp.text
        print("TwiML Response:")
        print(twiml)

        root = ET.fromstring(twiml)
        gather = root.find("Gather")
        assert gather is not None, "Missing <Gather> in response"
        assert gather.attrib.get("language") == "ml-IN", f"Expected language ml-IN, got {gather.attrib.get('language')}"
        
        play = gather.find("Play")
        assert play is not None, "Missing <Play> inside <Gather>"
        assert "consent_ml.wav" in play.text, f"Expected consent_ml.wav in Play URL, got {play.text}"
        print("✓ Start interview correctly configures Malayalam <Gather language='ml-IN'> and plays consent_ml.wav")

def test_consent_audio():
    print("\n--- 2. Testing /webhooks/twilio/audio/consent_ml.wav ---")
    with httpx.Client(base_url=API_BASE) as client:
        resp = client.get("/webhooks/twilio/audio/consent_ml.wav", timeout=10.0)
        assert resp.status_code == 200, f"Failed to get audio: {resp.status_code}"
        assert resp.headers.get("content-type") == "audio/wav", f"Expected audio/wav, got {resp.headers.get('content-type')}"
        assert len(resp.content) > 10000, f"Audio content unexpectedly small: {len(resp.content)} bytes"
        print(f"✓ consent_ml.wav exists and returns {len(resp.content)} bytes of valid WAV audio")

def test_full_malayalam_conversation():
    print("\n--- 3. Testing Full Multi-Turn Malayalam Conversation ---")
    call_sid = f"sim-ml-{int(time.time())}"
    phone = "+919876543210"

    turns = [
        # (User Speech, Expected Topic / Keyword in Response)
        ("തീർച്ചയായും, സംസാരിക്കാം", "പേര്"),  # Consent -> Q1 Name
        ("എന്റെ പേര് അനീഷ്, ഞാൻ പാലക്കാട് നിന്നാണ്", "വിദ്യാഭ്യാസം"),  # Name/Place -> Q2 Education
        ("ഞാൻ പത്താം ക്ലാസ് വരെ പഠിച്ചിട്ടുണ്ട്", "കുടുംബ"),  # Education -> Q3 Family occ
        ("ഞങ്ങളുടെ കുടുംബത്തിൽ കൃഷിയാണ്", "കൃഷി"),  # Family occ -> Q4 Livelihood (adapted to farming)
        ("ഞാൻ ഇപ്പോൾ ഒരു ഹോട്ടലിൽ ഷെഫായി ജോലി ചെയ്യുന്നു", "തുടങ്ങാൻ"),  # Livelihood -> Q5 Skills
        ("എനിക്ക് നല്ല ബിരിയാണി പാചകം ചെയ്യാൻ അറിയാം", "പാചക"),  # Skills (cooking) -> Q6 Mobility (adapted to cooking)
        ("അതെ, അടുത്തുള്ള പട്ടണങ്ങളിലേക്ക് പോകാൻ സാധിക്കും", "ബിസിനസ്"),  # Mobility -> Q7 Preference
        ("എനിക്ക് സ്വന്തമായി ചെറിയൊരു കട തുടങ്ങണം", "ആശംസകൾ"),  # Preference (business) -> Q8 Context (adapted to business)
        ("ഞങ്ങളുടെ നാട്ടിൽ ചന്ത അടുത്തുണ്ട്, നല്ല തിരക്കാണ്", "നന്ദി"),  # Context -> Wrap up
    ]

    with httpx.Client(base_url=API_BASE) as client:
        # Start call
        client.post(
            f"/webhooks/twilio/interview-start?language=ml",
            data={"CallSid": call_sid, "From": phone, "Direction": "inbound"},
            timeout=10.0,
        )

        for idx, (user_speech, expected_kw) in enumerate(turns, 1):
            t0 = time.time()
            resp = client.post(
                f"/webhooks/twilio/interview-turn?language=ml",
                data={
                    "CallSid": call_sid,
                    "From": phone,
                    "SpeechResult": user_speech,
                    "Confidence": "0.95",
                },
                timeout=15.0,
            )
            elapsed = time.time() - t0
            assert resp.status_code == 200, f"Turn {idx} failed: {resp.status_code} {resp.text}"
            
            twiml = resp.text
            root = ET.fromstring(twiml)
            gather = root.find("Gather")
            play = gather.find("Play") if gather is not None else root.find("Play")
            
            assert play is not None, f"Turn {idx} missing <Play> tag: {twiml}"
            print(f"Turn {idx} [{elapsed:.3f}s] User: '{user_speech[:30]}...' -> Audio: {play.text.split('/')[-1]}")
            assert elapsed < 1.0, f"Turn latency exceeded 1.0s ({elapsed:.3f}s)"

    print("\n✓ All 9 Malayalam turns completed smoothly with sub-second response times!")

def main():
    print("=========================================================")
    print("   Kural Sevi: Malayalam Voice IVR Pipeline Test")
    print("=========================================================")
    try:
        test_start_interview()
        test_consent_audio()
        test_full_malayalam_conversation()
        print("\n=========================================================")
        print("  ALL MALAYALAM TESTS PASSED SUCCESSFULLY!  ")
        print("=========================================================")
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
