#!/usr/bin/env python3
"""
Kural Sevi — Live Call Processing Logs Viewer
Polls and streams call processing events directly in terminal with color coding.
Usage: python3 scripts/view-call-logs.py
"""
import time
import json
import urllib.request
import sys

URL = "http://localhost:8000/api/logs"

def main():
    print("=" * 65)
    print("  KURAL SEVI: Live Call Processing Monitor")
    print("  Streaming live events from Voice API (Groq, Sarvam, Twilio)...")
    print("  Press Ctrl+C to exit")
    print("=" * 65)

    seen_messages = set()

    while True:
        try:
            req = urllib.request.Request(URL)
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                logs = data.get("logs", [])
                for entry in logs:
                    fmt = entry.get("formatted", "")
                    if fmt not in seen_messages:
                        seen_messages.add(fmt)
                        lvl = entry.get("level", "INFO")
                        if lvl == "ERROR":
                            color = "\033[91m"
                        elif lvl == "WARNING":
                            color = "\033[93m"
                        else:
                            color = "\033[92m"
                        print(f"{color}{fmt}\033[0m")
                        sys.stdout.flush()
        except KeyboardInterrupt:
            print("\nStopped.")
            break
        except Exception:
            pass
        time.sleep(0.5)

if __name__ == "__main__":
    main()
