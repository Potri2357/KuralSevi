"""
Kural Sevi — Pre-Render Audio Bank
Pre-synthesizes the 7 standard PM-AJAY questions and core phrases using Sarvam Bulbul V3.
Saves them directly into static_audio/cache/ with SHA-256 fingerprinting.
Eliminates live TTS API calls and delivers 0.001ms audio playback during phone interviews.
"""
import sys
import asyncio
import logging
from pathlib import Path

# Add voice-api to path
voice_api_dir = Path(__file__).resolve().parent.parent / "apps" / "voice-api"
sys.path.insert(0, str(voice_api_dir))

from config import settings
from services.tts_service import synthesize_speech, get_cached_audio

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("audio_bank")

STANDARD_PHRASES = [
    # 1. Initial Greeting & Consent
    "வணக்கம்! நான் குரல் செவி. PM-AJAY திட்டத்தின் கீழ் உங்கள் கல்வி, தொழில், திறன்கள் பற்றி சில கேள்விகள் கேட்கிறேன். தகவல்கள் ரகசியமாக வைக்கப்படும். தொடர சம்மதிக்கிறீர்களா? ஆமாம் என்று சொல்லுங்கள்.",
    
    # 2. Education (Field 1)
    "உங்கள் கல்வி தகுதி என்ன? நீங்கள் எவ்வளவு வரை படித்துள்ளீர்கள்?",
    "நண்பரே, உங்கள் படிப்பு நிலை என்ன?",
    
    # 3. Family Occupation (Field 2)
    "உங்கள் குடும்பத்தின் பாரம்பரிய தொழில் என்ன?",
    "நல்லது! உங்கள் குடும்பத்தின் முக்கிய தொழில் என்ன?",
    
    # 4. Current Livelihood (Field 3)
    "தற்போது உங்கள் வாழ்வாதாரத்திற்கு என்ன வேலை செய்கிறீர்கள்?",
    
    # 5. Skills and Interests (Field 4)
    "உங்களுக்கு என்னென்ன வேலைகளில் திறன் அல்லது அனுபவம் உள்ளது?",
    
    # 6. Mobility Constraints (Field 5)
    "வேலைக்காக எவ்வளவு தூரம் பயணம் செய்ய முடியும்? ஏதேனும் கட்டுப்பாடுகள் உள்ளதா?",
    
    # 7. Employment Preference (Field 6)
    "சுயதொழில் செய்ய விரும்புகிறீர்களா, அல்லது மாத சம்பள வேலையா?",
    
    # 8. Local Economic Context (Field 7)
    "உங்கள் ஊருக்கு அருகில் என்னென்ன தொழிற்சாலைகள் மற்றும் சந்தைகள் உள்ளன?",
    
    # 9. Clarification / Fallback
    "மன்னிக்கவும், நீங்கள் கூறியதை மீண்டும் ஒருமுறை கூற முடியுமா?",
    
    # 10. Wrap-up / Completion
    "நன்றி! உங்கள் தகவல்கள் வெற்றிகரமாக பதிவு செய்யப்பட்டன. அடுத்த 3 நாட்களில் மாவட்ட சமூக நல அலுவலர் உங்களை தொடர்புகொள்வார். நன்றி, வணக்கம்."
]

async def pre_render_all():
    logger.info(f"Starting Pre-render of {len(STANDARD_PHRASES)} standard interview phrases...")
    speaker = "kavitha"
    lang = "ta"
    success_count = 0
    cached_count = 0

    for i, phrase in enumerate(STANDARD_PHRASES, 1):
        # Check if already cached
        existing = get_cached_audio(phrase, lang, speaker)
        if existing:
            logger.info(f"[{i}/{len(STANDARD_PHRASES)}] ALREADY CACHED: {phrase[:40]}... ({len(existing)} bytes)")
            cached_count += 1
            continue

        logger.info(f"[{i}/{len(STANDARD_PHRASES)}] Synthesizing: {phrase[:40]}...")
        try:
            res = await synthesize_speech(
                text=phrase,
                language_code=lang,
                sarvam_api_key=settings.sarvam_api_key,
                sarvam_tts_url=settings.sarvam_tts_url,
                mock_mode=False,
                speaker_override=speaker,
            )
            if res and res.audio_bytes:
                logger.info(f"[{i}/{len(STANDARD_PHRASES)}] SUCCESS ({len(res.audio_bytes)} bytes)")
                success_count += 1
            else:
                logger.warning(f"[{i}/{len(STANDARD_PHRASES)}] Failed or circuit breaker active")
        except Exception as e:
            logger.error(f"[{i}/{len(STANDARD_PHRASES)}] Error synthesizing: {e}")
        
        # Brief pause between synthesis calls
        await asyncio.sleep(0.3)

    logger.info(f"Pre-render complete! {cached_count} already cached, {success_count} newly synthesized.")

if __name__ == "__main__":
    asyncio.run(pre_render_all())
