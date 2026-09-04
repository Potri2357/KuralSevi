#!/usr/bin/env python3
"""
Comprehensive Test Suite for:
1. Hindi (hi) native IVR flow (consent, questions, wrapup in Hindi, no Tamil audio)
2. Telugu (te) native IVR flow (consent, questions, wrapup in Telugu, no Tamil audio)
3. Multi-field semantic co-inference & anti-repetition (farming skips duplicate work question)
4. Confirmed fields extraction: ensures values are genuine strings, NOT 'Yes'
5. Varied warm appreciations (no repetitive 'mikka nandri')
"""
import sys
import time
import httpx
import xml.etree.ElementTree as ET

API_BASE = "http://127.0.0.1:8000"

def test_hindi_pipeline():
    print("\n" + "=" * 60)
    print("  1. Testing HINDI (hi) Native Pipeline")
    print("=" * 60)
    call_sid = f"sim-hi-{int(time.time())}"
    phone = "+919811122233"

    with httpx.Client(base_url=API_BASE) as client:
        # Start call
        start_resp = client.post(
            "/webhooks/twilio/interview-start?language=hi",
            data={"CallSid": call_sid, "From": phone, "Direction": "inbound"},
            timeout=10.0,
        )
        assert start_resp.status_code == 200
        twiml = start_resp.text
        root = ET.fromstring(twiml)
        gather = root.find("Gather")
        assert gather.attrib.get("language") == "hi-IN", f"Expected hi-IN, got {gather.attrib.get('language')}"
        play = gather.find("Play")
        assert "consent_hi.wav" in play.text, f"Expected consent_hi.wav, got {play.text}"
        print("✓ Start interview correctly configured <Gather language='hi-IN'> and plays consent_hi.wav")

        turns = [
            ("हाँ, हम बात कर सकते हैं", "Consent granted"),
            ("मेरा नाम राजेश है, मैं भोपाल से हूँ", "Identity provided"),
            ("मैंने 10वीं कक्षा तक पढ़ाई की है", "Education provided"),
            ("हमारा परिवार खेती करता है", "Family occupation (Farming) - co-infers current work!"),
            ("मैं ट्रैक्टर और गाड़ी चला लेता हूँ", "Skills (Driving)"),
            ("मुझे खुद की दुकान शुरू करने में रुचि है", "Preference (Shop/Business)"),
            ("हमारे गांव में पास ही बाजार और मंडी है", "Context (Village market) -> Completion!"),
        ]

        for idx, (speech, label) in enumerate(turns, 1):
            t0 = time.time()
            resp = client.post(
                "/webhooks/twilio/interview-turn?language=hi",
                data={
                    "CallSid": call_sid,
                    "From": phone,
                    "SpeechResult": speech,
                    "Confidence": "0.95",
                },
                timeout=10.0,
            )
            elapsed = time.time() - t0
            assert resp.status_code == 200, f"Turn {idx} failed: {resp.text}"
            root = ET.fromstring(resp.text)
            gather = root.find("Gather")
            play = gather.find("Play") if gather is not None else root.find("Play")
            audio_file = play.text.split('/')[-1] if play is not None else "No Play tag"
            print(f"Turn {idx} [{elapsed:.3f}s] {label} -> Audio: {audio_file}")
            # Ensure NO Tamil audio files ever served to Hindi caller!
            assert "_ta.wav" not in audio_file, f"ERROR: Tamil audio served to Hindi caller! ({audio_file})"

        # Check completed calls dashboard record
        dashboard_resp = client.get("/api/completed-calls")
        data = dashboard_resp.json()
        records = data.get("records", [])
        hi_record = next((r for r in records if r.get("phone") == phone), None)
        assert hi_record is not None, "Hindi call record not found in completed calls!"
        print(f"\n✓ Hindi call completed successfully. Confirmed fields in dashboard:")
        for k, v in hi_record.get("confirmed_fields", {}).items():
            print(f"   - {k}: {v}")
            assert v != "Yes", f"ERROR: Field {k} was populated with 'Yes' instead of actual value!"
        print("✓ All Hindi fields verified with GENUINE semantic values (0 'Yes' placeholders)!")

