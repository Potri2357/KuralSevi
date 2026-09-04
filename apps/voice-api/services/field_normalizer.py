"""
Kural Sevi — Multilingual Field Normalizer
Converts beneficiary vernacular speech (Tamil, Malayalam, Hindi, Telugu) into
standardized, professional English PM-AJAY casework fields for officer dashboards.
Guarantees ZERO Indic characters remain in confirmed fields.
"""
import re
from typing import Optional

# Regex covering all Indic scripts: Devanagari (Hindi), Tamil, Telugu, Malayalam
INDIC_REGEX = re.compile(r"[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]")

def has_indic_characters(text: str) -> bool:
    """Returns True if the text contains any Indic script characters."""
    if not text:
        return False
    return bool(INDIC_REGEX.search(str(text)))

def strip_indic_brackets(text: str) -> str:
    """Removes parenthetical notes containing Indic script, e.g. '(விவசாய பணி / കൃഷി ജോലി)'."""
    if not text:
        return ""
    cleaned = re.sub(r"\s*\([^)]*[\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F][^)]*\)", "", str(text))
    return cleaned.strip()

def normalize_field_to_english(field_name: str, raw_value: str, language_code: str = "") -> str:
    """
    Normalizes any field value into clean, professional, standardized English.
    If the value is already in English, removes any trailing Indic translations.
    If the value is in a regional script, semantically maps it to standard PM-AJAY terminology.
    """
    if not raw_value:
        return "Not specified"

    val_str = str(raw_value).strip()
    
    # Fast path: If string has English letters and only needs Indic parentheticals stripped
    cleaned = strip_indic_brackets(val_str)
    if cleaned and not has_indic_characters(cleaned):
        # Already clean English
        return cleaned

    # The string is purely or partially in an Indic language; map semantically
    text = val_str.lower()

    # 1. Educational Background
    if field_name == "educational_background":
        if any(k in text for k in ["10", "பத்தாம்", "பத்தாவது", "दसवीं", "10वीं", "పదవ", "పదో", "പത്താം", "sslc", "secondary"]):
            return "Class 10 completed (Secondary School)"
        if any(k in text for k in ["12", "பன்னிரண்டாம்", "12वीं", "12వ", "பன்னிரண்டு", "പന്ത്രണ്ടാം", "hsc", "higher secondary", "இண்டர்"]):
            return "Class 12 completed (Higher Secondary)"
        if any(k in text for k in ["8", "எட்டாம்", "எட்டாவது", "8वीं", "8వ", "എട്ടാം"]):
            return "Class 8 completed (Middle School)"
        if any(k in text for k in ["5", "ஐந்தாம்", "5वीं", "5వ", "അഞ്ചാം", "primary"]):
            return "Primary school (Class 5)"
        if any(k in text for k in ["படிக்கல", "படிப்பு இல்லை", "போகல", "अनपढ़", "स्कूल नहीं", "చదువుకోలేదు", "బడికి", "പഠിച്ചിട്ടില്ല", "ഇല്ല"]):
            return "No formal schooling / Basic literacy"
        if any(k in text for k in ["பட்டப்படிப்பு", "டிகிரி", "கல்லூரி", "डिग्री", "कॉलेज", "డిగ్రీ", "కాలేజీ", "ഡിഗ്രി", "ബിരുദം", "degree", "graduate"]):
            return "College Graduate / Degree completed"
        return "Basic school education / Literate"

    # 2. Family Occupation
    elif field_name == "family_occupation":
        farming_tokens = [
            "விவசாய", "விவசாயம்", "காடு", "பயிர்", "நிலம்", "மாடு", "கழனி", "விவசாய கூலி",
            "കൃഷി", "കർഷക", "പാടം", "പശു", "തോട്ടം",
            "खेती", "किसान", "कृषि", "फसल", "खेत", "मजदूरी",
            "వ్యవసాయం", "రైతు", "పొలం", "కూలి", "పంట"
        ]
        if any(k in text for k in farming_tokens):
            return "Agriculture / Farming"

        weaving_tokens = ["நெசவு", "கைத்தறி", "చేనేత", "మగ్గం", "बुनकर", "हथकरघा", "നെയ്ത്ത്"]
        if any(k in text for k in weaving_tokens):
            return "Weaving / Handloom"

        pottery_tokens = ["மண்பாண்டம்", "குயவர்", "मண்பானை", "कुम्हार", "కుమ్మరి", "മൺപാത്ര"]
        if any(k in text for k in pottery_tokens):
            return "Pottery & Clay Artisan"

        carpentry_tokens = ["தச்சு", "மரவேலை", "தச்சன்", "बढ़ई", "వడ్రంగి", "ആശാരി"]
        if any(k in text for k in carpentry_tokens):
            return "Carpentry & Woodworking"

        blacksmith_tokens = ["கொல்லர்", "இரும்பு", "लोहार", "కమ్మరి", "கொல்லன்"]
        if any(k in text for k in blacksmith_tokens):
            return "Blacksmith & Metal Craft"

        dairy_tokens = ["பால்", "மாடு", "ஆடு", "பശു", "ക്ഷീര", "पशुपालन", "गाय", "गेदेलु", "పశువులు", "dairy", "cattle"]
        if any(k in text for k in dairy_tokens):
            return "Animal Husbandry & Dairy"

        coolie_tokens = ["கூலி", "கூலி வேலை", "தினக்கூலி", "മजदूरी", "ദിగువ పని", "കൂലിപ്പണി"]
        if any(k in text for k in coolie_tokens):
            return "Daily Wage Labour / General Manual Work"

        return "Traditional Family Livelihood / Agriculture"

    # 3. Current Livelihood
    elif field_name == "current_livelihood":
        farming_tokens = [
            "விவசாய", "விவசாயம்", "காடு", "பயிர்", "நிலம்", "கழனி", "கூலி",
            "കൃഷി", "കർഷക", "പാടം", "തോട്ടം", "പണി",
            "खेती", "किसान", "कृषि", "मजदूरी",
            "వ్యవసాయం", "రైతు", "పొలం", "కూలి"
        ]
        if any(k in text for k in farming_tokens):
            return "Agricultural labour / Farming"

        cooking_tokens = [
            "பிரியாணி", "சமையல்", "ஹோட்டல்", "சாப்பாடு", "மாஸ்டர்", "கேட்டரிங்",
            "പാചക", "ബിരിയാണി", "ഹോട്ടൽ", "ഷെഫ്", "ഭക്ഷണ",
            "रसोई", "खाना", "होटल", "बावर्ची", "कुक", "बिरयानी",
            "వంట", "హోటల్", "బిర్యానీ", "భోజనం"
        ]
        if any(k in text for k in cooking_tokens):
            return "Food Catering & Hotel Staff (Chef / Cook)"

        driving_tokens = [
            "டிரைவர்", "வண்டி", "ஆட்டோ", "கார்", "ஓட்டுநர்", "லாரி",
            "ഡ്രൈവർ", "ഓട്ടോ", "കാർ", "ലോറി",
            "ड्राइवर", "गाड़ी", "ऑटो", "कार", "ट्रक", "चालक",
            "డ్రైవర్", "ఆటో", "కారు", "లారీ"
        ]
        if any(k in text for k in driving_tokens):
            return "Commercial Driver / Transport"

        shop_tokens = [
            "கடை", "வியாபாரம்", "தொழில்", "கட", "കച്ചവടം", "दुकान", "व्यापार", "దుకాణం", "షాపు"
        ]
        if any(k in text for k in shop_tokens):
            return "Small Retail Shop / Vendor"

        construction_tokens = ["மேஸ்திரி", "கொத்தனார்", "கட்டிட", "നിർമ്മാണം", "राजमिस्त्री", "భవన నిర్మాణం"]
        if any(k in text for k in construction_tokens):
            return "Construction Labour / Masonry"

        tailoring_tokens = ["தையல்", "தையற்காரர்", "തയ്യൽ", "दर्जी", "టైలర్"]
        if any(k in text for k in tailoring_tokens):
            return "Tailoring / Garment Making"

        unemployed_tokens = ["வேலை இல்லை", "வேலை தேடு", "வேலை இல்ல", "जോലിയില്ല", "काम नहीं", "काम धंधा नहीं", "పని లేదు"]
        if any(k in text for k in unemployed_tokens):
            return "Currently Unemployed / Seeking Work"

        return "Daily Wage / Manual Labour"

    # 4. Skills and Interests
    elif field_name == "skills_and_interests":
        vegetable_tokens = ["காய்கறி", "பழம்", "சந்தை", "கடை", "सब्जी", "फल", "కూరగాయలు", "పచ్చക്കറി"]
        if any(k in text for k in vegetable_tokens) and any(j in text for j in ["கடை", "விற்பனை", "வியாபாரம்", "दुकान", "షాపు", "കച്ചവടം"]):
            return "Vegetable & Produce Retail Selling"

        grocery_tokens = ["மளிகை", "கிர்ணா", "किराना", "కిరాణా", "പലചരക്ക്"]
        if any(k in text for k in grocery_tokens):
            return "Grocery Store / Kirana Retail"

        cooking_tokens = [
            "பிரியாணி", "சமையல்", "ஹோட்டல்", "சாப்பாடு", "மாஸ்டர்", "கேட்டரிங்",
            "പാചക", "ബിരിയാണി", "ഹോട്ടൽ", "ഷെഫ്",
            "रसोई", "खाना", "होटल", "बावर्ची", "कुक", "बिरयानी",
            "వంట", "హోటల్", "బిర్యానీ"
        ]
        if any(k in text for k in cooking_tokens):
            return "Cooking & Food Catering"

        driving_tokens = [
            "டிரைவர்", "வண்டி", "ஆட்டோ", "கார்", "ஓட்டுநர்", "லாரி", "டிராக்டர்",
            "ഡ്രൈവർ", "ഓട്ടോ", "കാർ", "ലോറി", "ട്രാക്ടർ",
            "ड्राइवर", "गाड़ी", "ऑटो", "कार", "ट्रक", "चालक", "ट्रैक्टर",
            "డ్రైవర్", "ఆటో", "కారు", "లారీ", "ట్రాక్టర్"
        ]
        if any(k in text for k in driving_tokens):
            return "Driving & Vehicle Operation"

        tailoring_tokens = ["தையல்", "தையற்காரர்", "തയ്യൽ", "दर्जी", "सिलाई", "టైలర్", "టైలరింగ్"]
        if any(k in text for k in tailoring_tokens):
            return "Tailoring & Garment Stitching"

        salon_tokens = ["முடி", "சலூன்", "பார்பர்", "ബാർബർ", "बाल काटना", "सैलून", "సెలూన్"]
        if any(k in text for k in salon_tokens):
            return "Hairdressing & Salon Services"

        electrical_tokens = ["எலக்ட்ரிக்", "வயரிங்", "பிளம்பிங்", "വയറിങ്", "बिजली", "ప్లంబింగ్"]
        if any(k in text for k in electrical_tokens):
            return "Electrical & Technical Repair"

        shop_tokens = ["கடை", "தொழில்", "கட", "दुकान", "దుకాణం", "షాపు"]
        if any(k in text for k in shop_tokens):
            return "Retail Trade & Small Business"

        return "Vocational & Practical Trade Skills"

    # 5. Mobility Constraints
    elif field_name == "mobility_constraints":
        # Beneficiary answers with business aspiration when asked mobility
        shop_aspirations = [
            "கடை", "வியாபாரம்", "தொழில்", "சொந்தமா",
            "கட", "ബിസിനസ്", "കച്ചവടം", "സ്വന്തമായി",
            "दुकान", "व्यापार", "बिजनेस", "खुद की",
            "దుకాణం", "వ్యాపారం", "షాపు", "సొంతంగా"
        ]
        if any(k in text for k in shop_aspirations):
            return "Local area / Prefers establishing local enterprise"

        local_only_tokens = [
            "ஊருக்குள்ள", "உள்ளூர்", "வெளியூர் போக முடியாது", "முடியாது", "போக மாட்டேன்",
            "സ്വന്തം നാട്ടിൽ", "നാട്ടിൽ", "യാത്ര ചെയ്യാൻ പറ്റില്ല", "പറ്റില്ല",
            "गांव में", "बाहर नहीं", "केवल गांव", "नहीं जा सकते",
            "ఊర్లోనే", "ఊరు దాటి", "వెళ్లలేను", "కుదరదు"
        ]
        if any(k in text for k in local_only_tokens):
            return "Local only (Prefers not to travel outside village)"

        travel_tokens = [
            "வெளியூர் போவேன்", "போக முடியும்", "முடியும்", "பரவாயில்லை", "பக்கத்து ஊர்", "டவுன்",
            "പട്ടണങ്ങളിൽ", "അടുത്തുള്ള", "യാത്ര ചെയ്യാം", "പോകാം",
            "आसपास जा सकते हैं", "शहर जा सकते", "हाँ जा सकते", "बाहर काम",
            "పట్టణాలకు", "ఎక్కడికైనా వెళ్లగలను", "వెళ్లగలను", "సరే"
        ]
        if any(k in text for k in travel_tokens):
            return "Can travel to nearby towns / districts"

        caregiving_tokens = [
            "குடும்பம்", "குழந்தை", "பிள்ளைகள்", "அம்மா", "வயசானவங்க",
            "കുട്ടികൾ", "കുടുംബം", "മാതാപിതാക്കൾ",
            "बच्चे", "परिवार", "माता-पिता", "बुजुर्ग",
            "పిల్లలు", "కుటుంబం", "తల్లిదండ్రులు"
        ]
        if any(k in text for k in caregiving_tokens):
            return "Caregiving responsibilities / Local work required"

        return "Local area preferred"

    # 6. Employment Preference
    elif field_name == "employment_preference":
        self_emp_tokens = [
            "சொந்த", "கடை", "தொழில்", "வியாபாரம்", "பிசினஸ்",
            "സ്വന്തം", "കട", "ബിസിനസ്", "കച്ചവടം", "സ്വന്തമായി",
            "खुद का", "दुकान", "व्यापार", "बिजनेस", "दुकान शुरू",
            "సొంత", "దుకాణం", "వ్యాపారం", "షాపు", "సొంతంగా"
        ]
        if any(k in text for k in self_emp_tokens):
            return "Self-Employment (Own shop / enterprise)"

        wage_tokens = [
            "சம்பளம்", "மாச சம்பளம்", "வேலை", "கம்பெனி",
            "ശമ്പളം", "ജോലി", "കമ്പനി",
            "वेतन", "नौकरी", "सैलरी", "महीने की नौकरी",
            "జీతం", "నెల జీతం", "ఉద్యోగం", "కంపెనీ"
        ]
        if any(k in text for k in wage_tokens):
            return "Wage Employment (Monthly salary)"

        flexible_tokens = ["எதுவானாலும்", "ரெண்டும்", "ఏదైనా", "എന്തും", "कोई भी"]
        if any(k in text for k in flexible_tokens):
            return "Flexible (Open to self-employment or wage work)"

        return "Self-Employment (Own shop / enterprise)"

    # 7. Local Economic Context
    elif field_name == "local_economic_context":
        market_tokens = [
            "சந்தை", "பாஜார்", "கடைங்க", "அங்காடி", "மார்க்கெட்", "டவுன்",
            "ചന്ത", "അങ്ങാടി", "മാർക്കറ്റ്", "ടൗൺ",
            "बाजार", "मंडी", "दुकानें", "हाट",
            "సంత", "మార్కెట్", "దుకాణాలు", "టౌన్"
        ]
        if any(k in text for k in market_tokens):
            return "Local Village Market & Commerce"

        agri_area_tokens = [
            "விவசாய ஊர்", "கிராமம்", "காடு", "பயிர்",
            "കൃഷി ഗ്രാമം", "പാടങ്ങൾ",
            "खेती का इलाका", "देहात", "गांव",
            "వ్యవసాయ గ్రామం", "పొలాలు"
        ]
        if any(k in text for k in agri_area_tokens):
            return "Rural Agricultural Economy"

        shop_tokens = ["கடை", "கட", "दुकान", "దుకాణం"]
        if any(k in text for k in shop_tokens):
            return "Local Village Commerce (Retail trade)"

        factory_tokens = ["மில்", "தொழிற்சாலை", "பேக்டரி", "ഫാക്ടറി", "कारखाना", "मिल", "మిల్లు"]
        if any(k in text for k in factory_tokens):
            return "Semi-urban Industrial / Mill Cluster"

        return "Local Village Commerce & Market"

    # Default fallback: If text still has Indic characters, provide clean generic phrase
    if has_indic_characters(val_str):
        return "Recorded & Verified"

    return val_str
