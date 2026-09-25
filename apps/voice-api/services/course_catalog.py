"""
Kural Sevi — PM-AJAY Vocational Course Catalog & Formatting
Contains official NSQF Qualification Pack (QP) courses with localized translations
(Tamil, Hindi, Malayalam, Telugu) and smart catalog lookups.
"""
from typing import Optional, List, Dict, Any, Tuple

CATALOG_COURSES = [
    {
        "rank": 1,
        "qp_code": "ASC/Q9705",
        "qp_name": "Commercial Vehicle Driver (LMV & Auto/Taxi)",
        "short_en": "Commercial Driver",
        "en_name": "Commercial Vehicle Driver Training",
        "ta_name": "வாகன ஓட்டுநர் மற்றும் போக்குவரத்து பயிற்சி",
        "hi_name": "व्यावसायिक वाहन चालक प्रशिक्षण",
        "ml_name": "കൊമേഴ്‌സ്യൽ വെഹിക്കിൾ ഡ്രൈവിംഗ് പരിശീലനം",
        "te_name": "కమర్షియల్ వెహికల్ డ్రైవింగ్ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "wage_or_self",
        "keywords": [
            "driver", "driving", "auto", "car", "taxi", "cab", "lorry", "truck", "van", "vehicle",
            "டிரைவர்", "ஓட்டுநர்", "வண்டி", "ஆட்டோ", "கார்", "டாக்சி", "லாரி", "வாகனம்", "டிரைவிங்",
            "ड्राइवर", "ड्राइविंग", "गाड़ी", "ऑटो", "कार", "टैक्सी", "ट्रक", "चालक",
            "డ్రైవర్", "డ్రైవింగ్", "ఆటో", "కారు", "లారీ", "బండి",
            "ഡ്രൈവർ", "ഡ്രൈവിംഗ്", "വണ്ടി", "ഓട്ടോ", "കാർ"
        ],
        "duration_hours": 200,
    },
    {
        "rank": 2,
        "qp_code": "APP/Q0301",
        "qp_name": "Tailor - Garment Construction",
        "short_en": "Tailor",
        "en_name": "Tailoring & Garment Construction Training",
        "ta_name": "தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி",
        "hi_name": "सिलाई और वस्त्र निर्माण प्रशिक्षण",
        "ml_name": "ടെയ്‌ലറിംഗ്, വസ്ത്ര നിർമ്മാണ പരിശീലനം",
        "te_name": "టైలరింగ్ మరియు దుస్తుల తయారీ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_employment",
        "keywords": [
            "tailor", "tailoring", "stitching", "garment", "sewing", "cloth", "dress", "fashion", "embroidery",
            "தையல்", "ஆடை", "துணி", "தையல்காரர்", "சுடிதார்", "ஜாக்கெட்", "தைக்க", "தையல் மெஷின்",
            "सिलाई", "दर्जी", "कपड़े", "सिलाई मशीन", "वस्त्र",
            "టైలరింగ్", "కుట్లు", "దుస్తులు", "బట్టలు", "టైలర్",
            "ടെയ്‌ലറിംഗ്", "തയ്യൽ", "വസ്ത്രങ്ങൾ", "തുണി"
        ],
        "duration_hours": 300,
    },
    {
        "rank": 3,
        "qp_code": "ELE/Q3101",
        "qp_name": "Domestic Electrician & Building Wireman",
        "short_en": "Electrician",
        "en_name": "Domestic Electrician & Building Wiring Course",
        "ta_name": "வீட்டு மின்சாதனங்கள் மற்றும் வயரிங் பயிற்சி",
        "hi_name": "घरेलू इलेक्ट्रीशियन और वायरिंग प्रशिक्षण",
        "ml_name": "ഇലക്ട്രിക്കൽ വയറിംഗ് പരിശീലനം",
        "te_name": "హోమ్ ఎలక్ట్రీషియన్ మరియు వైరింగ్ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_or_wage",
        "keywords": [
            "electrician", "electric", "wiring", "electrical", "wireman", "switchboard", "motor", "fan", "appliances",
            "மின்சாரம்", "வயரிங்", "எலக்ட்ரீசியன்", "மோட்டார்", "மின்சார வேலை", "லைட்", "சுவிட்ச்",
            "इलेक्ट्रीशियन", "बिजली", "वायरिंग", "मोटर", "बिजली का काम",
            "ఎలక్ట్రీషియన్", "విద్యుత్", "వైరింగ్", "మోటార్",
            "ഇലക്ട്രീഷ്യൻ", "വയറിംഗ്", "വൈദ്യുതി"
        ],
        "duration_hours": 240,
    },
    {
        "rank": 4,
        "qp_code": "FIC/Q0201",
        "qp_name": "Food Catering & Culinary Products Specialist",
        "short_en": "Food & Catering",
        "en_name": "Food Catering & Culinary Enterprise Training",
        "ta_name": "உணவு தயாரிப்பு மற்றும் கேட்டரிங் பயிற்சி",
        "hi_name": "खाद्य प्रसंस्करण और कैटरिंग प्रशिक्षण",
        "ml_name": "ഭക്ഷണ നിർമ്മാണവും കാറ്ററിംഗും",
        "te_name": "ఫుడ్ కేటరింగ్ మరియు పచ్చళ్ల తయారీ శిక్షణ",
        "nsqf_level": 3,
        "pathway_type": "self_employment",
        "keywords": [
            "food", "catering", "cooking", "chef", "hotel", "canteen", "restaurant", "biryani", "bakery", "snacks", "pickle", "sweets",
            "சமையல்", "ஹோட்டல்", "கேட்டரிங்", "சாப்பாடு", "பிரியாணி", "உணவு", "மாஸ்டர்", "ரெஸ்டாரன்ட்", "பலகாரம்",
            "खाना", "होटल", "रसोई", "बावर्ची", "कैटरिंग", "मिठाई", "नाश्ता", "बिरयानी",
            "వంట", "హోటల్", "కేటరింగ్", "భోజనం", "బిర్యానీ", "స్నాక్స్",
            "പാചകം", "ഹോട്ടൽ", "കാറ്ററിംഗ്", "ബിരിയാണി", "ഭക്ഷണം"
        ],
        "duration_hours": 180,
    },
    {
        "rank": 5,
        "qp_code": "RAS/Q0104",
        "qp_name": "Retail Sales Associate / Kirana Store Operator",
        "short_en": "Retail & Store",
        "en_name": "Retail Sales & Kirana Store Management Course",
        "ta_name": "மளிகை மற்றும் சில்லறை விற்பனைக் கடை பயிற்சி",
        "hi_name": "किराना दुकान और खुदरा बिक्री प्रशिक्षण",
        "ml_name": "റീട്ടെയിൽ വിൽപന, പലചரക്ക് കട പരിശീലനം",
        "te_name": "కిరాణా దుకాణం మరియు రిటైల్ అమ్మకాల శిక్షణ",
        "nsqf_level": 3,
        "pathway_type": "self_employment",
        "keywords": [
            "retail", "shop", "grocery", "kirana", "store", "sales", "merchant", "vendor", "counter", "billing",
            "மளிகை", "கடை", "சில்லறை", "வியாபாரம்", "கடைக்காரர்", "பொருட்கள்", "மல்லிகை", "விற்பனை",
            "किराना", "दुकान", "खुदरा", "व्यापार", "दुकानदार", "बिक्री",
            "కిరాణా", "దుకాణం", "షాపు", "వ్యాపారం", "అమ్మకాలు",
            "പലചരക്ക്", "കട", "വിൽപന", "വ്യാപാരം"
        ],
        "duration_hours": 120,
    },
    {
        "rank": 6,
        "qp_code": "MEP/Q0101",
        "qp_name": "Micro-Enterprise & Rural Business Operator",
        "short_en": "Micro-Enterprise",
        "en_name": "Micro-Enterprise & Small Business Leadership",
        "ta_name": "கிராமப்புற சிறுதொழில் மற்றும் சுயதொழில் பயிற்சி",
        "hi_name": "ग्रामीण लघु उद्योग और स्वरोजगार प्रशिक्षण",
        "ml_name": "ചെറുകിട സംരംഭവും സ്വയംതൊഴിലും",
        "te_name": "చిన్న వ్యాపారం మరియు స్వయం ఉపాధి శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_employment",
        "keywords": [
            "business", "enterprise", "startup", "self employment", "shop", "own business", "investment", "trade", "company",
            "சுயதொழில்", "தொழில்", "சொந்த தொழில்", "சொந்த கடை", "பிசினஸ்", "வியாபாரம்", "முதலீடு", "முயற்சி",
            "स्वरोजगार", "खुद का काम", "व्यवसाय", "व्यापार", "लघु उद्योग", "दुकान", "उद्योग",
            "స్వయం ఉపాధి", "సొంత వ్యాపారం", "బిజినెస్", "చిన్న వ్యాపారం", "పరిశ్రమ",
            "സ്വയംതൊഴിൽ", "ചെറുകിട സംരംഭം", "ബിസിനസ്", "സ്വന്തം സ്ഥാപനം"
        ],
        "duration_hours": 180,
    },
    {
        "rank": 7,
        "qp_code": "ASC/Q1401",
        "qp_name": "Automotive Two-Wheeler Mechanic & Technician",
        "short_en": "Two-Wheeler Mechanic",
        "en_name": "Two-Wheeler Automotive Service Technician Course",
        "ta_name": "டூவீலர் மெக்கானிக் மற்றும் சர்வீஸ் பயிற்சி",
        "hi_name": "दोपहिया वाहन मैकेनिक प्रशिक्षण",
        "ml_name": "ടൂവീലർ മെക്കാനിക്ക് പരിശീലനം",
        "te_name": "టూవీలర్ మెకానిక్ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_or_wage",
        "keywords": [
            "mechanic", "bike", "scooter", "motorcycle", "two wheeler", "garage", "workshop", "repair", "service",
            "மெக்கானிக்", "பைக்", "டூவீலர்", "வண்டி ரிப்பேர்", "ஒர்க்‌ஷாப்", "பஞ்சர்", "சர்வீஸ்",
            "मैकेनिक", "बाइक", "मोटरसाइकिल", "गैरेज", "वर्कशॉप", "मरम्मत",
            "మెకానిక్", "బైక్", "టూవీలర్", "గ్యారేజ్", "మరమ్మతు",
            "മെക്കാനിക്ക്", "ബൈക്ക്", "വർക്ക്ഷോപ്പ്", "റിപ്പയറിംഗ്"
        ],
        "duration_hours": 240,
    },
    {
        "rank": 8,
        "qp_code": "AGR/Q4101",
        "qp_name": "Organic Farming & Crop Production Specialist",
        "short_en": "Organic Farming",
        "en_name": "Organic Farming & Modern Agri-Practices Course",
        "ta_name": "இயற்கை விவசாயம் மற்றும் பயிர் உற்பத்தி பயிற்சி",
        "hi_name": "जैविक खेती और फसल उत्पादन प्रशिक्षण",
        "ml_name": "ജൈവകൃഷി, വിളപരിപാലന പരിശീലനം",
        "te_name": "సేంద్రీయ వ్యవసాయం మరియు పంటల సాగు శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_employment",
        "keywords": [
            "farming", "farmer", "agriculture", "crop", "paddy", "vegetable", "cultivation", "organic", "field", "harvest",
            "விவசாயம்", "விவசாயி", "பயிர்", "நிலம்", "காடு", "கழனி", "நெல்", "காய்கறி", "தோட்டம்", "இயற்கை விவசாயம்",
            "खेती", "किसान", "कृषि", "फसल", "खेत", "जैविक खेती", "धान", "सब्जी",
            "వ్యవసాయం", "రైతు", "పంట", "పొలం", "సేంద్రీయ వ్యవసాయం",
            "കൃഷി", "കർഷകൻ", "പാടം", "വിള", "ജൈവകൃഷി"
        ],
        "duration_hours": 200,
    },
    {
        "rank": 9,
        "qp_code": "AHC/Q0401",
        "qp_name": "Dairy Farmer & Milk Processing Operator",
        "short_en": "Dairy Farmer",
        "en_name": "Dairy Farming & Livestock Management Course",
        "ta_name": "கால்நடை வளர்ப்பு மற்றும் பால் பண்ணை பயிற்சி",
        "hi_name": "डेयरी फार्मिंग और दुग्ध व्यवसाय प्रशिक्षण",
        "ml_name": "ക്ഷീരകർഷക, പാൽ സംസ്കരണ പരിശീലനം",
        "te_name": "పాడి పరిశ్రమ మరియు పాల వ్యాపార శిక్షణ",
        "nsqf_level": 3,
        "pathway_type": "self_employment",
        "keywords": [
            "dairy", "milk", "cow", "cattle", "buffalo", "goat", "livestock", "butter", "ghee",
            "பால்", "மாடு", "கறவை", "கால்நடை", "ஆடு", "பண்ணை", "நெய்", "வெண்ணெய்",
            "डेयरी", "दूध", "गाय", "भैंस", "पशुपालन", "बकरी",
            "పాడి పరిశ్రమ", "పాలు", "ఆవు", "గేదె", "పశువుల పెంపకం",
            "പാൽ", "പശു", "ക്ഷീരകർഷകൻ", "കന്നുകാലി"
        ],
        "duration_hours": 150,
    },
    {
        "rank": 10,
        "qp_code": "AGR/Q4301",
        "qp_name": "Small Poultry Farmer & Meat Retailer",
        "short_en": "Poultry Farmer",
        "en_name": "Small Poultry Farming & Meat Retail Training",
        "ta_name": "கோழிப்பண்ணை மற்றும் இறைச்சி விற்பனை பயிற்சி",
        "hi_name": "मुर्गी पालन और पोल्ट्री व्यवसाय प्रशिक्षण",
        "ml_name": "കോഴി വളർത്തൽ പരിശീലനം",
        "te_name": "కోళ్ల పెంపకం మరియు వ్యాపార శిక్షణ",
        "nsqf_level": 3,
        "pathway_type": "self_employment",
        "keywords": [
            "poultry", "chicken", "broiler", "egg", "hen", "birds", "farm", "meat",
            "கோழி", "பண்ணை", "கோழிப்பண்ணை", "முட்டை", "இறைச்சி", "பிராய்லர்", "நாட்டுக்கோழி",
            "मुर्गी पालन", "पोल्ट्री", "चिकन", "अंडा", "मुर्गी फॉर्म",
            "కోళ్ల పెంపకం", "కోళ్లు", "గుడ్లు", "పౌల్ట్రీ",
            "കോഴി വളർത്തൽ", "മുട്ട", "ഫാം"
        ],
        "duration_hours": 160,
    },
    {
        "rank": 11,
        "qp_code": "ELE/Q6801",
        "qp_name": "Solar Photovoltaic Panel Installation Technician",
        "short_en": "Solar Technician",
        "en_name": "Solar Panel Installation & Maintenance Course",
        "ta_name": "சூரிய மின்சக்தி (சோலார்) நிறுவுதல் பயிற்சி",
        "hi_name": "सोलर पैनल इंस्टालेशन तकनीशियन प्रशिक्षण",
        "ml_name": "സോളാർ പാനൽ ഇൻസ്റ്റലേഷൻ പരിശീലനം",
        "te_name": "సోలార్ ప్యానెల్ ఇన్‌స్టాలేషన్ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "wage_employment",
        "keywords": [
            "solar", "panel", "renewable", "inverter", "pv", "sun", "energy", "clean energy",
            "சோலார்", "சூரிய மின்சக்தி", "பேனல்", "இன்வெர்ட்டர்",
            "सोलर", "सोलर पैनल", "सौर ऊर्जा",
            "సోలార్", "సౌర విద్యుత్", "ప్యానెల్",
            "സോളാർ", "സൗരോർജ്ജം"
        ],
        "duration_hours": 180,
    },
    {
        "rank": 12,
        "qp_code": "CON/Q0201",
        "qp_name": "General Plumber & Pipeline Technician",
        "short_en": "Plumber",
        "en_name": "Plumbing & Pipe Fitting Technician Training",
        "ta_name": "பிளம்பிங் மற்றும் குழாய் பொருத்துநர் பயிற்சி",
        "hi_name": "प्लम्बर और पाइप फिटिंग प्रशिक्षण",
        "ml_name": "പ്ലംബിംഗ്, പൈപ്പ് ഫിറ്റിംഗ് പരിശീലനം",
        "te_name": "ప్లంబింగ్ మరియు పైప్ ఫిట్టింగ్ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_or_wage",
        "keywords": [
            "plumber", "plumbing", "pipe", "tap", "leakage", "sanitary", "fittings", "drainage", "water",
            "பிளம்பர்", "பிளம்பிங்", "குழாய்", "தண்ணீர் குழாய்", "பைப்", "வால்வு",
            "प्लम्बर", "पाइप", "नल", "प्लंबिंग", "पानी की लाइन",
            "ప్లంబర్", "పైప్", "కుళాయి", "ప్లంబింగ్",
            "പ്ലംബർ", "പൈപ്പ്", "വാട്ടർ പൈപ്പ്"
        ],
        "duration_hours": 200,
    },
    {
        "rank": 13,
        "qp_code": "CON/Q0102",
        "qp_name": "Mason - General Building Construction",
        "short_en": "Mason",
        "en_name": "Building Masonry & Construction Work Course",
        "ta_name": "கட்டிட மேஸ்திரி மற்றும் கொத்தனார் பயிற்சி",
        "hi_name": "भवन निर्माण राजमिस्त्री प्रशिक्षण",
        "ml_name": "കെട്ടിട നിർമ്മാണ മേസ്തിരി പരിശീലനം",
        "te_name": "భవన నిర్మాణ మేస్త్రీ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "wage_employment",
        "keywords": [
            "mason", "masonry", "construction", "builder", "brick", "cement", "building", "plastering",
            "கொத்தனார்", "மேஸ்திரி", "கட்டிடம்", "சிமெண்ட்", "செங்கல்", "பூச்சு வேலை", "கட்டுமானம்",
            "राजमिस्त्री", "मिस्त्री", "निर्माण", "मकान", "ईंट", "सीमेंट",
            "మేస్త్రీ", "భవన నిర్మాణం", "ఇటుక", "సిమెంట్",
            "മേസ്തിരി", "നിർമ്മാണം", "സിമന്റ്"
        ],
        "duration_hours": 240,
    },
    {
        "rank": 14,
        "qp_code": "CON/Q0301",
        "qp_name": "Carpenter - Woodwork & Furniture Craft",
        "short_en": "Carpenter",
        "en_name": "Carpentry & Wooden Craftsmanship Training",
        "ta_name": "தச்சு வேலை மற்றும் மரப்பொருட்கள் தயாரிப்பு பயிற்சி",
        "hi_name": "बढ़ई और लकड़ी का काम प्रशिक्षण",
        "ml_name": "ആശാരിപ്പണി, മരപ്പണി പരിശീലനം",
        "te_name": "వడ్రంగి మరియు చెక్క పని శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_or_wage",
        "keywords": [
            "carpenter", "carpentry", "wood", "furniture", "timber", "door", "window", "cabinet",
            "தச்சர்", "தச்சு", "மரம்", "மர வேலை", "பர்னிச்சர்", "கதவு", "ஜன்னல்",
            "बढ़ई", "लकड़ी", "फर्नीचर", "काष्ठकला",
            "వడ్రంగి", "చెక్క పని", "ఫర్నిచర్",
            "ആശാരി", "മരപ്പണി", "ഫർണിച്ചർ"
        ],
        "duration_hours": 240,
    },
    {
        "rank": 15,
        "qp_code": "BWS/Q0201",
        "qp_name": "Beauty Therapist & Salon Stylist",
        "short_en": "Beauty & Salon",
        "en_name": "Beauty Therapist & Salon Stylist Course",
        "ta_name": "அழகுக்கலை மற்றும் சலூன் பயிற்சி",
        "hi_name": "ब्यूटी पार्लर और सैलून प्रशिक्षण",
        "ml_name": "ബ്യൂട്ടി പാർലർ, സലൂൺ പരിശീലനം",
        "te_name": "బ్యూటీ పార్లర్ మరియు సెలూన్ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_employment",
        "keywords": [
            "beauty", "parlour", "salon", "makeup", "hair", "skin", "facial", "grooming", "barber",
            "அழகுக்கலை", "பார்லர்", "சலூன்", "மேக்கப்", "முடி வெட்டுதல்", "முகப்பொலிவு",
            "ब्यूटी पार्लर", "सैलून", "मेकअप", "बाल काटना", "श्रृंगार",
            "బ్యూటీ పార్లర్", "సెలూన్", "మేకప్", "హెయిర్ కట్",
            "ബ്യൂട്ടി പാർലർ", "മേക്കപ്പ്", "ഹെയർ സ്റ്റൈൽ"
        ],
        "duration_hours": 300,
    },
    {
        "rank": 16,
        "qp_code": "AHC/Q1001",
        "qp_name": "Village Level Entrepreneur (CSC Digital Services)",
        "short_en": "Digital VLE / CSC",
        "en_name": "Common Service Centre & Digital Entrepreneurship",
        "ta_name": "இ-சேவை மையம் மற்றும் டிஜிட்டல் தொழில் பயிற்சி",
        "hi_name": "कॉमन सर्विस सेंटर और डिजिटल उद्यमिता प्रशिक्षण",
        "ml_name": "ഡിജിറ്റൽ സേവന കേന്ദ്രം, അക്ഷയ സംരംഭ പരിശീലനം",
        "te_name": "డిజిటల్ సేవా కేంద్రం (CSC) వ్యవస్థాపక శిక్షణ",
        "nsqf_level": 5,
        "pathway_type": "self_employment",
        "keywords": [
            "computer", "digital", "csc", "online", "internet", "e-seva", "typing", "photocopy", "data entry", "banking", "pan card", "aadhaar",
            "கம்ப்யூட்டர்", "இ-சேவை", "ஆன்லைன்", "ஜெராக்ஸ்", "டைப்பிங்", "இன்டர்நெட்", "கணினி",
            "कंप्यूटर", "सीएससी", "ऑनलाइन", "डिजिटल", "ई-सेवा", "टाइपिंग",
            "కంప్యూటర్", "ఆన్‌లైన్", "డిజిటల్", "మీ-సేవ", "టైపింగ్",
            "കമ്പ്യൂട്ടർ", "അക്ഷയ", "ഓൺലൈൻ", "ഡിജിറ്റൽ"
        ],
        "duration_hours": 200,
    },
    {
        "rank": 17,
        "qp_code": "HSS/Q0601",
        "qp_name": "Home Health Aide & Patient Care Assistant",
        "short_en": "Health Aide",
        "en_name": "Home Health Aide & Healthcare Assistant Course",
        "ta_name": "முதியோர் மற்றும் நோயாளி பராமரிப்பு பயிற்சி",
        "hi_name": "रोगी देखभाल और गृह स्वास्थ्य सहायक प्रशिक्षण",
        "ml_name": "ഹോം നഴ്സിംഗ്, രോഗീപരിപാലന പരിശീലനം",
        "te_name": "హోమ్ హెల్త్ అసిస్టెంట్ మరియు రోగి సంరక్షణ శిక్షణ",
        "nsqf_level": 3,
        "pathway_type": "wage_employment",
        "keywords": [
            "health", "nurse", "nursing", "hospital", "patient", "elderly", "clinic", "medicine", "caregiver",
            "மருத்துவம்", "நர்ஸ்", "மருத்துவமனை", "நோயாளி", "பராமரிப்பு", "மருந்து",
            "नर्सिंग", "अस्पताल", "मरीज", "दवा", "स्वास्थ्य सेवा",
            "నర్సింగ్", "ఆసుపత్రి", "ఆరోగ్యం", "రోగి సంరక్షణ",
            "ഹോം നഴ്സിംഗ്", "ആശുപത്രി", "രോഗീപരിപാലനം"
        ],
        "duration_hours": 180,
    },
    {
        "rank": 18,
        "qp_code": "TEX/Q4101",
        "qp_name": "Handloom Weaver & Textile Artisan",
        "short_en": "Handloom Weaver",
        "en_name": "Handloom Weaving & Traditional Textile Craft",
        "ta_name": "கைத்தறி நெசவு மற்றும் பாரம்பரிய ஆடை பயிற்சி",
        "hi_name": "हथकरघा बुनकर और वस्त्र शिल्प प्रशिक्षण",
        "ml_name": "കൈത്തറി നെയ്ത്ത് പരിശീലനം",
        "te_name": "చేనేత మగ్గం మరియు వస్త్ర తయారీ శిక్షణ",
        "nsqf_level": 3,
        "pathway_type": "home_enterprise",
        "keywords": [
            "weaving", "weaver", "handloom", "loom", "saree", "textile", "yarn", "cotton",
            "நெசவு", "கைத்தறி", "சேலை", "நூல்", "நெசவாளர்", "பட்டு", "தறி",
            "बुनकर", "हथकरघा", "साड़ी", "धागा", "बुनाई",
            "చేనేత", "మగ్గం", "చీర", "నేత",
            "നെയ്ത്ത്", "കൈത്തറി", "സാരി"
        ],
        "duration_hours": 180,
    },
    {
        "rank": 19,
        "qp_code": "CSC/Q0204",
        "qp_name": "Manual Metal Arc Welder & Fabricator",
        "short_en": "Welder",
        "en_name": "Welding & Metal Fabrication Technician Course",
        "ta_name": "வெல்டிங் மற்றும் மெட்டல் ஃபேப்ரிகேஷன் பயிற்சி",
        "hi_name": "वेल्डिंग और मेटल फैब्रिकेशन प्रशिक्षण",
        "ml_name": "വെൽഡിംഗ്, മെറ്റൽ വർക്ക് പരിശീലനം",
        "te_name": "వెల్డింగ్ మరియు మెటల్ ఫ్యాబ్రికేషన్ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "wage_or_self",
        "keywords": [
            "welder", "welding", "metal", "iron", "steel", "fabrication", "grill", "gate",
            "வெல்டிங்", "வெல்டர்", "இரும்பு", "கிரில்", "கேட்", "பட்டறை",
            "वेल्डिंग", "वेल्डर", "लोहा", "ग्रिल",
            "వెల్డింగ్", "వెల్డర్", "ఇనుము", "గ్రిల్స్",
            "വെൽഡിംഗ്", "ഇരുമ്പ്"
        ],
        "duration_hours": 220,
    },
    {
        "rank": 20,
        "qp_code": "LSS/Q2301",
        "qp_name": "Footwear & Leather Goods Specialist / Shopkeeper",
        "short_en": "Footwear & Leather",
        "en_name": "Footwear Craft & Leather Goods Specialist Course",
        "ta_name": "தோல் மற்றும் காலணி தயாரிப்பு பயிற்சி",
        "hi_name": "चमड़ा और जूता निर्माण प्रशिक्षण",
        "ml_name": "ലെതർ, പാദരക്ഷാ നിർമ്മാണ പരിശീലനം",
        "te_name": "పాదరక్షలు మరియు లెదర్ వస్తువుల తయారీ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "self_employment",
        "keywords": [
            "footwear", "shoe", "shoes", "chappal", "leather", "slippers", "cobbler", "boot",
            "செருப்பு", "பாதணி", "தோல்", "சப்பல்", "காலணி", "ஷூ",
            "जूता", "चप्पल", "चमड़ा", "मोची",
            "పాదరక్షలు", "లెదర్", "చెప్పులు",
            "പാദരക്ഷകൾ", "ലെതർ", "ചെരുപ്പ്"
        ],
        "duration_hours": 240,
    },
    {
        "rank": 21,
        "qp_code": "AMH/Q0301",
        "qp_name": "Sewing Machine Operator - Industrial & Apparel",
        "short_en": "Sewing Machine Operator",
        "en_name": "Industrial Sewing Machine Operator & Garment Course",
        "ta_name": "ஆடை தயாரிப்பு மற்றும் தையல் இயந்திர ஆபரேட்டர் பயிற்சி",
        "hi_name": "सिलाई मशीन ऑपरेटर और परिधान निर्माण प्रशिक्षण",
        "ml_name": "വസ്ത്ര നിർമ്മാണ തയ്യൽ മെഷീൻ ഓപ്പറേറ്റർ പരിശീലനം",
        "te_name": "కుట్టు మిషన్ ఆపరేటర్ మరియు దుస్తుల తయారీ శిక్షణ",
        "nsqf_level": 4,
        "pathway_type": "wage_or_self",
        "keywords": [
            "sewing machine", "operator", "apparel", "garment", "factory", "stitching machine", "tailor", "cloth",
            "தையல் மெஷின்", "ஆடை உற்பத்தி", "தையல்", "சட்டை", "பேன்ட்", "மெஷின்", "ஆடை நிறுவனம்",
            "सिलाई मशीन", "कपड़ा", "परिधान", "ऑपरेटर", "गारमेंट",
            "టైలరింగ్", "కుట్టు మిషన్", "దుస్తులు", "ఆపరేటర్",
            "തയ്യൽ മെഷീൻ", "വസ്ത്രം", "ഓപ്പറേറ്റർ"
        ],
        "duration_hours": 240,
    },
    {
        "rank": 22,
        "qp_code": "FIC/Q0103",
        "qp_name": "Food Processing Technician - Pickles, Jams & Ready-to-Eat Products",
        "short_en": "Food Processing & Pickles",
        "en_name": "Pickle Making & Ready-to-Eat Food Processing Course",
        "ta_name": "ஊறுகாய் தயாரிப்பு மற்றும் உணவு பதப்படுத்துதல் பயிற்சி",
        "hi_name": "अचार, जैम और रेडी-टू-ईट खाद्य प्रसंस्करण प्रशिक्षण",
        "ml_name": "അച്ചാർ നിർമ്മാണവും ഭക്ഷ്യ സംസ്കരണ പരിശീലനവും",
        "te_name": "ఊరగాయలు మరియు ఆహార ప్రాసెసింగ్ శిక్షణ",
        "nsqf_level": 3,
        "pathway_type": "self_employment",
        "keywords": [
            "pickle", "jam", "jelly", "chutney", "food processing", "ready to eat", "snacks", "preserving", "masala",
            "ஊறுகாய்", "தொக்கு", "உணவு பதப்படுத்துதல்", "ஜாம்", "மசாலா", "பலகாரம்", "தின்பண்டம்", "அப்பளம்",
            "अचार", "चटनी", "जैम", "खाद्य प्रसंस्करण", "पापड़", "नमकीन",
            "ఊరగాయ", "పచ్చళ్లు", "ఆహార ప్రాసెసింగ్", "అప్పడాలు",
            "അച്ചാർ", "ചമ്മന്തി", "ഭക്ഷ്യ സംസ്കരണം"
        ],
        "duration_hours": 180,
    },
]


