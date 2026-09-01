import subprocess
import json
import base64
from pathlib import Path

out_dir = Path(__file__).resolve().parent.parent / "apps" / "voice-api" / "static_audio"
out_dir.mkdir(parents=True, exist_ok=True)
out_file = out_dir / "ack_ta.wav"

cmd = [
    "curl", "-s", "-X", "POST", "https://api.sarvam.ai/text-to-speech",
    "-H", "api-subscription-key: sk_b0wfufw1_v9Rabeb8aYuDW5e4uHzADIfo",
    "-H", "Content-Type: application/json",
    "-d", json.dumps({
        "inputs": ["சரிங்க..."],
        "target_language_code": "ta-IN",
        "speaker": "kavitha",
        "model": "bulbul:v3",
        "speech_sample_rate": 8000
    })
]

proc = subprocess.run(cmd, capture_output=True, text=True)
if proc.returncode != 0:
    print("Curl failed:", proc.stderr)
    exit(1)

data = json.loads(proc.stdout)
if "audios" in data and len(data["audios"]) > 0:
    audio_data = base64.b64decode(data["audios"][0])
    out_file.write_bytes(audio_data)
    print(f"Generated {out_file} successfully! Size: {len(audio_data)} bytes")
else:
    print("Sarvam error:", data)
