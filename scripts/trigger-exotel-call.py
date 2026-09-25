#!/usr/bin/env python3
"""
Kural Sevi — Live Outbound Telephony Call Trigger (Exotel India)
Initiates an outbound phone call via Exotel India to domestic phone numbers
and connects the caller directly into the live multilingual Voice Interview.
Uses pure Python standard library (no external dependencies required).
"""
import os
import sys
import json
import base64
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

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
    target_phone = sys.argv[1].strip() if len(sys.argv) > 1 else os.environ.get("EXOTEL_TRIAL_PIN", "9342900638")
    language = sys.argv[2].strip().lower() if len(sys.argv) > 2 else "en"

    # Normalize phone digits for Exotel (expects 10-digit format without +91 or with leading 0)
    clean_phone = "".join(c for c in target_phone if c.isdigit())
    if clean_phone.startswith("91") and len(clean_phone) == 12:
        clean_phone = clean_phone[2:]
    elif clean_phone.startswith("0") and len(clean_phone) == 11:
        clean_phone = clean_phone[1:]

    account_sid = os.environ.get("EXOTEL_ACCOUNT_SID", "incogvia1")
    api_key = os.environ.get("EXOTEL_API_KEY", "")
    api_token = os.environ.get("EXOTEL_API_TOKEN", "")
    caller_id = os.environ.get("EXOTEL_CALLER_ID", "08047289241")
    app_id = os.environ.get("EXOTEL_APP_ID", "")
    trial_number = os.environ.get("EXOTEL_TRIAL_NUMBER", "09513886363")
    trial_pin = os.environ.get("EXOTEL_TRIAL_PIN", "9342900638")

    base_url = os.environ.get("VOICE_API_URL", "https://charita-techiest-histogenetically.ngrok-free.dev").rstrip("/")

    print("=" * 65)
    print("  Kural Sevi — Exotel Outbound Indian Telephony Dialer")
    print("=" * 65)
    print(f"  Account SID:         {account_sid}")
    print(f"  ExoPhone (CallerId): {caller_id}")
    print(f"  Destination (To):    +91 {clean_phone}")
    print(f"  Interview Language:  {language.upper()}")
    print(f"  Voice API Tunnel:    {base_url}")
    print("=" * 65 + "\n")

    if not api_key or not api_token:
        print("[ERROR] EXOTEL_API_KEY and EXOTEL_API_TOKEN must be set in .env")
        sys.exit(1)

    # Pre-flight check: Verify ngrok tunnel
    health_url = f"{base_url}/health"
    try:
        req = urllib.request.Request(health_url, headers={"User-Agent": "KuralSeviExotel/1.0"})
        with urllib.request.urlopen(req, timeout=3.5) as h_resp:
            if h_resp.getcode() == 200:
                print(f"[OK] Voice API tunnel is healthy ({base_url})")
    except Exception as e:
        print(f"[WARNING] Voice API tunnel returned: {e}")

    api_url = f"https://api.exotel.com/v1/Accounts/{account_sid}/Calls/connect.json"
    auth_str = f"{api_key}:{api_token}"
    auth_header = f"Basic {base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')}"

    form_fields = {
        "From": clean_phone,
        "CallerId": caller_id,
        "CallType": "trans",
    }

    if app_id:
        form_fields["Url"] = f"http://my.exotel.com/{account_sid}/exoml/start_voice/{app_id}"
    else:
        # Default bridging connect
        form_fields["To"] = clean_phone

    payload = urllib.parse.urlencode(form_fields).encode("utf-8")
    post_req = urllib.request.Request(api_url, data=payload, method="POST")
    post_req.add_header("Authorization", auth_header)
    post_req.add_header("Content-Type", "application/x-www-form-urlencoded")
    post_req.add_header("User-Agent", "KuralSevi/1.0")

    print(f"Initiating call via Exotel API...")
    try:
        with urllib.request.urlopen(post_req, timeout=12.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            call_obj = data.get("Call", {})
            call_sid = call_obj.get("Sid")
            status = call_obj.get("Status")
            to_num = call_obj.get("To")

            print("\n" + "=" * 65)
            print("  [SUCCESS] CALL TRIGGERED ON EXOTEL!")
            print("=" * 65)
            print(f"  Call SID:        {call_sid}")
            print(f"  Status:          {status}")
            print(f"  Dialing:         {to_num}")
            print(f"  ExoPhone CLI:    {caller_id}")
            print("=" * 65)
            print(f"\nYour phone ({clean_phone}) should start ringing right now!")
            print(f"Incoming call will display as: {caller_id}\n")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"\n[FAILED] Exotel API returned HTTP {e.code}:")
        print(f"  {err_body}")
        sys.exit(1)
    except Exception as ex:
        print(f"\n[ERROR] Exception triggering Exotel call: {ex}")
        sys.exit(1)

if __name__ == "__main__":
    main()