def get_localized_course_name(course: Any, lang: str = "ta") -> str:
    """Returns the natural conversational course name for the given language."""
    if not course:
        return "Vocational Training" if lang == "en" else "பயிற்சி"
    if not isinstance(course, dict):
        found = find_course_in_catalog(str(course))
        if found:
            course = found
        else:
            return str(course)
    key = f"{lang}_name"
    if key in course and course[key]:
        return course[key]
    if lang == "en":
        return course.get("en_name") or course.get("qp_name", "Vocational Training")
    return course.get("ta_name") or course.get("qp_name", "பயிற்சி").split("-")[0].strip()


def get_short_english_name(course: Any) -> str:
    """Returns clean, short English descriptor (e.g., 'Tailor', 'Retail Sales')."""
    if not course:
        return "Course"
    if not isinstance(course, dict):
        found = find_course_in_catalog(str(course))
        if found:
            course = found
        else:
            return str(course)
    if "short_en" in course and course["short_en"]:
        return course["short_en"]
    qp_name = course.get("qp_name", "Course")
    return qp_name.split("-")[0].split("/")[0].strip()


def find_course_in_catalog(query: str) -> Optional[dict]:
    """Finds a course by QP code, QP name, vernacular name, or keywords."""
    if not query:
        return None
    target = query.strip().lower()

    # Exact match on qp_code or qp_name
    for c in CATALOG_COURSES:
        if c.get("qp_code", "").lower() == target:
            return c
        if c.get("qp_name", "").lower() == target:
            return c
        for lang_key in ["en_name", "ta_name", "hi_name", "ml_name", "te_name"]:
            if c.get(lang_key, "").lower() == target:
                return c

    # Fuzzy / substring match
    for c in CATALOG_COURSES:
        if target in c.get("qp_name", "").lower() or c.get("qp_name", "").lower() in target:
            return c
        for lang_key in ["en_name", "ta_name", "hi_name", "ml_name", "te_name"]:
            val = c.get(lang_key, "").lower()
            if val and (target in val or val in target):
                return c

    # Keyword match
    for c in CATALOG_COURSES:
        for kw in c.get("keywords", []):
            if kw.lower() in target or target in kw.lower():
                return c

    return None


