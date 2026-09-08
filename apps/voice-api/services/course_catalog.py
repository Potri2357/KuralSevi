"""
Kural Sevi — PM-AJAY Vocational Course Catalog & Formatting
Contains official NSQF Qualification Pack (QP) courses with localized translations
(Tamil, Hindi, Malayalam, Telugu) and smart catalog lookups.
"""
from typing import Optional, List, Dict, Any, Tuple

CATALOG_COURSES = [
    {
        "rank": 1,
        "qp_code": "LSS/Q2301",
        "qp_name": "Footwear & Leather Goods Specialist / Shopkeeper",
        "short_en": "Footwear & Leather",
        "ta_name": "தோல் மற்றும் காலணி தயாரிப்பு பயிற்சி",
        "hi_name": "चमड़ा और जूता निर्माण प्रशिक्षण",
        "ml_name": "ലെതർ, പാദരക്ഷാ നിർമ്മാണ പരിശീലനം",
        "te_name": "పాదరక్షలు మరియు లెదర్ వస్తువుల తయారీ శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["செருப்பு", "பாதணி", "தோல்", "சப்பல்", "காலணி", "footwear", "shoe", "shoes", "chappal", "leather", "जूता", "चप्पल", "పాదరక్షలు"],
        "duration_hours": 240,
    },
    {
        "rank": 2,
        "qp_code": "AGR/Q4301",
        "qp_name": "Small Poultry Farmer & Meat Retailer",
        "short_en": "Poultry Farmer",
        "ta_name": "கோழிப்பண்ணை மற்றும் இறைச்சி விற்பனை பயிற்சி",
        "hi_name": "मुर्गी पालन और पोल्ट्री व्यवसाय प्रशिक्षण",
        "ml_name": "കോഴി വളർത്തൽ പരിശീലനം",
        "te_name": "కోళ్ల పెంపకం మరియు వ్యాపార శిక్షణ",
        "nsqf_level": 3,
        "keywords": ["poultry", "farmer", "chicken", "farm", "கோழி", "பண்ணை", "கோழிப்பண்ணை", "முட்டை", "broiler", "விவசாயம்"],
        "duration_hours": 160,
    },
    {
        "rank": 3,
        "qp_code": "RAS/Q0104",
        "qp_name": "Retail Sales Associate / Shopkeeper",
        "short_en": "Retail Sales",
        "ta_name": "மளிகை மற்றும் சில்லறை விற்பனைக் கடை பயிற்சி",
        "hi_name": "किराना दुकान और खुदरा बिक्री प्रशिक्षण",
        "ml_name": "റീട്ടെയിൽ വിൽപന, പലചരക്ക് കട പരിശീലനം",
        "te_name": "కిరాణా దుకాణం మరియు రిటైల్ అమ్మకాల శిక్షణ",
        "nsqf_level": 3,
        "keywords": ["retail", "shop", "grocery", "store", "vendor", "மளிகை", "கடை", "வியாபாரம்", "kirana", "மல்லிகை", "கடைக்காரர்"],
        "duration_hours": 120,
    },
    {
        "rank": 4,
        "qp_code": "AGR/Q4101",
        "qp_name": "Dairy Farmer & Milk Processing Operator",
        "short_en": "Dairy Farmer",
        "ta_name": "கால்நடை வளர்ப்பு மற்றும் பால் பண்ணை பயிற்சி",
        "hi_name": "डेयरी फार्मिंग और दुग्ध व्यवसाय प्रशिक्षण",
        "ml_name": "ക്ഷീരകർഷക, പാൽ സംസ്കരണ പരിശീലനം",
        "te_name": "పాడి పరిశ్రమ మరియు పాల వ్యాపార శిక్షణ",
        "nsqf_level": 3,
        "keywords": ["பால்", "மாடு", "ஆடு", "dairy", "milk", "cattle", "பண்ணை", "கறவை"],
        "duration_hours": 150,
    },
    {
        "rank": 5,
        "qp_code": "APP/Q0301",
        "qp_name": "Tailor - Garment Construction",
        "short_en": "Tailor",
        "ta_name": "தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி",
        "hi_name": "सिलाई और वस्त्र निर्माण प्रशिक्षण",
        "ml_name": "ടെയ്‌ലറിംഗ്, വസ്ത്ര നിർമ്മാണ പരിശീലനം",
        "te_name": "టైలరింగ్ మరియు దుస్తుల తయారీ శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["tailor", "stitching", "garment", "sewing", "தையல்", "ஆடை", "துணி", "dress"],
        "duration_hours": 300,
    },
    {
        "rank": 6,
        "qp_code": "ASC/Q1401",
        "qp_name": "Automotive Service Technician (Two-Wheeler)",
        "short_en": "Two-Wheeler Mechanic",
        "ta_name": "டூவீலர் மெக்கானிக் பயிற்சி",
        "hi_name": "दोपहिया वाहन मैकेनिक प्रशिक्षण",
        "ml_name": "ടൂവീലർ മെക്കാനിക്ക് പരിശീലനം",
        "te_name": "టూవీలర్ మెకానిక్ శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["mechanic", "bike", "auto", "மெக்கானிக்", "பைக்", "வண்டி", "டூவீலர்", "workshop"],
        "duration_hours": 240,
    },
    {
        "rank": 7,
        "qp_code": "BWS/Q0201",
        "qp_name": "Beauty Therapist & Salon Stylist",
        "short_en": "Beauty & Salon",
        "ta_name": "அழகுக்கலை மற்றும் சலூன் பயிற்சி",
        "hi_name": "ब्यूटी पार्लर और सैलून प्रशिक्षण",
        "ml_name": "ബ്യൂട്ടി പാർലർ, സലൂൺ പരിശീലനം",
        "te_name": "బ్యూటీ పార్లర్ మరియు సెలూన్ శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["beauty", "parlour", "salon", "therapy", "makeup", "அழகு", "சலூன்", "skin"],
        "duration_hours": 300,
    },
    {
        "rank": 8,
        "qp_code": "ELE/Q3104",
        "qp_name": "Field Technician - Home Appliances & Wiring",
        "short_en": "Home Appliances Repair",
        "ta_name": "வீட்டு உபயோக மின்சாதனங்கள் பழுதுநீக்கும் பயிற்சி",
        "hi_name": "घरेलू बिजली उपकरण मरम्मत प्रशिक्षण",
        "ml_name": "ഇലക്ട്രിക്കൽ റിപ്പയറിംഗ് പരിശീലനം",
        "te_name": "గృహోపకరణాల ఎలక్ట్రికల్ మరమ్మతు శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["electric", "appliance", "technician", "repair", "motor", "மின்சாரம்", "mechanic", "வயரிங்"],
        "duration_hours": 240,
    },
    {
        "rank": 9,
        "qp_code": "FIC/Q0201",
        "qp_name": "Food Catering & Pickle Making Technician",
        "short_en": "Food & Catering",
        "ta_name": "உணவு தயாரிப்பு மற்றும் கேட்டரிங் பயிற்சி",
        "hi_name": "खाद्य प्रसंस्करण और कैटरिंग प्रशिक्षण",
        "ml_name": "ഭക്ഷണ നിർമ്മാണവും കാറ്ററിംഗും",
        "te_name": "ఫుడ్ కేటరింగ్ మరియు పచ్చళ్ల తయారీ శిక్షణ",
        "nsqf_level": 3,
        "keywords": ["food", "pickle", "cooking", "catering", "உணவு", "ஊறுகாய்", "சமையல்", "ஹோட்டல்", "சாப்பாடு"],
        "duration_hours": 150,
    },
    {
        "rank": 10,
        "qp_code": "MEP/Q0101",
        "qp_name": "Micro-Enterprise & Rural Store Operator",
        "short_en": "Rural Store Operator",
        "ta_name": "கிராமப்புற சிறுதொழில் மற்றும் சுயதொழில் பயிற்சி",
        "hi_name": "ग्रामीण लघु उद्योग और स्वरोजगार प्रशिक्षण",
        "ml_name": "ചെറുകിട സംരംഭവും സ്വയംതൊഴിലും",
        "te_name": "చిన్న వ్యాపారం మరియు స్వయం ఉపాధి శిక్షణ",
        "nsqf_level": 4,
        "keywords": ["business", "enterprise", "தொழில்", "சொந்த", "வியாபாரம்", "பிசினஸ்", "முதலீடு"],
        "duration_hours": 180,
    },
]


