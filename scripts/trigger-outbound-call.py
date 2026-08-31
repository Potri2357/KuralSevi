#!/usr/bin/env python3
"""
Kural Sevi — Live Outbound Telephony Call Trigger
Initiates an outbound phone call from Twilio (+1 740-913-4857) to a verified phone number
and connects the caller directly into the live Tamil Voice Interview.
Uses pure Python standard library (no external dependencies required).
"""
import os
import sys
import time
import json
import base64
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

# Auto-load .env from project root (walk up to find it)
def _load_dotenv():
    search = Path(__file__).resolve().parent
    for _ in range(5):
        env_path = search / ".env"
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, _, v = line.partition("=")
                        os.environ.setdefault(k.strip(), v.strip())
            return
        search = search.parent

_load_dotenv()

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/trigger-outbound-call.py <PHONE_NUMBER_WITH_COUNTRY_CODE>")
        print("Example: python3 scripts/trigger-outbound-call.py +919342900638")
        sys.exit(1)

    target_phone = sys.argv[1].strip()
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    from_number = os.environ.get("TWILIO_PHONE_NUMBER", "")
    webhook_url = os.environ.get("VOICE_API_URL", "https://charita-techiest-histogenetically.ngrok-free.dev") + "/webhooks/twilio/interview-start"

    if not account_sid or not auth_token or not from_number:
        print("ERROR: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env")
        sys.exit(1)

    print("=" * 65)
    print("  KURAL SEVI: Live Telephony Call Initiator")
    print("=" * 65)
    print(f"Calling:    {target_phone}")
    print(f"Caller ID:  {from_number}")
    print(f"Webhook:    {webhook_url}")
    print("Connecting to Twilio API...")

    api_url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json"
    credentials = f"{account_sid}:{auth_token}"
    auth_header = f"Basic {base64.b64encode(credentials.encode('utf-8')).decode('utf-8')}"

    post_data = urllib.parse.urlencode({
        "To": target_phone,
        "From": from_number,
        "Url": webhook_url,
        "Method": "POST",
    }).encode("utf-8")

    req = urllib.request.Request(api_url, data=post_data, method="POST")
    req.add_header("Authorization", auth_header)
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=15.0) as resp:
                status_code = resp.getcode()
                body = resp.read().decode("utf-8")
                call_data = json.loads(body)
                print("\n[SUCCESS] Call initiated successfully!")
                print(f"Call SID:   {call_data.get('sid')}")
                print(f"Status:     {call_data.get('status')}")
                print(f"To Number:  {call_data.get('to')}")
                print("\n>>> Your phone will start ringing in a few seconds.")
                print(">>> Answer the call to speak with the Kural Sevi AI Assistant in Tamil.")
                return
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            print(f"\n[FAIL] Twilio HTTP Error ({e.code}): {err_body}")
            return
        except Exception as e:
            print(f"Attempt {attempt+1} encountered network retry ({e})...")
            time.sleep(1)

if __name__ == "__main__":
    main()
