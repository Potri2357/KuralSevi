#!/usr/bin/env python3
"""
Generates pre-rendered 8000Hz mono telephony WAV audio assets for:
- Hindi (hi-IN-SwaraNeural)
- Telugu (te-IN-ShrutiNeural)
"""
import asyncio
import subprocess
from pathlib import Path
import edge_tts

OUTPUT_DIR = Path("apps/voice-api/static_audio")
VARIATIONS_DIR = OUTPUT_DIR / "variations"
VARIATIONS_DIR.mkdir(parents=True, exist_ok=True)

HINDI_PROMPTS = {
    # Consent
    OUTPUT_DIR / "consent_hi.wav": "नमस्ते! मैं कुरल सेवी हूँ। PM-AJAY सरकारी आजीविका सहायता योजना के लिए आपकी जानकारी एकत्र करने के लिए कॉल कर रहा हूँ। क्या हम बात कर सकते हैं?",
    # Reprompt
    VARIATIONS_DIR / "intro_reprompt_hi.wav": "नमस्ते, क्या आप मुझे सुन पा रहे हैं? क्या हम बात कर सकते हैं?",
    # Q1 Name & Village
    VARIATIONS_DIR / "q1_name_village_hi.wav": "बहुत-बहुत धन्यवाद! सबसे पहले आपका शुभ नाम और आप किस गांव या शहर से हैं, यह बताइए?",
    # Q2 Education
    VARIATIONS_DIR / "q2_education_v1_hi.wav": "बहुत अच्छा! आपकी पढ़ाई के बारे में बताइए, क्या आप स्कूल गए हैं?",
    VARIATIONS_DIR / "q2_education_v2_hi.wav": "बहुत बढ़िया! आपकी शिक्षा कितनी तक हुई है, क्या स्कूल की पढ़ाई की है?",
    # Q3 Family Occupation
    VARIATIONS_DIR / "q3_family_occ_v1_hi.wav": "बिल्कुल सही! आपके परिवार में पारंपरिक रूप से कौन सा काम या व्यवसाय किया जाता है?",
    VARIATIONS_DIR / "q3_family_occ_v2_hi.wav": "अच्छा! आपके परिवार का मुख्य व्यवसाय या पारंपरिक काम क्या है?",
    # Q4 Current Work
    VARIATIONS_DIR / "q4_current_work_farming_hi.wav": "खेती करना बहुत गर्व की बात है! खेती के साथ-साथ क्या आप रोज़ाना कोई अन्य काम भी करते हैं?",
    VARIATIONS_DIR / "q4_current_work_gen_hi.wav": "बहुत अच्छा! वर्तमान में अपनी दैनिक आजीविका या आमदनी के लिए आप क्या काम करते हैं?",
    # Q5 Skills
    VARIATIONS_DIR / "q5_skills_v1_hi.wav": "सरकारी कौशल योजना के लिए, आपके पास कौन से विशेष काम या हुनर की जानकारी है?",
    VARIATIONS_DIR / "q5_skills_v2_hi.wav": "बहुत खूब! खुद का काम करने के लिए आपने कौन सा हुनर या काम सीखा हुआ है?",
    # Q6 Mobility
    VARIATIONS_DIR / "q6_mobility_cooking_hi.wav": "रसोई और खानपान का हुनर बहुत बढ़िया है! क्या काम के लिए आप पास के शहर या कस्बे जा सकते हैं?",
    VARIATIONS_DIR / "q6_mobility_driving_hi.wav": "ड्राइविंग एक बेहतरीन पेशा है! क्या काम के सिलसिले में आप बाहर यात्रा कर सकते हैं?",
    VARIATIONS_DIR / "q6_mobility_gen_hi.wav": "अच्छा! क्या काम के लिए आप अपने गांव से बाहर या पास के शहर जा सकते हैं?",
    # Q7 Preference
    VARIATIONS_DIR / "q7_pref_v1_hi.wav": "बहुत बढ़िया! आप खुद का कोई छोटा व्यवसाय या दुकान शुरू करना चाहते हैं, या मासिक वेतन वाली नौकरी?",
    VARIATIONS_DIR / "q7_pref_v2_hi.wav": "सरकारी सहायता के लिए, आपकी अपनी दुकान शुरू करने में रुचि है या किसी कंपनी में नौकरी करने में?",
    # Q8 Economic Context
    VARIATIONS_DIR / "q8_context_business_hi.wav": "आपके नए उद्यम के लिए शुभकामनाएं! आपके गांव या इलाके में कौन-सी दुकानें या बाजार हैं?",
    VARIATIONS_DIR / "q8_context_gen_hi.wav": "अच्छा! आपके गांव या आसपास रोजगार के क्या अवसर और बाजार उपलब्ध हैं?",
    # Wrap-up
    VARIATIONS_DIR / "q_wrapup_v2_hi.wav": "बहुत-बहुत धन्यवाद! आपकी सभी जानकारी सफलतापूर्वक दर्ज कर ली गई है। आपका दिन शुभ हो!",
    # Apologies / Clarification
    VARIATIONS_DIR / "sorry_unclear_hi.wav": "माफ़ कीजिए, आपकी आवाज स्पष्ट नहीं आई। क्या आप दोबारा कह सकते हैं?",
    VARIATIONS_DIR / "sorry_repeat_hi.wav": "माफ़ कीजिए, कृपया एक बार फिर से बोलिए?",
}