def get_localized_course_name(course: dict, lang: str = "ta") -> str:
    """Returns the natural conversational course name for the given language."""
    if not course:
        return "பயிற்சி"
    key = f"{lang}_name"
    if key in course and course[key]:
        return course[key]
    return course.get("ta_name") or course.get("qp_name", "பயிற்சி").split("-")[0].strip()


def get_short_english_name(course: dict) -> str:
    """Returns clean, short English descriptor (e.g., 'Tailor', 'Retail Sales')."""
    if not course:
        return "Course"
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
        for lang_key in ["ta_name", "hi_name", "ml_name", "te_name"]:
            if c.get(lang_key, "").lower() == target:
                return c

    # Fuzzy / substring match
    for c in CATALOG_COURSES:
        if target in c.get("qp_name", "").lower() or c.get("qp_name", "").lower() in target:
            return c
        for lang_key in ["ta_name", "hi_name", "ml_name", "te_name"]:
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
    recommended_courses: Optional[List[dict]] = None
) -> Tuple[str, str, str]:
    """
    Builds the 3-part Selected Course block for WhatsApp:
    Returns (header_text, native_course_bold_line, details_in_parentheses_line).
    Example:
      உங்களால் தேர்ந்தெடுக்கப்பட்ட பயிற்சி:
      🎯 *தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி*
      _(Tailor - Garment Construction | QP Code: APP/Q0301)_
    """
    header_map = {
        "ta": "உங்களால் தேர்ந்தெடுக்கப்பட்ட பயிற்சி:",
        "hi": "आपके द्वारा चुना गया PM-AJAY कौशल कोर्स:",
        "ml": "നിങ്ങൾ തിരഞ്ഞെടുത്ത PM-AJAY കോഴ്സ്:",
        "te": "మీరు ఎంచుకున్న PM-AJAY కోర్సు:",
        "en": "Selected PM-AJAY Vocational Course:",
    }
    header = header_map.get(lang, header_map["ta"])

    course_dict = None
    if isinstance(course_name_or_dict, dict):
        course_dict = dict(course_name_or_dict)
    else:
        # Check recommended_courses list first
        if recommended_courses:
            for rc in recommended_courses:
                if str(course_name_or_dict).strip().lower() in rc.get("qp_name", "").lower():
                    course_dict = dict(rc)
                    break
        if not course_dict:
            found = find_course_in_catalog(str(course_name_or_dict))
            if found:
                course_dict = dict(found)

    # Enrich from master catalog if translations or fields are missing
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


