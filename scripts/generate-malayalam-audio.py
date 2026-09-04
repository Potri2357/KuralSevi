#!/usr/bin/env python3
"""
Generates studio-quality Malayalam voice clips using edge-tts (ml-IN-SobhanaNeural)
and formats them to telephony-standard 8000Hz mono WAV via ffmpeg.
"""
import asyncio
import os
import subprocess
import tempfile
from pathlib import Path

TARGET_DIR = Path(__file__).resolve().parent.parent / "apps" / "voice-api" / "static_audio"
VARIATIONS_DIR = TARGET_DIR / "variations"
VARIATIONS_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "ml-IN-SobhanaNeural"

AUDIO_SCRIPTS = {
    # Initial Consent Greeting
    "consent_ml.wav": "നമസ്കാരം! ഞാൻ കുരൽ സെവി. സർക്കാർ സഹായ പദ്ധതി വിവരങ്ങൾക്കായി വിളിക്കുന്നതാണ്. സംസാരിക്കാമോ?",
    
    # Intro reprompt on silence
    "intro_reprompt_ml.wav": "നമസ്കാരം, ഞാൻ പറയുന്നത് കേൾക്കാമോ? സംസാരിക്കാമോ?",
    
    # Question 1: Name & Village (with appreciation)
    "q1_name_village_ml.wav": "വളരെ നന്ദി! ആദ്യം നിങ്ങളുടെ പേരും ഏത് നാടാണെന്നും പറയാമോ?",
    
    # Question 2: Education (Variations)
    "q2_education_v1_ml.wav": "വളരെ സന്തോഷം! നിങ്ങളുടെ വിദ്യാഭ്യാസം എന്താണ്, സ്കൂളിൽ പോയിട്ടുണ്ടോ?",
    "q2_education_v2_ml.wav": "നന്നായി! നിങ്ങളുടെ പഠന വിവരങ്ങൾ പറയാമോ, എത്ര വരെ പഠിച്ചു?",
    
    # Question 3: Family Occupation (Variations)
    "q3_family_occ_v1_ml.wav": "വളരെ നല്ലത്! അടുത്തതായി നിങ്ങളുടെ കുടുംബ പരമ്പരാഗത തൊഴിൽ എന്താണ്?",
    "q3_family_occ_v2_ml.wav": "ശരി! നിങ്ങളുടെ കുടുംബത്തിൽ സാധാരണയായി എന്ത് ജോലിയാണ് ചെയ്യുന്നത്?",
    
    # Question 4: Current Work (Farming vs General)
    "q4_current_work_farming_ml.wav": "കൃഷി ചെയ്യുന്നത് വലിയ കാര്യമാണ്! ഇപ്പോൾ നിങ്ങൾ ദിവസേന എന്ത് ജോലിയാണ് ചെയ്യുന്നത്?",
    "q4_current_work_gen_ml.wav": "വളരെ നന്ദി! ഇപ്പോൾ നിങ്ങളുടെ ദൈനംദിന വരുമാനത്തിനായി എന്ത് ജോലിയാണ് ചെയ്യുന്നത്?",
    
    # Question 5: Skills & Interests
    "q5_skills_v1_ml.wav": "നല്ലത്! നിങ്ങൾക്ക് എന്തൊക്കെ തൊഴിൽ നൈപുണ്യങ്ങൾ അല്ലെങ്കിൽ താൽപ്പര്യങ്ങൾ ഉണ്ട്?",
    "q5_skills_v2_ml.wav": "വളരെ സന്തോഷം! സ്വന്തമായി ചെയ്യാൻ എന്തൊക്കെ ജോലികൾ പഠിച്ചിട്ടുണ്ട്?",
    
    # Question 6: Mobility & Travel (Cooking, Driving, General)
    "q6_mobility_cooking_ml.wav": "നന്നായി, പാചക കല വലിയൊരു വരദാനമാണ്! ജോലിക്കായി അടുത്തുള്ള സ്ഥലങ്ങളിലേക്ക് യാത്ര ചെയ്യാൻ സാധിക്കുമോ?",
    "q6_mobility_driving_ml.wav": "ഡ്രൈവിംഗ് മികച്ചൊരു തൊഴിലാണ്! ജോലിക്കായി പുറത്തേക്ക് പോകാൻ സാധിക്കുമോ?",
    "q6_mobility_gen_ml.wav": "ശരി! ജോലിക്കായി പുറത്തേക്കോ അടുത്തുള്ള പട്ടണങ്ങളിലേക്കോ പോകാൻ സാധിക്കുമോ?",
    
    # Question 7: Employment Preference
    "q7_pref_v1_ml.wav": "വളരെ നല്ലത്! നിങ്ങൾക്ക് സ്വന്തമായി ബിസിനസ് തുടങ്ങാനാണോ അതോ മാസ ശമ്പളമുള്ള ജോലിയാണോ താൽപ്പര്യം?",
    "q7_pref_v2_ml.wav": "വളരെ നന്ദി! നിങ്ങൾക്ക് സ്വന്തമായി കട തുടങ്ങാനാണോ അതോ സ്ഥാപനത്തിൽ ജോലി ചെയ്യാനാണോ ആഗ്രഹം?",
    
    # Question 8: Local Economic Context
    "q8_context_business_ml.wav": "സ്വന്തം സംരംഭ ശ്രമങ്ങൾക്ക് എല്ലാവിധ ആശംസകളും! നിങ്ങളുടെ നാട്ടിൽ എന്തൊക്കെ കടകളോ ചന്തയോ ഉണ്ട്?",
    "q8_context_gen_ml.wav": "നന്നായി! നിങ്ങളുടെ നാട്ടിൽ പ്രധാനമായും എന്തൊക്കെ കടകളും സ്ഥാപനങ്ങളുമാണ് ഉള്ളത്?",
    
    # Wrap-up Completion
    "q_wrapup_v2_ml.wav": "വളരെ നന്ദി! നിങ്ങളുടെ എല്ലാ വിവരങ്ങളും വിജയകരമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്. ആശംസകൾ!",
    
    # Polite Apologies & Clarification
    "sorry_unclear_ml.wav": "ക്ഷമിക്കണം, വ്യക്തമായി കേട്ടില്ല. ഒന്നുകൂടി പറയാമോ?",
    "sorry_repeat_ml.wav": "ക്ഷമിക്കണം, ദയവായി ഒന്നുകൂടി പറയാമോ.",
}

async def generate_audio(filename: str, text: str):
    import edge_tts
    if filename == "consent_ml.wav":
        out_path = TARGET_DIR / filename
    else:
        out_path = VARIATIONS_DIR / filename

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_mp3:
        tmp_mp3_path = tmp_mp3.name

    try:
        communicate = edge_tts.Communicate(text, VOICE, rate="+15%")
        await communicate.save(tmp_mp3_path)
        
        # Convert to telephony standard 8000Hz mono 16-bit PCM WAV
        cmd = [
            "ffmpeg", "-y", "-i", tmp_mp3_path,
            "-ar", "8000", "-ac", "1", "-c:a", "pcm_s16le",
            str(out_path)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        size = out_path.stat().st_size
        print(f"  [OK] Generated {filename} ({size} bytes)")
    finally:
        if os.path.exists(tmp_mp3_path):
            os.remove(tmp_mp3_path)

async def main():
    print("=" * 65)
    print("  Generating Studio-Quality Malayalam Audio Assets (Sobhana Neural)")
    print("=" * 65)
    for fn, txt in AUDIO_SCRIPTS.items():
        await generate_audio(fn, txt)
    print("\n[SUCCESS] All Malayalam audio assets generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
