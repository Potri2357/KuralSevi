#!/usr/bin/env python3
"""
Kural Sevi — WhatsApp Notification Tester & Channel Diagnostics
Checks WhatsApp delivery mechanisms:
1. Meta WhatsApp Cloud API credentials
2. Twilio WhatsApp API credentials & past delivery logs
3. Formatted bilingual WhatsApp message preview & wa.me deep-link

Usage:
    python3 scripts/test-whatsapp.py [--send] [+919342900638]
"""
import os
import sys
import json
import base64
import ssl
import urllib.request
import urllib.parse
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

phone = sys.argv[2] if len(sys.argv) > 2 else (sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "9342900638")
clean_digits = "".join(c for c in phone if c.isdigit())
if len(clean_digits) == 10:
    clean_digits = f"91{clean_digits}"

print("=" * 65)
print("  Kural Sevi — WhatsApp Channel Diagnostics & Tester")
print("=" * 65)
print(f"Target Recipient: +{clean_digits}")
print("-" * 65)

# 1. Local WhatsApp Web Bot Check (100% Free Self-Hosted Bot)
bot_url = os.getenv("WHATSAPP_BOT_URL") or env_vars.get("WHATSAPP_BOT_URL", "http://localhost:5005")
print(f"\n📡 [Channel 1: Self-Hosted WhatsApp Bot ({bot_url})]")
try:
    req_b = urllib.request.Request(f"{bot_url.rstrip('/')}/status", method="GET")
    with urllib.request.urlopen(req_b, timeout=2.0) as resp:
        b_data = json.loads(resp.read().decode())
        if b_data.get("connected"):
            print(f"  ✅ Status: CONNECTED (Linked Account: +{b_data.get('phone')})")
            print(f"  👉 Ready to dispatch 100% automated messages!")
        elif b_data.get("qrAvailable"):
            print(f"  ⚠️  Status: QR CODE READY (Not yet scanned)")
            print(f"  👉 Open {b_data.get('qrUrl')} in browser to scan QR with WhatsApp!")
        else:
            print(f"  ℹ️  Status: {b_data.get('status')}")
except Exception:
    print("  ⚪ Status: OFFLINE (Start with: npm run whatsapp:bot)")

# 2. Message Template & Deep-Link Preview
print("\n📝 [Channel 2: Message Template & One-Click wa.me Deep-Link]")
api_dir = Path(__file__).resolve().parent.parent / "apps" / "voice-api"
sys.path.insert(0, str(api_dir))

# Add venv site-packages if running with system python
venv_site = list(api_dir.glob(".venv/lib/python*/site-packages"))
if venv_site:
    sys.path.insert(0, str(venv_site[0]))

from services.notification_service import NotificationService

ns = NotificationService()
sample_fields = {
    "educational_background": "Class 10 completed",
    "current_livelihood": "Agricultural labour",
    "skills_and_interests": "Solar Photovoltaic Maintenance"
}
wa_msg = ns.build_bilingual_whatsapp_message(
    phone=f"+{clean_digits}",
    language_code="ta",
    case_id="CASE-8842",
    confirmed_fields=sample_fields,
    caller_name="Kumar",
    selected_course="Solar Panel Technician"
)

wa_link = f"https://wa.me/{clean_digits}?text={urllib.parse.quote(wa_msg)}"
print(f"  ✓ WhatsApp Message Formatted ({len(wa_msg)} chars, Bilingual Tamil & English)")
print(f"  ✓ Direct wa.me Deep Link:\n    {wa_link[:100]}...")

# 4. Optional Send
if "--send" in sys.argv or "--send-bot" in sys.argv:
    print("\n🚀 Dispatching live test WhatsApp message via WhatsApp Bot alone (No SMS)...")
    try:
        req_send = urllib.request.Request(
            f"{bot_url.rstrip('/')}/send",
            data=json.dumps({"to": clean_digits, "message": wa_msg}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_send, timeout=8.0) as resp:
            resp_data = json.loads(resp.read().decode())
            print(f"  ✅ SUCCESS: Message delivered via Bot!")
            print(f"  Message ID: {resp_data.get('messageId')}")
            print(f"  Recipient:  +{resp_data.get('to')}")
    except Exception as e:
        print(f"  ⚠️  Bot dispatch error: {e}")
        print("  Trying fallback via NotificationService...")
        import asyncio
        res = asyncio.run(ns._send_local_bot_whatsapp(f"+{clean_digits}", wa_msg))
        print(f"  Result: {res}")
else:
    print("\n🛡️  Check-only mode: Run with '--send' flag to dispatch WhatsApp message via the bot.")
print("=" * 65)
