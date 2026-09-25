#!/usr/bin/env python3
"""
Kural Sevi — Fast2SMS Gateway Tester & Balance Checker
Checks Fast2SMS wallet balance and dispatches a live test SMS via Quick Route ("q").

Usage:
    python3 scripts/test-fast2sms.py [+919342900638] ["Custom message"]
"""
import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

# Load .env
env_path = Path(__file__).resolve().parent.parent / ".env"
env_vars = {}
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip()

api_key = os.getenv("FAST2SMS_API_KEY") or env_vars.get("FAST2SMS_API_KEY", "")
phone = sys.argv[1] if len(sys.argv) > 1 else "9342900638"
clean_digits = "".join(c for c in phone if c.isdigit())
if clean_digits.startswith("91") and len(clean_digits) == 12:
    clean_digits = clean_digits[2:]

message = sys.argv[2] if len(sys.argv) > 2 else "PM-AJAY: Your vocational training intake is verified! Ref: 8842"

print("=" * 60)
print("  Kural Sevi — Fast2SMS Quick Route Tester")
print("=" * 60)
print(f"Target Recipient: +91 {clean_digits}")
print(f"Message Body:     {message}")
print(f"API Key:          {api_key[:12]}...{api_key[-6:] if api_key else '(empty)'}")
print("-" * 60)

if not api_key:
    print("❌ FAST2SMS_API_KEY is missing in .env!")
    sys.exit(1)

BROWSER_UA = "curl/8.7.1"

# 1. Check Wallet Balance
print("🔍 Checking Fast2SMS Wallet Balance...")
wallet_url = "https://www.fast2sms.com/dev/wallet"
req_w = urllib.request.Request(wallet_url, method="GET")
req_w.add_header("authorization", api_key)
req_w.add_header("User-Agent", BROWSER_UA)

import ssl
ctx = ssl.create_default_context()
try:
    ctx.set_ciphers("DEFAULT@SECLEVEL=1")
except Exception:
    pass

wallet_fetched = False
try:
    with urllib.request.urlopen(req_w, context=ctx, timeout=8.0) as resp:
        w_data = json.loads(resp.read().decode())
        print(f"💰 Wallet Balance: ₹{w_data.get('wallet', '0.00')} (SMS Count: {w_data.get('sms_count', 'N/A')})")
        wallet_fetched = True
except Exception as e:
    # Curl fallback for balance check
    import subprocess
    c_res = subprocess.run([
        "curl", "--tlsv1.2", "--http1.1", "-s", wallet_url,
        "-H", f"authorization: {api_key}",
        "-H", f"User-Agent: {BROWSER_UA}"
    ], capture_output=True, text=True)
    if c_res.returncode == 0 and c_res.stdout:
        try:
            w_data = json.loads(c_res.stdout)
            print(f"💰 Wallet Balance: ₹{w_data.get('wallet', '0.00')} (SMS Count: {w_data.get('sms_count', 'N/A')})")
            wallet_fetched = True
        except Exception:
            print(f"⚠️  Could not parse wallet balance: {c_res.stdout}")
    else:
        print(f"⚠️  Could not fetch wallet balance: {e}")

if "--check" in sys.argv or "--balance-only" in sys.argv or "--dry-run" in sys.argv:
    print("\n🛡️  Check-only mode requested: Skipped SMS dispatch to protect wallet balance.")
    sys.exit(0)

# 2. Dispatch Live SMS via Quick Route
print("\n📡 Dispatching SMS via Fast2SMS Quick Route ('q')...")
sms_url = "https://www.fast2sms.com/dev/bulkV2"
payload_dict = {
    "route": "q",
    "message": message[:160],
    "language": "english",
    "flash": 0,
    "numbers": clean_digits,
}

dispatched = False
# Try httpx first (modern TLS)
try:
    import httpx
    with httpx.Client(timeout=8.0) as client:
        resp = client.post(
            sms_url,
            headers={
                "authorization": api_key,
                "Content-Type": "application/json",
                "User-Agent": BROWSER_UA,
            },
            json=payload_dict
        )
        data = resp.json()
        if resp.status_code == 200 and data.get("return"):
            print("\n✅ SUCCESS: Fast2SMS accepted the request via httpx!")
            print(f"Response: {data}")
            print(f"\n🎉 Cellular SMS dispatched to +91 {clean_digits} via Fast2SMS!")
            dispatched = True
        elif data.get("message") == "Account Disabled":
            print(f"\n⚠️ Fast2SMS Notice: Account Disabled (Code 415).")
            print("👉 Please log into https://www.fast2sms.com to verify your account or reactivate your API key.")
            dispatched = True
        else:
            print(f"\n❌ Fast2SMS response notice: {data}")
            dispatched = True
except Exception as ex:
    pass

if not dispatched:
    # Try urllib
    try:
        payload_bytes = json.dumps(payload_dict).encode("utf-8")
        req_s = urllib.request.Request(sms_url, data=payload_bytes, method="POST")
        req_s.add_header("authorization", api_key)
        req_s.add_header("Content-Type", "application/json")
        req_s.add_header("User-Agent", BROWSER_UA)

        with urllib.request.urlopen(req_s, timeout=10.0) as resp:
            resp_data = json.loads(resp.read().decode())
            if resp_data.get("return"):
                print("\n✅ SUCCESS: Fast2SMS accepted the request via urllib!")
                print(f"Response: {resp_data}")
                print(f"\n🎉 Cellular SMS dispatched to +91 {clean_digits} via Fast2SMS!")
                dispatched = True
            elif resp_data.get("message") == "Account Disabled":
                print(f"\n⚠️ Fast2SMS Notice: Account Disabled (Code 415).")
                print("👉 Please log into https://www.fast2sms.com to verify your account or reactivate your API key.")
                dispatched = True
            else:
                print(f"\n❌ Fast2SMS response notice: {resp_data}")
                dispatched = True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        try:
            err_json = json.loads(err_body)
            if err_json.get("message") == "Account Disabled":
                print(f"\n⚠️ Fast2SMS Notice: Account Disabled (Code 415).")
                print("👉 Please log into https://www.fast2sms.com to verify your account or reactivate your API key.")
            else:
                print(f"\n❌ Fast2SMS HTTP Error {e.code}: {err_body}")
        except Exception:
            print(f"\n❌ Fast2SMS HTTP Error {e.code}: {err_body}")
        dispatched = True
    except Exception as ex:
        pass

if not dispatched:
    # Fallback to system curl
    import subprocess
    cmd = [
        "curl", "-s", "-X", "POST", sms_url,
        "-H", f"authorization: {api_key}",
        "-H", "Content-Type: application/json",
        "-H", f"User-Agent: {BROWSER_UA}",
        "-d", json.dumps(payload_dict)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        curl_data = json.loads(res.stdout)
        if curl_data.get("return"):
            print("\n✅ SUCCESS: Fast2SMS accepted the request via curl!")
            print(f"Response: {curl_data}")
            print(f"\n🎉 Cellular SMS dispatched to +91 {clean_digits} via Fast2SMS!")
        elif curl_data.get("message") == "Account Disabled":
            print(f"\n⚠️ Fast2SMS Notice: Account Disabled (Code 415).")
            print("👉 Please log into https://www.fast2sms.com to verify your account or reactivate your API key.")
        else:
            print(f"\n⚠️ Fast2SMS notice: {curl_data}")
    except Exception as e:
        print(f"\n❌ Dispatch failed: {res.stdout or res.stderr or e}")