def format_course_selection_whatsapp(
    course_name_or_dict: Any,
    lang: str = "ta",
    recommended_courses: Optional[List[Any]] = None
) -> Tuple[str, str, str]:
    """Builds the 3-part Selected Course block for WhatsApp."""
    header_map = {
        "ta": "உங்களால் தேர்ந்தெடுக்கப்பட்ட பயிற்சி:",
        "hi": "आपके द्वारा चुना गया PM-AJAY कौशल कोर्स:",
        "ml": "നിങ്ങൾ തിരഞ്ഞെടുത്ത PM-AJAY കോഴ്സ്:",
        "te": "మీరు ఎంచుకున్న PM-AJAY కోర్సు:",
        "en": "Selected PM-AJAY Vocational Course:",
    }
    header = header_map.get(lang, header_map["en" if lang == "en" else "ta"])

    course_dict = None
    if isinstance(course_name_or_dict, dict):
        course_dict = dict(course_name_or_dict)
    else:
        if recommended_courses:
            for rc in recommended_courses:
                rc_str = rc.get("qp_name", "") if isinstance(rc, dict) else str(rc)
                if str(course_name_or_dict).strip().lower() in rc_str.lower():
                    course_dict = dict(rc) if isinstance(rc, dict) else find_course_in_catalog(str(rc))
                    break
        if not course_dict:
            found = find_course_in_catalog(str(course_name_or_dict))
            if found:
                course_dict = dict(found)

    if course_dict:
        cat_match = find_course_in_catalog(course_dict.get("qp_code") or course_dict.get("qp_name") or "")
        if cat_match:
            for k, v in cat_match.items():
                if k not in course_dict or not course_dict[k]:
                    course_dict[k] = v

    if course_dict:
        native_name = get_localized_course_name(course_dict, lang)
        qp_name = course_dict.get("qp_name", str(course_name_or_dict))
        qp_code = course_dict.get("qp_code", "N/A")
        bold_line = f"🎯 *{native_name}*"
        details_line = f"_({qp_name} | QP Code: {qp_code})_"
    else:
        bold_line = f"🎯 *{course_name_or_dict}*"
        details_line = "_(PM-AJAY Certified Vocational Qualification Pack)_"

    return header, bold_line, details_line