def format_recommended_course_item(idx: int, course: dict, lang: str = "ta") -> str:
    """
    Formats a recommended course item for WhatsApp:
    Example:
      1. *தையல் மற்றும் ஆடை வடிவமைப்பு பயிற்சி* (Tailor) - NSQF Level 4 (300 hrs)
    """
    native_name = get_localized_course_name(course, lang)
    short_en = get_short_english_name(course)
    nsqf_lvl = course.get("nsqf_level", 3)
    duration = f" ({course.get('duration_hours')} hrs)" if course.get("duration_hours") else ""
    return f"{idx}. *{native_name}* ({short_en}) - NSQF Level {nsqf_lvl}{duration}"


def compute_top_recommended_courses(confirmed_fields: dict, transcript: Optional[list] = None) -> list:
    """Scores NSQF trade catalog against citizen profile fields AND conversation transcript."""
    parts = [str(v).lower() for v in confirmed_fields.values()]
    if transcript:
        for t in transcript:
            if isinstance(t, dict):
                user_say = t.get("user") or ""
                if user_say:
                    parts.append(user_say.lower())
    text_corpus = " ".join(parts)

    scored = []
    for c in CATALOG_COURSES:
        score = 0
        for kw in c["keywords"]:
            if kw.lower() in text_corpus:
                score += 10
        scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    top3 = [dict(x[1]) for x in scored[:3]]
    for idx, item in enumerate(top3, 1):
        item["rank"] = idx
    return top3
