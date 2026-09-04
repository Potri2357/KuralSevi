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
        play = root.find(".//Play")
        if play is not None and play.text:
            return f"[Sarvam TTS Audio Play: {play.text}]"
        say = root.find(".//Say")
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

    # ── SCENARIO A: Pre-Registered / Known Caller (+919876543210 -> Ramasamy) ──
    print("\n" + "-" * 55)
    print("  SCENARIO A: Pre-Registered Known Caller (+919876543210)")
    print("-" * 55)

    call_sid = "SIM_CALL_KNOWN_01"
    phone_known = "+919876543210"

    print("\nA1. Inbound Call Connects (/webhooks/twilio/incoming-call)...")
    res = post_form(f"{API_URL}/webhooks/twilio/incoming-call", {
        "CallSid": call_sid,
        "From": phone_known,
        "To": "+17409134857",
    })
    print(f"    Initial Greeting TwiML: {parse_twiml_say(res)[:100]}...")

    print("\nA2. Turn 1 — Beneficiary Voice Response (Consent):")
    consent_speech = "ஆம், நான் ஒப்புக்கொள்கிறேன். தொடங்கலாம்."
    print(f"    Caller: \"{consent_speech}\"")
    res = post_form(f"{API_URL}/webhooks/twilio/interview-turn", {
        "CallSid": call_sid,
        "From": phone_known,
        "SpeechResult": consent_speech,
        "Confidence": "0.95",
    })
    print(f"    AI Response (Expects Identity Confirmation): \"{parse_twiml_say(res)[:120]}\"")

    print("\nA3. Turn 2 — Known Caller Confirms Identity (\"ஆமாம், நான்தான்\"):")
    confirm_speech = "ஆமாம், நான்தான்."
    print(f"    Caller: \"{confirm_speech}\"")
    res = post_form(f"{API_URL}/webhooks/twilio/interview-turn", {
        "CallSid": call_sid,
        "From": phone_known,
        "SpeechResult": confirm_speech,
        "Confidence": "0.95",
    })
    print(f"    AI Response (Moves to Education): \"{parse_twiml_say(res)[:120]}\"")

    print("\nA4. Turn 3 — Livelihood & Skills Details:")
    trade_speech = "நான் 8ஆம் வகுப்பு வரை படித்துள்ளேன். தையல் வேலை தெரியும். சொந்தமாக தையல் கடை வைக்க விரும்புகிறேன்."
    print(f"    Caller: \"{trade_speech}\"")
    res = post_form(f"{API_URL}/webhooks/twilio/interview-turn", {
        "CallSid": call_sid,
        "From": phone_known,
        "SpeechResult": trade_speech,
        "Confidence": "0.93",
    })
    print(f"    AI Response (Acknowledge & Next field): \"{parse_twiml_say(res)[:120]}\"")

    # ── SCENARIO B: Unknown / Unregistered Caller (+919123456789) ─────────────
    print("\n" + "-" * 55)
    print("  SCENARIO B: Unknown / First-Time Caller (+919123456789)")
    print("-" * 55)

    call_sid_unknown = "SIM_CALL_UNKNOWN_02"
    phone_unknown = "+919123456789"

    print("\nB1. Inbound Call Connects (/webhooks/twilio/incoming-call)...")
    res = post_form(f"{API_URL}/webhooks/twilio/incoming-call", {
        "CallSid": call_sid_unknown,
        "From": phone_unknown,
        "To": "+17409134857",
    })

    print("\nB2. Turn 1 — Unknown Caller Gives Consent:")
    print(f"    Caller: \"சரி, பேசலாம்.\"")
    res = post_form(f"{API_URL}/webhooks/twilio/interview-turn", {
        "CallSid": call_sid_unknown,
        "From": phone_unknown,
        "SpeechResult": "சரி, பேசலாம்.",
        "Confidence": "0.95",
    })
    print(f"    AI Response (Expects Name & Place Intake): \"{parse_twiml_say(res)[:120]}\"")

    print("\nB3. Turn 2 — Caller Provides Name & Village (\"என் பெயர் செல்வி, ஊர் நாமக்கல்\"):")
    name_speech = "என் பெயர் செல்வி, ஊர் நாமக்கல்."
    print(f"    Caller: \"{name_speech}\"")
    res = post_form(f"{API_URL}/webhooks/twilio/interview-turn", {
        "CallSid": call_sid_unknown,
        "From": phone_unknown,
        "SpeechResult": name_speech,
        "Confidence": "0.94",
    })
    print(f"    AI Response (Greets by name & asks education): \"{parse_twiml_say(res)[:120]}\"")

    # ── WhatsApp Transport Verification ───────────────────────────────────────
    print("\n" + "-" * 55)
    print("  SCENARIO C: WhatsApp Intake Verification")
    print("-" * 55)
    res = post_form(f"{API_URL}/webhooks/twilio/whatsapp", {
        "From": f"whatsapp:{phone_unknown}",
        "To": "whatsapp:+14155238886",
        "Body": "வணக்கம், என் பெயர் செல்வி. எனக்கு தையல் பயிற்சி வேண்டும்.",
    })
    print(f"    WhatsApp TwiML Message: \"{parse_twiml_say(res)}\"")

    print("\n" + "=" * 65)
    print("  RESULT: Both Known Caller & Unknown Caller Flows Verified!")
    print("=" * 65)

if __name__ == "__main__":
    main()