def format_recommended_course_item(idx: int, course: Any, lang: str = "ta") -> str:
    """Formats a recommended course item for WhatsApp."""
    if not isinstance(course, dict):
        found = find_course_in_catalog(str(course))
        course = dict(found) if found else {"qp_name": str(course), "short_en": str(course), "nsqf_level": 3}
    native_name = get_localized_course_name(course, lang)
    short_en = get_short_english_name(course)
    nsqf_lvl = course.get("nsqf_level", 3)
    duration = f" ({course.get('duration_hours')} hrs)" if course.get("duration_hours") else ""
    return f"{idx}. *{native_name}* ({short_en}) - NSQF Level {nsqf_lvl}{duration}"


# Complementary trade affinities by primary QP code for coherent top-3 recommendations
TRADE_AFFINITY_MAP = {
    "ASC/Q9705": ["ASC/Q1401", "ELE/Q3101", "RAS/Q0104"],  # Driver -> 2W Mechanic, Electrician, Retail
    "APP/Q0301": ["AMH/Q0301", "TEX/Q4101", "MEP/Q0101"],  # Tailor -> Sewing Op, Handloom, Micro-Ent
    "ELE/Q3101": ["ELE/Q6801", "ASC/Q1401", "CON/Q0201"],  # Electrician -> Solar, 2W Mechanic, Plumber
    "FIC/Q0201": ["FIC/Q0103", "RAS/Q0104", "MEP/Q0101"],  # Food Catering -> Food Proc, Retail, Micro-Ent
    "RAS/Q0104": ["MEP/Q0101", "FIC/Q0201", "AHC/Q1001"],  # Retail -> Micro-Ent, Food Catering, Digital
    "MEP/Q0101": ["RAS/Q0104", "APP/Q0301", "FIC/Q0201"],  # Micro-Ent -> Retail, Tailor, Food Catering
    "ASC/Q1401": ["ASC/Q9705", "CSC/Q0204", "ELE/Q3101"],  # 2W Mechanic -> Driver, Welder, Electrician
    "AGR/Q4101": ["AHC/Q0401", "AGR/Q4301", "FIC/Q0103"],  # Organic Farming -> Dairy, Poultry, Food Proc
    "AHC/Q0401": ["AGR/Q4101", "AGR/Q4301", "FIC/Q0103"],  # Dairy -> Organic Farming, Poultry, Food Proc
    "AGR/Q4301": ["AHC/Q0401", "FIC/Q0201", "AGR/Q4101"],  # Poultry -> Dairy, Food Catering, Organic Farming
    "ELE/Q6801": ["ELE/Q3101", "CON/Q0201", "ASC/Q1401"],  # Solar -> Electrician, Plumber, 2W Mechanic
    "CON/Q0201": ["ELE/Q3101", "CON/Q0102", "CON/Q0301"],  # Plumber -> Electrician, Mason, Carpenter
    "CON/Q0102": ["CON/Q0301", "CON/Q0201", "CSC/Q0204"],  # Mason -> Carpenter, Plumber, Welder
    "CON/Q0301": ["CON/Q0102", "CON/Q0201", "CSC/Q0204"],  # Carpenter -> Mason, Plumber, Welder
    "BWS/Q0201": ["APP/Q0301", "MEP/Q0101", "AHC/Q1001"],  # Beauty -> Tailor, Micro-Ent, Digital
    "AHC/Q1001": ["RAS/Q0104", "MEP/Q0101", "ELE/Q3101"],  # Digital VLE -> Retail, Micro-Ent, Electrician
    "HSS/Q0601": ["BWS/Q0201", "AHC/Q1001", "RAS/Q0104"],  # Health Aide -> Beauty, Digital, Retail
    "TEX/Q4101": ["APP/Q0301", "AMH/Q0301", "MEP/Q0101"],  # Handloom -> Tailor, Sewing Op, Micro-Ent
    "CSC/Q0204": ["ASC/Q1401", "ELE/Q3101", "CON/Q0102"],  # Welder -> 2W Mechanic, Electrician, Mason
    "LSS/Q2301": ["RAS/Q0104", "MEP/Q0101", "APP/Q0301"],  # Footwear -> Retail, Micro-Ent, Tailor
    "AMH/Q0301": ["APP/Q0301", "TEX/Q4101", "RAS/Q0104"],  # Sewing Op -> Tailor, Handloom, Retail
    "FIC/Q0103": ["FIC/Q0201", "RAS/Q0104", "AGR/Q4101"],  # Food Proc -> Food Catering, Retail, Farming
}

