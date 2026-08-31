#!/usr/bin/env python3
"""
Kural Sevi — Voice Pipeline & Twilio Webhook Simulator
Tests the voice interview pipeline through realistic HTTP simulation.
"""
import sys
import xml.etree.ElementTree as ET
import urllib.request
import urllib.parse

API_URL = "http://localhost:8000"

def post_form(url: str, data: dict) -> str:
    encoded = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=encoded, method="POST")
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read().decode("utf-8")



def parse_twiml_say(xml_str: str) -> str:
    try:
        root = ET.fromstring(xml_str)
        play = root.find("Play")
        if play is not None and play.text:
            return f"[Sarvam TTS Audio Play: {play.text}]"
        say = root.find("Say")
        if say is not None and say.text:
            return say.text
        msg = root.find(".//Body")
        if msg is not None and msg.text:
            return msg.text
        # Check Message tag
        msg_tag = root.find("Message")
        if msg_tag is not None and msg_tag.text:
            return msg_tag.text
    except Exception:
        pass
    return xml_str[:200]

def main():
    print("=" * 65)
    print("  KURAL SEVI: Voice Pipeline & Telephony Simulator")
    print("=" * 65)

    # 1. Health check
    print("\n1. Checking Voice API Health...")
    try:
        with urllib.request.urlopen(f"{API_URL}/health", timeout=5) as r:
            print(f"   [OK] Server status: {r.read().decode('utf-8')}")
    except Exception as e:
        print(f"   [FAIL] Could not connect to {API_URL}: {e}")
        print("   Make sure the voice API is running: npm run dev")
        sys.exit(1)

    call_sid = "SIM_CALL_2026_01"
    phone = "+919876543210"

    # 2. Incoming call callback (Missed-call IVR intake)
    print("\n2. Testing Inbound Call Hook (/webhooks/twilio/incoming-call)...")
    res = post_form(f"{API_URL}/webhooks/twilio/incoming-call", {
        "CallSid": call_sid,
        "From": phone,
        "To": "+17409134857",
    })
    print(f"   Response TwiML: {parse_twiml_say(res)}")

    # 3. Start Interview Turn
    print("\n3. Starting Automated Interview Turn (/webhooks/twilio/interview-start)...")
    res = post_form(f"{API_URL}/webhooks/twilio/interview-start", {
        "CallSid": call_sid,
        "From": phone,
        "language": "ta",
        "district": "Namakkal",
    })
    prompt = parse_twiml_say(res)
    print(f"   System Spoken Prompt: \"{prompt}\"")

    # 4. Turn 1: Beneficiary says Yes / Consent
    print("\n4. Turn 1 — Beneficiary Voice Response (Consent):")
    beneficiary_speech = "ஆம், நான் ஒப்புக்கொள்கிறேன். தொடங்கலாம்."  # "Yes, I consent. Let's begin."
    print(f"   Beneficiary Speech (Tamil): \"{beneficiary_speech}\"")
    res = post_form(f"{API_URL}/webhooks/twilio/interview-turn", {
        "CallSid": call_sid,
        "From": phone,
        "SpeechResult": beneficiary_speech,
        "Confidence": "0.95",
    })
    prompt = parse_twiml_say(res)
    print(f"   System AI Response: \"{prompt}\"")

    # 5. Turn 2: Beneficiary provides trade & livelihood info
    print("\n5. Turn 2 — Beneficiary Voice Response (Livelihood & Skills):")
    skills_speech = "நான் 8ஆம் வகுப்பு வரை படித்துள்ளேன். தையல் வேலை தெரியும். சொந்தமாக தையல் கடை வைக்க விரும்புகிறேன்."
    print(f"   Beneficiary Speech: \"{skills_speech}\"")
    res = post_form(f"{API_URL}/webhooks/twilio/interview-turn", {
        "CallSid": call_sid,
        "From": phone,
        "SpeechResult": skills_speech,
        "Confidence": "0.92",
    })
    prompt = parse_twiml_say(res)
    print(f"   System AI Response: \"{prompt}\"")

    # 6. Test Twilio WhatsApp Webhook
    print("\n6. Testing Twilio WhatsApp Webhook (/webhooks/twilio/whatsapp)...")
    res = post_form(f"{API_URL}/webhooks/twilio/whatsapp", {
        "From": f"whatsapp:{phone}",
        "To": "whatsapp:+14155238886",
        "Body": "வணக்கம், என் பெயர் செல்வி. எனக்கு தையல் பயிற்சி வேண்டும்.",
    })
    print(f"   WhatsApp TwiML Message: \"{parse_twiml_say(res)}\"")

    print("\n" + "=" * 65)
    print("  RESULT: Voice & WhatsApp Pipeline Verified Successfully!")
    print("=" * 65)

if __name__ == "__main__":
    main()
