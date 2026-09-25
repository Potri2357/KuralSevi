#!/usr/bin/env python3
"""
Kural Sevi — Live Outbound Telephony Call Trigger (Exotel India)
Initiates an outbound phone call via Exotel India to domestic phone numbers
and connects the caller directly into the live multilingual Voice Interview.
"""
import sys
from pathlib import Path
from importlib.machinery import SourceFileLoader

def main():
    exotel_script = Path(__file__).parent / "trigger-exotel-call.py"
    mod = SourceFileLoader("exotel_dialer", str(exotel_script)).load_module()
    mod.main()

if __name__ == "__main__":
    main()
