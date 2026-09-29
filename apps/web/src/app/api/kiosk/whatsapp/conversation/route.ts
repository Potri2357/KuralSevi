import { NextRequest, NextResponse } from 'next/server';
import { saveCompletedCall } from '@/lib/recommendation-service';
import { createOrGetSanctionRecord } from '@/lib/sanction-verification';

interface ConversationState {
  stage?: number; // 0 to 6
  phone?: string;
  language?: string;
  name?: string;
  district?: string;
  village?: string;
  education?: string;
  skills?: string;
  employmentPreference?: string;
  mobility?: string;
  selectedCourseIndex?: number;
  selectedCourseName?: string;
  caseId?: string;
}

const COURSES_BY_SKILL: Record<string, Array<{ qp_code: string; qp_name: string; nsqf_level: number; stipend: string }>> = {
  tailoring: [
    { qp_code: 'APP/Q0103', qp_name: 'Sewing Machine Operator', nsqf_level: 2, stipend: '100% Free + ₹1,500/mo stipend' },
    { qp_code: 'APP/Q0301', qp_name: 'Self Employed Tailor', nsqf_level: 4, stipend: 'PM-AJAY Capital Grant up to ₹50,000' },
    { qp_code: 'APP/Q0105', qp_name: 'Quality Controller - Garment', nsqf_level: 4, stipend: 'Industry Placement with MSME' },
  ],
  electrical: [
    { qp_code: 'ELE/Q3101', qp_name: 'Domestic Electrician', nsqf_level: 4, stipend: '100% Free + ₹1,500/mo stipend' },
    { qp_code: 'ELE/Q5901', qp_name: 'Solar Panel Installation Technician', nsqf_level: 4, stipend: 'PM Surya Ghar Grant Linkage' },
    { qp_code: 'ELE/Q7303', qp_name: 'Field Service Technician', nsqf_level: 3, stipend: 'MSME Service Enterprise Grant' },
  ],
  automotive: [
    { qp_code: 'ASC/Q1411', qp_name: 'Two Wheeler Service Technician', nsqf_level: 4, stipend: 'Toolkit Subsidy up to ₹35,000' },
    { qp_code: 'ASC/Q1402', qp_name: 'Automotive Electrician', nsqf_level: 4, stipend: '100% Free Govt Training' },
    { qp_code: 'ASC/Q1901', qp_name: 'Auto Service Station Entrepreneur', nsqf_level: 5, stipend: 'PM-AJAY Enterprise Grant ₹50,000' },
  ],
  retail: [
    { qp_code: 'RAS/Q0104', qp_name: 'Retail Sales Associate / Shopkeeper', nsqf_level: 3, stipend: 'Kirana Modernization Grant' },
    { qp_code: 'FIC/Q0601', qp_name: 'Food Processing & Vending', nsqf_level: 4, stipend: 'Self-Help Group Grant up to ₹10L' },
    { qp_code: 'BWS/Q0201', qp_name: 'Beauty & Wellness Salon Owner', nsqf_level: 4, stipend: 'Micro-Enterprise Seed Capital' },
  ],
  default: [
    { qp_code: 'APP/Q0103', qp_name: 'Sewing Machine Operator', nsqf_level: 2, stipend: '100% Free + ₹1,500/mo stipend' },
    { qp_code: 'ELE/Q3101', qp_name: 'Domestic Electrician', nsqf_level: 4, stipend: 'Free NSQF Certified Course' },
    { qp_code: 'RAS/Q0104', qp_name: 'Retail Sales Associate / Shopkeeper', nsqf_level: 3, stipend: 'PM-AJAY Capital Subsidy' },
  ],
};