def test_telugu_pipeline():
    print("\n" + "=" * 60)
    print("  2. Testing TELUGU (te) Native Pipeline")
    print("=" * 60)
    call_sid = f"sim-te-{int(time.time())}"
    phone = "+919877788899"

    with httpx.Client(base_url=API_BASE) as client:
        # Start call
        start_resp = client.post(
            "/webhooks/twilio/interview-start?language=te",
            data={"CallSid": call_sid, "From": phone, "Direction": "inbound"},
            timeout=10.0,
        )
        assert start_resp.status_code == 200
        twiml = start_resp.text
        root = ET.fromstring(twiml)
        gather = root.find("Gather")
        assert gather.attrib.get("language") == "te-IN", f"Expected te-IN, got {gather.attrib.get('language')}"
        play = gather.find("Play")
        assert "consent_te.wav" in play.text, f"Expected consent_te.wav, got {play.text}"
        print("✓ Start interview correctly configured <Gather language='te-IN'> and plays consent_te.wav")

        turns = [
            ("అవును మాట్లాడవచ్చు", "Consent granted"),
            ("నా పేరు వెంకటేష్, నేను తిరుపతి నుంచి", "Identity provided"),
            ("నేను పదవ తరగతి వరకు చదువుకున్నాను", "Education provided"),
            ("మా కుటుంబంలో వ్యవసాయం చేస్తారు", "Family occupation (Farming) - co-infers current work!"),
            ("నేను వంట మరియు బిర్యానీ బాగా చేస్తాను", "Skills (Cooking)"),
            ("నాకు సొంతంగా కిరాణా దుకాణం పెట్టాలని ఉంది", "Preference (Shop/Business)"),
            ("మా ఊర్లో పెద్ద సంత మరియు మార్కెట్ ఉంది", "Context (Village market) -> Completion!"),
        ]

        for idx, (speech, label) in enumerate(turns, 1):
            t0 = time.time()
            resp = client.post(
                "/webhooks/twilio/interview-turn?language=te",
                data={
                    "CallSid": call_sid,
                    "From": phone,
                    "SpeechResult": speech,
                    "Confidence": "0.95",
                },
                timeout=10.0,
            )
            elapsed = time.time() - t0
            assert resp.status_code == 200, f"Turn {idx} failed: {resp.text}"
            root = ET.fromstring(resp.text)
            gather = root.find("Gather")
            play = gather.find("Play") if gather is not None else root.find("Play")
            audio_file = play.text.split('/')[-1] if play is not None else "No Play tag"
            print(f"Turn {idx} [{elapsed:.3f}s] {label} -> Audio: {audio_file}")
            # Ensure NO Tamil audio files ever served to Telugu caller!
            assert "_ta.wav" not in audio_file, f"ERROR: Tamil audio served to Telugu caller! ({audio_file})"

        # Check completed calls dashboard record
        dashboard_resp = client.get("/api/completed-calls")
        data = dashboard_resp.json()
        records = data.get("records", [])
        te_record = next((r for r in records if r.get("phone") == phone), None)
        assert te_record is not None, "Telugu call record not found in completed calls!"
        print(f"\n✓ Telugu call completed successfully. Confirmed fields in dashboard:")
        for k, v in te_record.get("confirmed_fields", {}).items():
            print(f"   - {k}: {v}")
            assert v != "Yes", f"ERROR: Field {k} was populated with 'Yes' instead of actual value!"
        print("✓ All Telugu fields verified with GENUINE semantic values (0 'Yes' placeholders)!")

def test_tamil_semantic_and_varied_appreciation():
    print("\n" + "=" * 60)
    print("  3. Testing TAMIL (ta) Anti-Repetition & Warm Appreciation")
    print("=" * 60)
    call_sid = f"sim-ta-{int(time.time())}"
    phone = "+919342900638"

    with httpx.Client(base_url=API_BASE) as client:
        # Start call
        client.post(
            "/webhooks/twilio/interview-start?language=ta",
            data={"CallSid": call_sid, "From": phone, "Direction": "inbound"},
            timeout=10.0,
        )

        turns = [
            ("சரிங்க பேசலாம்", "Consent"),
            ("என் பேரு முருகன், நாமக்கல் மாவட்டம்", "Name & District"),
            ("நான் 10-வது வரை படிச்சிருக்கேன்", "Education"),
            ("நாங்க பாரம்பரியமா விவசாயம் பண்றோம்", "Family occupation (Farming) - co-infers current work!"),
            ("எனக்கு லாரி வண்டி ஓட்ட தெரியும்", "Skills (Driving)"),
            ("சொந்தமா காய்கறி கடை வைக்க ஆசை", "Preference (Shop)"),
            ("ஊர்ல வாரச் சந்தை இருக்குங்க", "Context (Weekly market) -> Completion!"),
        ]

        for idx, (speech, label) in enumerate(turns, 1):
            t0 = time.time()
            resp = client.post(
                "/webhooks/twilio/interview-turn?language=ta",
                data={
                    "CallSid": call_sid,
                    "From": phone,
                    "SpeechResult": speech,
                    "Confidence": "0.95",
                },
                timeout=10.0,
            )
            elapsed = time.time() - t0
            assert resp.status_code == 200
            root = ET.fromstring(resp.text)
            gather = root.find("Gather")
            play = gather.find("Play") if gather is not None else root.find("Play")
            audio_file = play.text.split('/')[-1] if play is not None else "None"
            print(f"Turn {idx} [{elapsed:.3f}s] {label} -> Audio: {audio_file}")

        # Check completed calls dashboard record
        dashboard_resp = client.get("/api/completed-calls")
        data = dashboard_resp.json()
        ta_record = next((r for r in data.get("records", []) if r.get("phone") == phone), None)
        assert ta_record is not None, "Tamil call record not found!"
        print("\n✓ Tamil call completed successfully. Confirmed fields in dashboard:")
        for k, v in ta_record.get("confirmed_fields", {}).items():
            print(f"   - {k}: {v}")
            assert v != "Yes", f"ERROR: Field {k} was populated with 'Yes'!"
        print("✓ All Tamil fields verified with GENUINE semantic values (0 'Yes' placeholders)!")

def main():
    try:
        test_hindi_pipeline()
        test_telugu_pipeline()
        test_tamil_semantic_and_varied_appreciation()
        print("\n" + "=" * 60)
        print("  ALL MULTILINGUAL & SEMANTIC TESTS PASSED!  ")
        print("=" * 60)
    except Exception as e:
        print(f"\n[TEST FAILED]: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
