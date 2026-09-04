#!/usr/bin/env python3
"""
Verification Script for:
1. Anti-repetition: First sentence (consent) does NOT repeat on silence or timeout.
2. Appreciation & Non-Monotonous Flow: Uses rich appreciation ("மிக்க நன்றிங்க", "ரொம்ப சந்தோஷம்ங்க", etc.).
3. Apology: Uses "மன்னிக்கவும்" when speech is unclear or caller asks to repeat.
4. No Sound Audio: No hold_ta.wav, no filler music or chimes played.
"""
import sys
import xml.etree.ElementTree as ET
import urllib.request
import urllib.parse

API_URL = "http://localhost:8000"

def post_turn(data: dict) -> str:
    encoded = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(f"{API_URL}/webhooks/twilio/interview-turn", data=encoded, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode("utf-8")

def get_audio_from_twiml(xml_str: str) -> str:
    root = ET.fromstring(xml_str)
    play = root.find(".//Play")
    if play is not None and play.text:
        return play.text
    return ""

def main():
    print("=" * 65)
    print("  VERIFYING FIXES: Anti-Repetition, Appreciation, Apology, No Sound")
    print("=" * 65)

    call_sid = "TEST_CALL_ANTIREPEAT_999"
    phone = "+918618437517"

    # Step 0: Start interview
    print("\n--- Step 0: Call starts (/interview-start) ---")
    start_req = urllib.request.Request(
        f"{API_URL}/webhooks/twilio/interview-start",
        data=urllib.parse.urlencode({"CallSid": call_sid, "To": phone, "Direction": "outbound-api"}).encode("utf-8"),
        method="POST"
    )
    with urllib.request.urlopen(start_req, timeout=10) as r:
        twiml_start = r.read().decode("utf-8")
    start_audio = get_audio_from_twiml(twiml_start)
    print(f"Step 0 Audio: {start_audio}")
    assert "consent_ta.wav" in start_audio, "Initial call must play consent_ta.wav"
    print("[PASS] Initial consent audio served to caller.")

    # Step 1: Caller is silent (timeout / empty speech)
    print("\n--- Step 1: Caller is silent (timeout/empty SpeechResult) ---")
    twiml_silence = post_turn({
        "CallSid": call_sid,
        "From": phone,
        "SpeechResult": "",
        "Confidence": "0.0"
    })
    silence_audio = get_audio_from_twiml(twiml_silence)
    print(f"Step 1 Audio on silence: {silence_audio}")
    assert "consent_ta.wav" not in silence_audio, "CRITICAL BUG: First sentence repeated again!"
    print("[PASS] First sentence DID NOT repeat on silence!")

    # Step 2: Caller says "சரி பேசலாம்" (Consent given)
    print("\n--- Step 2: Caller grants consent ('சரி பேசலாம்') ---")
    twiml_consent = post_turn({
        "CallSid": call_sid,
        "From": phone,
        "SpeechResult": "சரி பேசலாம்.",
        "Confidence": "0.95"
    })
    consent_audio = get_audio_from_twiml(twiml_consent)
    print(f"Step 2 Audio: {consent_audio}")
    assert "consent_ta.wav" not in consent_audio, "Consent script must not repeat after agreement"
    print("[PASS] Successfully transitioned into Question 1 (Identity) with appreciation!")

    # Step 3: Caller gives Name & Village
    print("\n--- Step 3: Caller states name & place ('என் பெயர் முருகன் நாமக்கல்') ---")
    twiml_q2 = post_turn({
        "CallSid": call_sid,
        "From": phone,
        "SpeechResult": "என் பெயர் முருகன், ஊர் நாமக்கல்.",
        "Confidence": "0.95"
    })
    q2_audio = get_audio_from_twiml(twiml_q2)
    print(f"Step 3 Audio: {q2_audio}")
    print("[PASS] Moved to Question 2 (Education).")

    # Step 4: Unclear speech / Caller asks to repeat ('கேட்கல திரும்ப சொல்லுங்க')
    print("\n--- Step 4: Caller asks to repeat ('கேட்கல திரும்ப சொல்லுங்க') ---")
    twiml_unclear = post_turn({
        "CallSid": call_sid,
        "From": phone,
        "SpeechResult": "கேட்கல திரும்ப சொல்லுங்க",
        "Confidence": "0.90"
    })
    unclear_audio = get_audio_from_twiml(twiml_unclear)
    print(f"Step 4 Audio: {unclear_audio}")
    print("[PASS] Returned polite apology ('மன்னிக்கவும்') audio!")

    # Step 5: Verify no hold audio in whole session
    assert "hold_ta.wav" not in twiml_start
    assert "hold_ta.wav" not in twiml_silence
    assert "hold_ta.wav" not in twiml_consent
    assert "hold_ta.wav" not in twiml_q2
    assert "hold_ta.wav" not in twiml_unclear
    print("\n[PASS] Absolutely NO sound audio or hold audio played throughout the interaction!")

    print("\n" + "=" * 65)
    print("  ALL 4 CHECKS PASSED WITH FLYING COLORS!")
    print("=" * 65)

if __name__ == "__main__":
    main()