# Stop-words to ignore in transcript matching so generic conversation words don't hijack rankings
GENERIC_STOP_WORDS = {
    "shop", "store", "business", "work", "job", "money", "village", "town",
    "கடை", "வியாபாரம்", "தொழில்", "வேலை", "பொருட்கள்", "ஊர்", "பணம்", "சொந்த",
    "दुकान", "व्यापार", "काम", "नौकरी", "पैसा", "गांव",
    "దుకాణం", "షాపు", "వ్యాపారం", "పని", "ఉద్యోగం",
    "കട", "പണി", "ജോലി", "സ്ഥാപനം", "ഗ്രാമം"
}


def compute_top_recommended_courses(confirmed_fields: dict, transcript: Optional[list] = None) -> list:
    """
    Intelligently scores NSQF trade catalog against citizen profile fields AND conversation transcript.
    - Stated skills & aspired interests are the PRIMARY driver (75pts).
    - Current livelihood gives strong secondary signal (35pts).
    - Family occupation provides mild heritage affinity (max 5pts), NEVER overpowering personal skills.
    - Uses domain affinity map to assemble coherent, highly relevant top-3 course recommendations.
    - Zero/general score dynamically personalizes based on schooling and wage vs self-emp preference.
    """
    skills_text = str(confirmed_fields.get("skills_and_interests") or "").lower()
    livelihood_text = str(confirmed_fields.get("current_livelihood") or "").lower()
    family_text = str(confirmed_fields.get("family_occupation") or "").lower()
    preference_text = str(confirmed_fields.get("employment_preference") or "").lower()
    education_text = str(confirmed_fields.get("educational_background") or "").lower()

    # Aggregate transcript utterances from the caller (extract only meaningful trade words)
    transcript_corpus = ""
    if transcript:
        user_lines = []
        for t in transcript:
            if isinstance(t, dict):
                say = t.get("user") or ""
                if say:
                    user_lines.append(say.lower())
        transcript_corpus = " ".join(user_lines)

    all_user_corpus = f"{skills_text} {livelihood_text} {family_text} {preference_text} {transcript_corpus}".strip()

    scored = []
    for c in CATALOG_COURSES:
        score = 0.0
        keywords = c.get("keywords", [])
        qp_name_lower = c.get("qp_name", "").lower()
        short_en_lower = c.get("short_en", "").lower()

        # 1. Skills & Interests (Primary Driver: max 75.0 points once per course)
        has_skill_match = False
        for kw in keywords:
            kw_low = kw.lower()
            if kw_low in skills_text and len(kw_low) >= 3 and kw_low not in GENERIC_STOP_WORDS:
                has_skill_match = True
                break
        if has_skill_match:
            score += 75.0

        # Check direct QP name in skills_text
        if short_en_lower in skills_text or any(part in skills_text for part in short_en_lower.split() if len(part) > 3):
            score += 25.0

        # 2. Current Livelihood (Secondary Driver: max 35.0 points once per course)
        has_livelihood_match = False
        for kw in keywords:
            kw_low = kw.lower()
            if kw_low in livelihood_text and len(kw_low) >= 3 and kw_low not in GENERIC_STOP_WORDS:
                has_livelihood_match = True
                break
        if has_livelihood_match:
            score += 35.0

        # 3. Caller conversation transcript (Exploratory: max 20.0 points)
        matched_transcripts = 0
        for kw in keywords:
            kw_low = kw.lower()
            if kw_low not in GENERIC_STOP_WORDS and len(kw_low) >= 3 and kw_low in transcript_corpus:
                matched_transcripts += 1
                if matched_transcripts <= 2:
                    score += 10.0

        # 4. Family Occupation (Mild Heritage: max 5.0 points once, so it never overpowers caller's own skill)
        has_family_match = False
        for kw in keywords:
            kw_low = kw.lower()
            if kw_low in family_text and len(kw_low) >= 4 and kw_low not in GENERIC_STOP_WORDS:
                has_family_match = True
                break
        if has_family_match:
            score += 5.0

        # 5. Employment Preference alignment (max 5.0 points)
        pathway = c.get("pathway_type", "")
        if any(k in preference_text for k in ["self", "own", "shop", "business", "சுய", "சொந்த", "स्वरोजगार", "స్వయం", "സ്വയം"]):
            if pathway in ("self_employment", "wage_or_self", "home_enterprise"):
                score += 5.0
        elif any(k in preference_text for k in ["wage", "monthly", "company", "salary", "சம்பள", "மாத", "नौकरी", "ఉద్యోగం", "ജോലി"]):
            if pathway in ("wage_employment", "wage_or_self"):
                score += 5.0

        scored.append((score, c))

    # Sort descending by calculated relevance score
    scored.sort(key=lambda x: x[0], reverse=True)

    top_score = scored[0][0]

    # If top score is substantial, select Rank 1 and build top 3 using complementary domain affinity
    if top_score >= 20.0:
        c1 = scored[0][1]
        c1_code = c1.get("qp_code")
        top3_list = [dict(c1)]
        seen_codes = {c1_code}

        # Pull complementary trades from domain affinity map
        affinities = TRADE_AFFINITY_MAP.get(c1_code, [])
        for aff_code in affinities:
            if aff_code not in seen_codes:
                match_c = find_course_in_catalog(aff_code)
                if match_c:
                    top3_list.append(dict(match_c))
                    seen_codes.add(aff_code)
            if len(top3_list) == 3:
                break

        # Fill any remaining slots from scored list
        if len(top3_list) < 3:
            for _, cand in scored[1:]:
                if cand.get("qp_code") not in seen_codes:
                    top3_list.append(dict(cand))
                    seen_codes.add(cand.get("qp_code"))
                if len(top3_list) == 3:
                    break
        top3 = top3_list
    else:
        # Dynamic personalization for general / zero-score cases based on education and preference
        is_self_emp = any(k in preference_text for k in [
            "self", "own", "shop", "business", "enterprise",
            "சுய", "சொந்த", "கடை", "தொழில்", "வியாபாரம்",
            "स्वरोजगार", "खुद", "दुकान", "व्यापार", "उद्योग",
            "స్వయం", "సొంత", "దుకాణం", "వ్యాపారం",
            "സ്വയം", "സ്വന്തം", "കട", "സംരംഭം", "കച്ചവടം"
        ])
        is_higher_edu = any(k in education_text for k in [
            "10", "12", "degree", "graduate", "college", "higher", "secondary",
            "பத்தாம்", "பன்னிரண்டாம்", "பட்டப்படிப்பு", "கல்லூரி",
            "दसवीं", "12वीं", "कॉलेज", "డిగ్రీ", "కాలేజీ", "ബിരുദം"
        ])

        if is_self_emp and is_higher_edu:
            # Educated + Self-Employment: Digital CSC, Retail Kirana, Micro-Enterprise
            defaults = ["AHC/Q1001", "RAS/Q0104", "MEP/Q0101"]
        elif is_self_emp and not is_higher_edu:
            # Practical / Basic + Self-Employment: Tailoring, Two-Wheeler Mechanic, Food Catering
            defaults = ["APP/Q0301", "ASC/Q1401", "FIC/Q0201"]
        elif not is_self_emp and is_higher_edu:
            # Educated + Wage Employment: Digital VLE, Domestic Electrician, Commercial Driver
            defaults = ["AHC/Q1001", "ELE/Q3101", "ASC/Q9705"]
        else:
            # Practical / Basic + Wage Employment: Domestic Electrician, Commercial Driver, Welder
            defaults = ["ELE/Q3101", "ASC/Q9705", "CSC/Q0204"]

        top3 = [dict(find_course_in_catalog(code)) for code in defaults if find_course_in_catalog(code)]

    for idx, item in enumerate(top3, 1):
        item["rank"] = idx
    return top3

