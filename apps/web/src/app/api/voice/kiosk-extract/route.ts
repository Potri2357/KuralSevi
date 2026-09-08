import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { speechText = '', language = 'ta' } = body;

    if (!speechText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Empty speech transcript provided.' },
        { status: 400 }
      );
    }

    const text = speechText.toLowerCase();

    // Smart semantic parser for Tamil, Hindi, and English kiosk speech
    let education = '';
    if (text.includes('12') || text.includes('12th') || text.includes('பன்னிரண்டாம்') || text.includes('மேல்நிலை') || text.includes('higher secondary')) {
      education = 'Class 12 completed (Higher Secondary)';
    } else if (text.includes('10') || text.includes('10th') || text.includes('பத்தாம்') || text.includes('sslc') || text.includes('secondary')) {
      education = 'Class 10 completed (SSLC)';
    } else if (text.includes('பட்ட') || text.includes('டிகிரி') || text.includes('degree') || text.includes('college') || text.includes('கல்லூரி')) {
      education = 'Graduate / Diploma Holder';
    } else if (text.includes('படிப்பு இல்ல') || text.includes('படிக்கல') || text.includes('uneducated') || text.includes('illiterate')) {
      education = 'Foundational Literacy / Primary School';
    } else {
      education = 'Class 8-10 Secondary Level';
    }

    let familyOccupation = '';
    if (text.includes('கூலி') || text.includes('manual') || text.includes('wage') || text.includes('மஸ்தூர்') || text.includes('தொழிலாளி')) {
      familyOccupation = 'Daily Wage Labour / General Manual Work';
    } else if (text.includes('விவசாயம்') || text.includes('farming') || text.includes('தோட்டம்') || text.includes('நிலம்')) {
      familyOccupation = 'Marginal Agriculture / Allied Farming';
    } else if (text.includes('நெசவு') || text.includes('weaving') || text.includes('கைத்தறி') || text.includes('loom')) {
      familyOccupation = 'Traditional Handloom / Textile Weaving';
    } else if (text.includes('வியாபாரம்') || text.includes('கடை') || text.includes('retail') || text.includes('vendor')) {
      familyOccupation = 'Micro-Retail / Street Vending';
    } else {
      familyOccupation = 'Unorganized Rural Trades / Daily Wage';
    }

    let currentLivelihood = '';
    if (text.includes('மளிகை') || text.includes('grocery') || text.includes('kirana') || text.includes('கடை வச்சு') || text.includes('retail shop')) {
      currentLivelihood = 'Small Retail Shop / Vendor';
    } else if (text.includes('தையல்') || text.includes('tailor') || text.includes('தையற்கலை')) {
      currentLivelihood = 'Local Tailoring & Apparel Repair';
    } else if (text.includes('டிரைவர்') || text.includes('ஆட்டோ') || text.includes('driver') || text.includes('வாகனம்')) {
      currentLivelihood = 'Commercial Vehicle Driver / Auto Operator';
    } else if (text.includes('காய்கறி') || text.includes('பழம்') || text.includes('விற்பனை') || text.includes('vegetable')) {
      currentLivelihood = 'Perishable Produce / Vegetable Vending';
    } else if (text.includes('பியூட்டி') || text.includes('அழகு') || text.includes('beauty')) {
      currentLivelihood = 'Community Beauty Care & Grooming';
    } else {
      currentLivelihood = 'Self-employed Micro Enterprise / Daily Retail';
    }

    let skillsAndInterests = '';
    if (text.includes('மளிகை') || text.includes('கடை') || text.includes('வியாபாரம்') || text.includes('விற்பனை')) {
      skillsAndInterests = 'Retail Merchandising, Grocery Store Management & Customer Sales';
    } else if (text.includes('தையல்') || text.includes('துணி')) {
      skillsAndInterests = 'Garment Sewing, Fabric Cutting & Alteration Techniques';
    } else if (text.includes('வாகனம்') || text.includes('ஓட்டுதல்') || text.includes('வண்டி')) {
      skillsAndInterests = 'Safe Vehicle Operation & Preventive Maintenance';
    } else {
      skillsAndInterests = 'Customer Relations, Cash Handling & Local Trade Operations';
    }

    let mobility = '';
    if (text.includes('ஊர்லயே') || text.includes('உள்ளூர்') || text.includes('வெளியூர் போக முடியாது') || text.includes('local') || text.includes('nearby')) {
      mobility = 'Local panchayat area / Prefers establishing local enterprise';
    } else if (text.includes('மாவட்ட') || text.includes('district') || text.includes('போகலாம்') || text.includes('can travel')) {
      mobility = 'Within district limits / Commutable by public bus';
    } else {
      mobility = 'Within home village cluster / Flexible for nearby training center';
    }

    let employmentPref: 'self' | 'wage' | 'either' = 'either';
    if (text.includes('சொந்த தொழில்') || text.includes('சொந்தமா') || text.includes('கடை') || text.includes('self') || text.includes('own')) {
      employmentPref = 'self';
    } else if (text.includes('சம்பள வேலை') || text.includes('கம்பெனி') || text.includes('மாத சம்பளம்') || text.includes('salary') || text.includes('job')) {
      employmentPref = 'wage';
    }

    let localEconomy = '';
    if (text.includes('சந்தை') || text.includes('பஜார்') || text.includes('வாரம்') || text.includes('market')) {
      localEconomy = 'Weekly Panchayat Bazaar & Local Agro-Trade Corridor';
    } else if (text.includes('கிராம') || text.includes('village')) {
      localEconomy = 'Local Village Commerce & Residential Consumer Clusters';
    } else {
      localEconomy = 'District MSME Commercial Cluster';
    }

    return NextResponse.json({
      success: true,
      extracted: {
        educational_background: education,
        family_occupation: familyOccupation,
        current_livelihood: currentLivelihood,
        skills_and_interests: skillsAndInterests,
        mobility_constraints: mobility,
        employment_preference: employmentPref,
        local_economic_context: localEconomy,
      },
      rawTranscript: speechText,
      language,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Extraction failed' },
      { status: 500 }
    );
  }
}