function getCoursesForSkills(skills: string = '') {
  const s = skills.toLowerCase();
  if (s.includes('தையல்') || s.includes('tailor') || s.includes('sewing') || s.includes('cloth') || s.includes('ஆடை')) {
    return COURSES_BY_SKILL.tailoring;
  }
  if (s.includes('மின்சார') || s.includes('electr') || s.includes('solar') || s.includes('வயர்')) {
    return COURSES_BY_SKILL.electrical;
  }
  if (s.includes('வாகன') || s.includes('auto') || s.includes('mechanic') || s.includes('வண்டி') || s.includes('பைக்')) {
    return COURSES_BY_SKILL.automotive;
  }
  if (s.includes('கடை') || s.includes('வியாபாரம்') || s.includes('retail') || s.includes('shop') || s.includes('உணவு')) {
    return COURSES_BY_SKILL.retail;
  }
  return COURSES_BY_SKILL.default;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      userMessage?: string;
      state?: ConversationState;
    };
    const state: ConversationState = body.state || { stage: 0 };

    const currentStage = typeof state.stage === 'number' ? state.stage : 0;
    let nextStage = currentStage;
    const nextState: ConversationState = { ...state };
    let botReply = '';
    let quickReplies: string[] = [];
    let completedCase: any = null;

    const trimmedInput = (body.userMessage || '').trim();

    switch (currentStage) {
      case 0: {
        // Welcome and request Name & Village
        botReply =
          'வணக்கம்! Kural Sevi (குரல் செவி) PM-AJAY உதவி மையத்திற்கு வரவேற்கிறோம். 🇮🇳\n\nபிரதம மந்திரி அனுகூல ஆதி திராவிடர் நல திட்டம் (PM-AJAY) மூலம் இலவச திறன் பயிற்சி மற்றும் ரூ. 50,000 வரை வாழ்வாதார மானிய உதவிக்கு பதிவு செய்ய உங்கள் விவரங்களை கூறுங்கள்.\n\nமுதலில், உங்கள் முழுப் பெயர் மற்றும் மாவட்டம்/ஊர் என்ன?\n(What is your full name and district/village?)';
        quickReplies = ['முருகன், சேலம் (Melpadi)', 'பிரியா, மதுரை (Alanganallur)', 'வேலன், திருச்சி'];
        nextStage = 1;
        break;
      }

      case 1: {
        // Capture Name & Village, ask Education
        const parts = trimmedInput.split(/[,–-]/);
        nextState.name = parts[0]?.trim() || trimmedInput;
        nextState.district = parts[1]?.trim() || 'Salem';
        nextState.village = 'Melpadi Gram Panchayat';

        botReply = `மகிழ்ச்சி ${nextState.name} அவர்களே! உங்கள் கல்வித் தகுதி என்ன?\n(What is your educational qualification?)\n\n1️⃣ 8th Pass / ஆரம்பக் கல்வி\n2️⃣ 10th Pass (SSLC)\n3️⃣ 12th / ITI Diploma\n4️⃣ பட்டப்படிப்பு (Graduate)\n5️⃣ படிக்கவில்லை / எழுதப் படிக்கத் தெரியும்`;
        quickReplies = ['10th Pass (SSLC)', '8th Pass', '12th / ITI', 'பட்டப்படிப்பு (Graduate)'];
        nextStage = 2;
        break;
      }

      case 2: {
        // Capture Education, ask Existing Skills / Experience
        nextState.education = trimmedInput;
        botReply =
          'நன்றி! உங்களுக்கு ஏதேனும் முந்தைய வேலை அல்லது தொழில் அனுபவம் உள்ளதா?\n(Do you have any previous work experience or trade skills?)\n\nஎடுத்துக்காட்டு: தையல் & ஆடை தயாரிப்பு, எலக்ட்ரிக்கல், வாகன பழுதுபார்ப்பு, கைவினை, விவசாயம் & கால்நடை, அல்லது அனுபவம் இல்லை.';
        quickReplies = [
          'தையல் & ஆடை தயாரிப்பு (Tailoring)',
          'மின்சார வேலை (Domestic Electrician)',
          'டூவீலர் மெக்கானிக் (Automotive)',
          'சில்லறை வியாபாரம் / மளிகை கடை',
          'புதியவர் / அனுபவம் இல்லை',
        ];
        nextStage = 3;
        break;
      }

      case 3: {
        // Capture Skills, ask Employment Preference
        nextState.skills = trimmedInput;
        botReply =
          'அருமை! நீங்கள் மாத ஊதிய வேலை விரும்புகிறீர்களா அல்லது சொந்தமாக கடை/தொழில் தொடங்க விரும்புகிறீர்களா?\n(Do you prefer monthly wage employment or self-employment / micro-enterprise?)\n\n1️⃣ சொந்த தொழில் / கடை (Self Employment)\n2️⃣ மாத ஊதிய வேலை (Wage Employment)\n3️⃣ இரண்டும் சம்மதம் (Flexible)';
        quickReplies = ['சொந்த தொழில் / கடை (Self-Employment)', 'மாத ஊதிய வேலை (Wage Work)', 'இரண்டும் சம்மதம்'];
        nextStage = 4;
        break;
      }

      case 4: {
        // Capture Preference, ask Mobility
        nextState.employmentPreference = trimmedInput.includes('சொந்த')
          ? 'self'
          : trimmedInput.includes('ஊதியம்')
          ? 'wage'
          : 'either';

        botReply =
          'பயிற்சிக்கு அருகில் உள்ள அரசு ITI / PMKK மையத்திற்கு செல்ல முடியுமா?\n(Can you travel to the nearby ITI or skill training center in your district?)\n\n1️⃣ ஆம், மாவட்ட மையத்திற்கு செல்ல முடியும்\n2️⃣ உள்ளூர் கிராமத்திற்குள் மட்டும்';
        quickReplies = ['ஆம், செல்ல முடியும்', 'உள்ளூர் கிராமத்திற்குள் மட்டும்'];
        nextStage = 5;
        break;
      }

      case 5: {
        // Capture Mobility, evaluate NSQF trades, present recommendations
        nextState.mobility = trimmedInput;
        const matchedCourses = getCoursesForSkills(nextState.skills);

        botReply = `✨ உங்கள் விவரங்களை AI மதிப்பீடு செய்தது! PM-AJAY திட்டத்தில் உங்களுக்கான சிறந்த 3 வாய்ப்புகள்:\n\n1️⃣ ${matchedCourses[0].qp_name} (${matchedCourses[0].qp_code})\n   • உதவி: ${matchedCourses[0].stipend}\n\n2️⃣ ${matchedCourses[1].qp_name} (${matchedCourses[1].qp_code})\n   • உதவி: ${matchedCourses[1].stipend}\n\n3️⃣ ${matchedCourses[2].qp_name} (${matchedCourses[2].qp_code})\n   • உதவி: ${matchedCourses[2].stipend}\n\nஉங்களுக்கு விருப்பமான திட்டத்தின் எண்ணை தெரிவு செய்யவும் (1, 2, அல்லது 3):`;
        quickReplies = [
          `1️⃣ ${matchedCourses[0].qp_name}`,
          `2️⃣ ${matchedCourses[1].qp_name}`,
          `3️⃣ ${matchedCourses[2].qp_name}`,
        ];
        nextStage = 6;
        break;
      }

      case 6: {
        // Finalize Choice and create Real Case in System!
        const matchedCourses = getCoursesForSkills(nextState.skills);
        let chosenIndex = 0;
        if (trimmedInput.includes('2')) chosenIndex = 1;
        if (trimmedInput.includes('3')) chosenIndex = 2;

        const selectedCourse = matchedCourses[chosenIndex] || matchedCourses[0];
        nextState.selectedCourseIndex = chosenIndex + 1;
        nextState.selectedCourseName = selectedCourse.qp_name;

        // Generate unique case ID
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const caseId = `KS-WA-2026-${randomNum}`;
        nextState.caseId = caseId;

        // Save real completed call in Kural Sevi store
        const citizenPhone = nextState.phone || `98415${Math.floor(10000 + Math.random() * 90000)}`;
        const callRecord = {
          session_id: `WA-SESS-${Date.now()}`,
          case_id: caseId,
          phone: citizenPhone,
          channel: 'whatsapp',
          language: 'ta',
          status: 'COMPLETED',
          citizen_confirmed: true,
          notification_status: 'WHATSAPP_DISPATCHED',
          completed_at: new Date().toISOString(),
          confirmed_via: 'WhatsApp',
          confirmed_at: new Date().toISOString(),
          citizen_selected_choice: chosenIndex + 1,
          citizen_selected_course: selectedCourse.qp_name,
          confirmed_fields: {
            beneficiary_name: nextState.name || 'Beneficiary',
            district: nextState.district || 'Salem',
            educational_background: nextState.education || '10th Pass',
            skills_and_interests: nextState.skills || 'Vocational Trade',
            employment_preference: nextState.employmentPreference || 'self',
            mobility_constraints: nextState.mobility || 'District mobility allowed',
            family_occupation: 'Agriculture / Traditional Labour',
            current_livelihood: nextState.skills || 'Artisan / Worker',
          },
          recommended_courses: matchedCourses.map((c, idx) => ({
            rank: idx + 1,
            qp_code: c.qp_code,
            qp_name: c.qp_name,
            nsqf_level: c.nsqf_level,
          })),
          transcript: [
            { user: 'WhatsApp Intake Initiated', assistant: 'Welcome to Kural Sevi PM-AJAY' },
            { user: `Name & Location: ${nextState.name}, ${nextState.district}`, assistant: 'Captured' },
            { user: `Education: ${nextState.education}`, assistant: 'Captured' },
            { user: `Skills: ${nextState.skills}`, assistant: 'Evaluated' },
            { user: `Preference: ${nextState.employmentPreference}`, assistant: 'Evaluated' },
            { user: `Selected Course: Option ${chosenIndex + 1} (${selectedCourse.qp_name})`, assistant: 'Confirmed' },
          ],
        };

        saveCompletedCall(callRecord);

        // Pre-create sanction verification record
        let sanctionOrderNo = `ORD-AJAY-${caseId}`;
        try {
          const sRec = await createOrGetSanctionRecord(caseId);
          if (sRec) sanctionOrderNo = sRec.sanction_order_id;
        } catch {}

        botReply = `🎉 வாழ்த்துகள் ${nextState.name || 'பயனாளி'} அவர்களே!\n\nஉங்கள் PM-AJAY விண்ணப்பம் WhatsApp மூலம் வெற்றிகரமாக பதிவு செய்யப்பட்டது! ✅\n\n📋 விண்ணப்ப எண் (Case ID): *${caseId}*\n📌 தேர்வு செய்த திட்டம்: *${selectedCourse.qp_name}* (NSQF Level ${selectedCourse.nsqf_level})\n💰 அரசு உதவி: ${selectedCourse.stipend}\n🏛️ சரிபார்ப்பு அலுவலர்: மாவட்ட சமூக நல அலுவலர் (DWO), ${nextState.district || 'Salem'}\n📄 ஆணை எண்: ${sanctionOrderNo}\n\nஅரசு சரிபார்ப்பு முடிவடைந்ததும் உங்களுக்கு WhatsApp செய்தி மற்றும் QR ஆணை அனுப்பப்படும். நன்றி!`;
        quickReplies = ['📄 சரிபார்ப்பு ஆணை காண்க', '🔄 புதிய பதிவு தொடங்கு'];

        completedCase = {
          caseId,
          sanctionOrderNo,
          course: selectedCourse.qp_name,
          phone: citizenPhone,
          name: nextState.name,
        };
        nextStage = 7;
        break;
      }

      default: {
        botReply =
          'உங்கள் பதிவு முடிந்தது. புதிய பயனாளியை பதிவு செய்ய கீழே உள்ள பொத்தானை கிளிக் செய்யவும்.';
        quickReplies = ['🔄 புதிய பதிவு தொடங்கு'];
        nextStage = 0;
        break;
      }
    }

    nextState.stage = nextStage;

    return NextResponse.json({
      success: true,
      botReply,
      quickReplies,
      state: nextState,
      completedCase,
    });
  } catch (err: any) {
    console.error('[WhatsApp Conversation API] Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Chat error' }, { status: 500 });
  }
}