TELUGU_PROMPTS = {
    # Consent
    OUTPUT_DIR / "consent_te.wav": "నమస్కారం! నేను కురల్ సేవి. PM-AJAY ప్రభుత్వ సంక్షేమ పథకం వివరాల కోసం కాల్ చేస్తున్నాను. మాట్లాడవచ్చా అండీ?",
    # Reprompt
    VARIATIONS_DIR / "intro_reprompt_te.wav": "నమస్కారం, నేను మాట్లాడేది వినిపిస్తోందా అండీ? మాట్లాడవచ్చా?",
    # Q1 Name & Village
    VARIATIONS_DIR / "q1_name_village_te.wav": "చాలా ధన్యవాదాలు అండీ! ముందుగా మీ పేరు మరియు మీ ఊరు ఏదో చెబుతారా?",
    # Q2 Education
    VARIATIONS_DIR / "q2_education_v1_te.wav": "చాలా సంతోషం అండీ! మీ చదువు వివరాలు చెప్పండి, బడికి వెళ్లారా?",
    VARIATIONS_DIR / "q2_education_v2_te.wav": "బాగుంది అండీ! మీ చదువు ఎంతవరకు సాగింది, పాఠశాలకు వెళ్లారా?",
    # Q3 Family Occupation
    VARIATIONS_DIR / "q3_family_occ_v1_te.wav": "మంచిదండీ! మీ కుటుంబంలో సాధారణంగా లేదా సంప్రదాయకంగా ఏ వృత్తి చేస్తారు?",
    VARIATIONS_DIR / "q3_family_occ_v2_te.wav": "సరేనండీ! మీ కుటుంబం యొక్క ప్రధాన వృత్తి లేదా పని ఏమిటి?",
    # Q4 Current Work
    VARIATIONS_DIR / "q4_current_work_farming_te.wav": "వ్యవసాయం చేయడం ఎంతో గొప్ప విషయం అండీ! వ్యవసాయంతో పాటు ప్రస్తుతం మీ రోజువారీ ఆదాయానికి ఏం పని చేస్తున్నారు?",
    VARIATIONS_DIR / "q4_current_work_gen_te.wav": "చాలా మంచిది అండీ! ప్రస్తుతం మీ రోజువారీ జీవనాధారం కోసం ఏ పని చేస్తున్నారు?",
    # Q5 Skills
    VARIATIONS_DIR / "q5_skills_v1_te.wav": "ప్రభుత్వ నైపుణ్య శిక్షణ కోసం, మీకు ఏయే వృత్తి నైపుణ్యాలు లేదా ఆసక్తులు ఉన్నాయి?",
    VARIATIONS_DIR / "q5_skills_v2_te.wav": "చాలా సంతోషం అండీ! స్వయంగా ఏదైనా పని చేయడానికి మీకు ఏ నైపుణ్యం ఉంది?",
    # Q6 Mobility
    VARIATIONS_DIR / "q6_mobility_cooking_te.wav": "వంట పని ఎంతో గొప్ప నైపుణ్యం అండీ! పని కోసం పక్క ఊర్లకు లేదా పట్టణాలకు వెళ్లగలరా?",
    VARIATIONS_DIR / "q6_mobility_driving_te.wav": "డ్రైవింగ్ మంచి వృత్తి అండీ! పని కోసం బయటి ప్రాంతాలకు ప్రయాణం చేయగలరా?",
    VARIATIONS_DIR / "q6_mobility_gen_te.wav": "సరేనండీ! పని కోసం బయటి ఊర్లకు లేదా పట్టణాలకు ప్రయాణం చేయగలరా?",
    # Q7 Preference
    VARIATIONS_DIR / "q7_pref_v1_te.wav": "చాలా మంచిది అండీ! మీకు సొంతంగా వ్యాపారం లేదా దుకాణం పెట్టడం ఇష్టమా, లేక నెల జీతం ఉద్యోగమా?",
    VARIATIONS_DIR / "q7_pref_v2_te.wav": "ప్రభుత్వ సహాయం కోసం, మీకు సొంత వ్యాపారం మొదలుపెట్టాలని ఉందా లేదా కంపెనీలో ఉద్యోగమా?",
    # Q8 Economic Context
    VARIATIONS_DIR / "q8_context_business_te.wav": "మీ సొంత వ్యాపార ప్రయత్నాలకు శుభాకాంక్షలు అండీ! మీ ఊర్లో ఎలాంటి దుకాణాలు లేదా మార్కెట్ ఉన్నాయి?",
    VARIATIONS_DIR / "q8_context_gen_te.wav": "బాగుంది అండీ! మీ ఊర్లో ఉపాధి అవకాశాలు, దుకాణాలు ఎలా ఉన్నాయి?",
    # Wrap-up
    VARIATIONS_DIR / "q_wrapup_v2_te.wav": "చాలా ధన్యవాదాలు అండీ! మీ వివరాలన్నీ విజయవంతంగా నమోదు చేయబడ్డాయి. శుభదినం!",
    # Apologies / Clarification
    VARIATIONS_DIR / "sorry_unclear_te.wav": "క్షమించండి, మీ స్వరం స్పష్టంగా వినిపించలేదు. దయచేసి మళ్ళీ చెబుతారా?",
    VARIATIONS_DIR / "sorry_repeat_te.wav": "క్షమించండి, మరొక్కసారి స్పష్టంగా చెప్పగలరా?",
}

async def generate_file(voice: str, text: str, output_path: Path):
    tmp_mp3 = output_path.with_suffix(".mp3")
    comm = edge_tts.Communicate(text, voice)
    await comm.save(str(tmp_mp3))
    cmd = [
        "ffmpeg", "-y", "-i", str(tmp_mp3),
        "-ar", "8000", "-ac", "1", "-acodec", "pcm_s16le",
        str(output_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if tmp_mp3.exists():
        tmp_mp3.unlink()
    print(f"Generated: {output_path.name} ({output_path.stat().st_size} bytes)")

async def main():
    print("=== Generating Hindi (SwaraNeural) Telephony Assets ===")
    for path, text in HINDI_PROMPTS.items():
        await generate_file("hi-IN-SwaraNeural", text, path)
        
    print("\n=== Generating Telugu (ShrutiNeural) Telephony Assets ===")
    for path, text in TELUGU_PROMPTS.items():
        await generate_file("te-IN-ShrutiNeural", text, path)

if __name__ == "__main__":
    asyncio.run(main())
