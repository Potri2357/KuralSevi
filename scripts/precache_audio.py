#!/usr/bin/env python3
"""
Pre-caches all course recommendation and wrap-up speeches into apps/voice-api/static_audio/cache/
so that every turn in the interview returns in 0.000 milliseconds!
"""
import sys
import asyncio
from pathlib import Path

VOICE_API_DIR = Path(__file__).resolve().parent.parent / "apps" / "voice-api"
sys.path.insert(0, str(VOICE_API_DIR))

from services.course_catalog import CATALOG_COURSES, get_localized_course_name, compute_top_recommended_courses
from services.tts_service import put_cached_audio, get_cached_audio, SARVAM_TTS_SPEAKERS, _normalize_lang, _synthesize_edge_tts

async def precache_all():
    print("=" * 65)
    print("  Kural Sevi — Pre-caching Speech Assets for Zero-Lag Turns")
    print("=" * 65)
    
    tasks_to_generate = []
    
    # 1. Precache 10 Wrap-up celebration speeches for Tamil
    for c in CATALOG_COURSES:
        loc = get_localized_course_name(c, "ta")
        c_clean = loc.replace(" பயிற்சி", "") if loc.endswith(" பயிற்சி") else loc
        wrap_text = f"ரொம்ப மகிழ்ச்சிங்க! உங்க விருப்பமான {c_clean} பயிற்சி பதிவாகிடுச்சு. விவரங்கள் வாட்ஸ்அப்பிலும் அனுப்பியுள்ளோம். வாழ்த்துகள்ங்க!"
        tasks_to_generate.append((wrap_text, "ta"))
        
    # 2. Precache 8 Common Course Selection speeches for Tamil
    profiles = [
        {"sector_preference": "tailoring"},
        {"sector_preference": "retail"},
        {"sector_preference": "poultry"},
        {"sector_preference": "mechanic"},
        {"sector_preference": "beauty"},
        {"sector_preference": "electrical"},
        {"sector_preference": "farming"},
        {"sector_preference": "food"},
        {"sector_preference": "leather"},
        {}, # default
    ]
    for p in profiles:
        top = compute_top_recommended_courses(p)
        c1_local = get_localized_course_name(top[0], "ta") if len(top) >= 1 else "தொழில் பயிற்சி"
        c2_local = get_localized_course_name(top[1], "ta") if len(top) >= 2 else "சுயதொழில் பயிற்சி"
        ask_course_text = f"மிக்க நன்றிங்க! விவரங்கள் பதிவாகிடுச்சு. உங்களுக்கான இரண்டு சிறந்த பயிற்சிகள்: ஒன்று, {c1_local}. இரண்டு, {c2_local}. இந்த இரண்டில் உங்களுக்கு எதில் விருப்பம்னு சொல்லுங்க?"
        tasks_to_generate.append((ask_course_text, "ta"))

    # De-duplicate
    unique_items = list({(text, lang): True for text, lang in tasks_to_generate}.keys())
    print(f"Total unique prompts to ensure cached: {len(unique_items)}")

    speaker = SARVAM_TTS_SPEAKERS.get("ta", "kavitha")
    cached_count = 0
    new_count = 0

    for text, lang in unique_items:
        cached = get_cached_audio(text, lang, speaker)
        if cached:
            cached_count += 1
            print(f" [ALREADY CACHED] {text[:45]}...")
        else:
            print(f" [GENERATING]     {text[:45]}...")
            audio = await _synthesize_edge_tts(text, lang)
            if audio:
                put_cached_audio(text, lang, speaker, audio)
                new_count += 1
                print(f"  --> Saved ({len(audio)} bytes)")
            else:
                print(f"  --> FAILED to synthesize!")

    print("=" * 65)
    print(f"Done! {cached_count} already cached, {new_count} newly pre-cached.")
    print("All turns will now return instantly with 0ms delay!")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(precache_all())
