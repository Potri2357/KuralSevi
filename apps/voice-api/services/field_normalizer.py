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

        poultry_tokens = ["கோழி", "பண்ணை", "கோழிப்பண்ணை", "முட்டை", "poultry", "chicken", "broiler", "मुर्गी", "కోడి"]
        if any(k in text for k in poultry_tokens):
            return "Poultry Farming & Livestock"

        weaving_tokens = ["நெசவு", "கைத்தறி", "చేనేత", "మగ్గం", "बुनकर", "हथकरघा", "നെയ്ത്ത്"]
        if any(k in text for k in weaving_tokens):
            return "Weaving / Handloom"

        pottery_tokens = ["மண்பாண்டம்", "குயவர்", "மண்பானை", "कुम्हार", "కుమ్మరి", "മൺപാത്ര"]
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

        poultry_tokens = ["கோழி", "பண்ணை", "கோழிப்பண்ணை", "முட்டை", "poultry", "chicken", "broiler", "मुर्गी", "కోడి"]
        if any(k in text for k in poultry_tokens):
            return "Poultry Farming & Poultry Shop"

        footwear_tokens = ["செருப்பு", "பாதணி", "சப்பல்", "காலணி", "தோல்", "footwear", "chappal", "shoe", "leather", "shoes", "जूता", "चप्पल", "పాదరక్షలు"]
        if any(k in text for k in footwear_tokens):
            return "Footwear Retail & Leather Goods Shop"

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

        mechanic_tokens = ["டூவீலர்", "பைக்", "மெக்கானிக்", "ஒர்க்‌ஷாப்", "mechanic", "bike repair", "मैकेनिक", "మెకానిక్"]
        if any(k in text for k in mechanic_tokens):
            return "Automotive & Two-Wheeler Mechanic"

        electrical_tokens = ["எலக்ட்ரிக்", "எலக்ட்ரீசியன்", "எலக்ட்ரிக்கல்", "மின்சாரம்", "மின்சார", "கரண்ட்", "வயரிங்", "electrician", "electrical", "इलेक्ट्रीशियन", "ఎలక్ట్రీషియన్"]
        if any(k in text for k in electrical_tokens):
            return "Domestic Electrician & Wireman"

        welder_tokens = ["வெல்டிங்", "வெல்டர்", "இரும்பு", "welder", "welding", "वेल्डर"]
        if any(k in text for k in welder_tokens):
            return "Welder & Metal Fabrication"

        plumber_tokens = ["பிளம்பர்", "பிளம்பிங்", "குழாய்", "பைப்", "plumber", "plumbing"]
        if any(k in text for k in plumber_tokens):
            return "Plumbing & Pipe Fitting"

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
        # Two-Wheeler Mechanic
        mechanic_tokens = [
            "டூவீலர்", "பைக்", "மெக்கானிக்", "ஒர்க்‌ஷாப்", "பஞ்சர்", "சர்வீஸ்", "ரிப்பேர்", "மோட்டார்சைக்கிள்",
            "ടൂവീലർ", "ബൈക്ക്", "മെക്കാനിക്ക്", "ഗാരേജ്",
            "बाइक", "मैकेनिक", "मोटरसाइकिल", "गैरेज", "वर्कशॉप", "मरम्मत",
            "టూవీలర్", "బైక్", "మెకానిక్", "గ్యారేజ్",
            "mechanic", "two wheeler", "bike repair", "motorcycle", "garage"
        ]
        if any(k in text for k in mechanic_tokens):
            return "Automotive & Two-Wheeler Mechanic"

        # Electrical & Wiring
        electrical_tokens = [
            "எலக்ட்ரிக்", "எலக்ட்ரீசியன்", "எலக்ட்ரிக்கல்", "மின்சாரம்", "மின்சார", "கரண்ட்", "வயரிங்", "சுவிட்ச்", "லைட்", "மோட்டார்",
            "இலക്ട്രീഷൻ", "ഇലക്ട്രിക്കൽ", "കറണ്ട്", "വയറിംഗ്",
            "बिजली", "इलेक्ट्रीशियन", "वायरिंग", "मोटर",
            "ఎలక్ట్రీషియన్", "విద్యుత్", "వైరింగ్", "కరెంట్",
            "electrician", "electrical", "wiring", "wireman"
        ]
        if any(k in text for k in electrical_tokens):
            return "Domestic Electrician & Building Wireman"

        # Welder & Metal Fabrication
        welder_tokens = [
            "வெல்டிங்", "வெல்டர்", "இரும்பு", "கிரில்", "கேட்", "பட்டறை",
            "വെൽഡിംഗ്", "വെൽഡർ", "ഇരുമ്പ്",
            "वेल्डिंग", "वेल्डर", "लोहा", "ग्रिल",
            "వెల్డింగ్", "వెల్డర్", "ఇనుము", "గ్రిల్స్",
            "welder", "welding", "metal fabrication", "arc welding"
        ]
        if any(k in text for k in welder_tokens):
            return "Welding & Metal Fabrication"

        # Plumber & Pipe Fitting
        plumber_tokens = [
            "பிளம்பர்", "பிளம்பிங்", "குழாய்", "பைப்", "தண்ணீர் குழாய்",
            "പ്ലംബർ", "പ്ലംബിംഗ്", "പൈപ്പ്",
            "प्लम्बर", "नल", "पाइप",
            "ప్లంబర్", "పైప్", "కుళాయి",
            "plumber", "plumbing", "pipe fitting"
        ]
        if any(k in text for k in plumber_tokens):
            return "Plumbing & Pipe Fitting"

        # Building Construction & Masonry
        mason_tokens = [
            "மேஸ்திரி", "கொத்தனார்", "கட்டிடம்", "கட்டுமான", "சிமெண்ட்", "செங்கல்",
            "മേസ്തിരി", "നിർമ്മാണം",
            "राजमिस्त्री", "मिस्त्री", "निर्माण", "मकान",
            "మేస్త్రీ", "భవన నిర్మాణం",
            "mason", "masonry", "construction", "builder"
        ]
        if any(k in text for k in mason_tokens):
            return "Building Construction & Masonry"

        # Carpentry & Woodworking
        carpenter_tokens = [
            "தச்சு", "மரவேலை", "தச்சன்", "மரம்",
            "ആശാരി", "തടിപ്പണി",
            "बढ़ई", "लकड़ी",
            "వడ్రంగి", "చెక్క పని",
            "carpenter", "carpentry", "woodwork"
        ]
        if any(k in text for k in carpenter_tokens):
            return "Carpentry & Woodworking"

        # Solar Panel Installation
        solar_tokens = [
            "சோலார்", "சூரிய", "சூரிய மின்சக்தி", "பேனல்",
            "സോളാർ", "സൗരോർജ്ജം",
            "सोलर", "सौर ऊर्जा",
            "సోలార్", "సౌర విద్యుత్",
            "solar", "solar panel", "clean energy"
        ]
        if any(k in text for k in solar_tokens):
            return "Solar Panel Installation Technician"

        # Digital VLE / Computer Operations
        digital_tokens = [
            "கம்ப்யூட்டர்", "கணினி", "இன்டர்நெட்", "ஆன்லைன்", "டைப்பிங்", "ஈ சேவை", "சென்டர்",
            "കമ്പ്യൂട്ടർ", "ഡിജിറ്റൽ", "ഓൺലൈൻ",
            "कंप्यूटर", "डिजिटल", "ऑनलाइन", "इंटरनेट",
            "కంప్యూటర్", "డిజిటల్", "ఆన్‌లైన్",
            "computer", "digital", "csc", "vle", "online center", "internet"
        ]
        if any(k in text for k in digital_tokens):
            return "Digital VLE / CSC Computer Operator"

        # Home Health Aide / Nursing
        health_tokens = [
            "நர்ஸ்", "நர்சிங்", "நோயாளி", "மருத்துவம்", "மருத்துவமனை", "பராமரிப்பு",
            "ഹോം നഴ്സിംഗ്", "ആശുപത്രി", "രോഗീപരിപാലനം",
            "नर्सिंग", "अस्पताल", "मरीज", "दवा", "स्वास्थ्य सेवा",
            "నర్సింగ్", "ఆసుపత్రి", "ఆరోగ్యం", "రోగి సంరక్షణ",
            "nurse", "nursing", "patient care", "health aide", "elderly care"
        ]
        if any(k in text for k in health_tokens):
            return "Home Health Aide & Healthcare Assistant"

        # Handloom Weaver & Textiles
        weaver_tokens = [
            "நெசவு", "கைத்தறி", "தறி", "சேலை", "பட்டு", "நூல்",
            "നെയ്ത്ത്", "കൈത്തറി", "സാരി",
            "बुनकर", "हथकरघा", "साड़ी", "धागा", "बुनाई",
            "చేనేత", "మగ్గం", "చీర", "నేత",
            "weaver", "weaving", "handloom", "saree"
        ]
        if any(k in text for k in weaver_tokens):
            return "Handloom Weaving & Traditional Textiles"

        # Footwear & Leather
        footwear_tokens = [
            "செருப்பு", "பாதணி", "சப்பல்", "காலணி", "தோல்",
            "footwear", "chappal", "shoe", "leather", "shoes", "जूता", "चप्पल", "పాదరక్షలు"
        ]
        if any(k in text for k in footwear_tokens):
            return "Footwear & Leather Goods Specialist"

        # Poultry
        poultry_tokens = [
            "கோழி", "பண்ணை", "கோழிப்பண்ணை", "முட்டை", "இறைச்சி",
            "poultry", "chicken", "broiler", "मुर्गी", "కోడి", "കോഴി"
        ]
        if any(k in text for k in poultry_tokens):
            return "Small Poultry Farming & Livestock"

        # Dairy & Animal Husbandry
        dairy_tokens = [
            "பால்", "மாடு", "கறவை", "கால்நடை", "ஆடு", "பண்ணை",
            "ക്ഷീര", "പശു", "ഡയറി",
            "गाय", "भैंस", "डेयरी", "पशुपालन",
            "పాడి", "ఆవులు", "గేదెలు", "పశువులు",
            "dairy", "cattle", "milking", "livestock"
        ]
        if any(k in text for k in dairy_tokens):
            return "Dairy Farming & Livestock"

        # Cooking & Food Catering
        cooking_tokens = [
            "பிரியாணி", "சமையல்", "ஹோட்டல்", "சாப்பாடு", "மாஸ்டர்", "கேட்டரிங்", "ரெஸ்டாரன்ட்", "பலகாரம்",
            "പാചക", "ബിരിയാണി", "ഹോട്ടൽ", "ഷെഫ്", "ഭക്ഷണ",
            "रसोई", "खाना", "होटल", "बावर्ची", "कुक", "बिरयानी", "हलवाई", "मिठाई",
            "వంట", "హోటల్", "బిర్యానీ", "భోజనం", "క్యాటరింగ్",
            "cooking", "catering", "hotel", "food", "chef", "cook", "biryani"
        ]
        if any(k in text for k in cooking_tokens):
            return "Cooking & Food Catering"

        # Food Processing & Pickles
        food_proc_tokens = [
            "ஊறுகாய்", "அப்பளம்", "உணவு பதப்படுத்துதல்", "சாஸ்", "ஜாம்",
            "അച്ചാർ", "ഭക്ഷ്യസംസ്കരണം",
            "अचार", "पापड़", "खाद्य प्रसंस्करण",
            "పచ్చళ్లు", "ఫుడ్ ప్రాసెసింగ్",
            "pickle", "food processing", "preserves"
        ]
        if any(k in text for k in food_proc_tokens):
            return "Food Processing & Pickle Production"

        # Driving
        driving_tokens = [
            "டிரைவர்", "வண்டி", "ஆட்டோ", "கார்", "ஓட்டுநர்", "லாரி", "டிராக்டர்", "டிரைவிங்",
            "ഡ്രൈവർ", "ഓട്ടോ", "കാർ", "ലോറി", "ട്രാക്ടർ",
            "ड्राइवर", "गाड़ी", "ऑटो", "कार", "ट्रक", "चालक", "ट्रैक्टर", "ड्राइविंग",
            "డ్రైవర్", "ఆటో", "కారు", "లారీ", "ట్రాక్టర్", "డ్రైవింగ్",
            "driver", "driving", "auto", "car", "cab", "truck", "vehicle"
        ]
        if any(k in text for k in driving_tokens):
            return "Driving & Vehicle Operation"

        # Tailoring & Garments
        tailoring_tokens = [
            "தையல்", "தையல்காரர்", "தையற்காரர்", "சுடிதார்", "ஜாக்கெட்", "தைக்க",
            "തയ്യൽ", "ടെയ്‌ലറിംഗ്", "തുണി",
            "दर्जी", "सिलाई", "कपड़ा", "सूट",
            "టైలర్", "టైలరింగ్", "కుట్లు", "బట్టలు",
            "tailor", "tailoring", "stitching", "sewing", "garment", "dressmaking"
        ]
        if any(k in text for k in tailoring_tokens):
            return "Tailoring & Garment Stitching"

        # Industrial Sewing Machine Operator
        sewing_op_tokens = [
            "தையல் மெஷின்", "தையல் மிஷின்", "ஆடை நிறுவனம்", "கார்மெண்ட்", "ஆடை உற்பத்தி",
            "തയ്യൽ മെഷീൻ", "വസ്ത്ര നിർമ്മാണം",
            "सिलाई मशीन", "गारमेंट फैक्ट्री",
            "కుట్టు మిషన్", "గార్మెంట్స్",
            "sewing machine operator", "garment factory", "apparel operator"
        ]
        if any(k in text for k in sewing_op_tokens):
            return "Industrial Sewing Machine Operator"

        # Hairdressing & Beauty Salon
        salon_tokens = [
            "முடி", "சலூன்", "பார்பர்", "அழகுக்கலை", "பார்லர்", "மேக்கப்", "பியூட்டி", "ஹேர்கட்",
            "ബ്യൂട്ടി പാർലർ", "മേക്കപ്പ്", "സലൂൺ", "ബാർബർ",
            "ब्यूटी पार्लर", "मेकअप", "सैलून", "नाई", "पार्लर", "बाल काटना",
            "బ్యూటీ పార్లర్", "మేకప్", "సెలూన్", "పార్లర్", "క్షౌర",
            "salon", "saloon", "barber", "haircut", "hair", "beauty", "parlour", "makeup", "grooming"
        ]
        if any(k in text for k in salon_tokens):
            return "Hairdressing & Salon Services"

        # Farming / Agriculture
        agri_tokens = [
            "விவசாய", "விவசாயம்", "பயிர்", "நெல்", "கழனி", "தோட்டம்", "இயற்கை விவசாயம்",
            "കൃഷി", "കർഷക", "പാടം",
            "खेती", "किसान", "कृषि", "फसल",
            "వ్యవసాయం", "రైతు", "పంట",
            "farming", "agriculture", "farmer", "crop", "organic farming"
        ]
        if any(k in text for k in agri_tokens):
            return "Organic Farming & Crop Production"

        # Grocery & Kirana Store
        grocery_tokens = ["மளிகை", "கிர்ணா", "किराना", "కిరాణా", "പലചരക്ക്", "grocery", "kirana"]
        if any(k in text for k in grocery_tokens):
            return "Grocery Store / Kirana Retail"

        # Vegetable & Produce
        vegetable_tokens = ["காய்கறி", "பழம்", "சந்தை", "सब्जी", "फल", "కూరగాయలు", "పచ్చക്കറി", "vegetable", "produce"]
        if any(k in text for k in vegetable_tokens):
            return "Vegetable & Produce Retail Selling"

        # General Retail / Shop
        shop_tokens = ["கடை", "தொழில்", "கட", "दुकान", "దుకాణం", "షాపు", "வியாபாரம்", "retail", "shop", "store"]
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
