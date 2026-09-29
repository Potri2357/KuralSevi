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
  if (s.includes('தையல்') || s.includes('सिलाई') || s.includes('वस्त्र') || s.includes('tailor') || s.includes('sewing') || s.includes('cloth') || s.includes('ஆடை')) {
    return COURSES_BY_SKILL.tailoring;
  }
  if (s.includes('மின்சார') || s.includes('बिजली') || s.includes('वायरिंग') || s.includes('इलेक्ट्री') || s.includes('electr') || s.includes('solar') || s.includes('வயர்')) {
    return COURSES_BY_SKILL.electrical;
  }
  if (s.includes('வாகன') || s.includes('गाड़ी') || s.includes('वाहन') || s.includes('मैकेनिक') || s.includes('auto') || s.includes('mechanic') || s.includes('வண்டி') || s.includes('பைக்')) {
    return COURSES_BY_SKILL.automotive;
  }
  if (s.includes('கடை') || s.includes('दुकान') || s.includes('व्यापार') || s.includes('किराना') || s.includes('வியாபாரம்') || s.includes('retail') || s.includes('shop') || s.includes('உணவு')) {
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
          'नमस्ते! Kural Sevi (कुराल सेवी) PM-AJAY AI सहायता केंद्र में आपका स्वागत है। 🇮🇳\n\nप्रधानमंत्री अनुसूचित जाति अभ्युदय योजना (PM-AJAY) के तहत निःशुल्क कौशल प्रशिक्षण एवं ₹50,000 तक की आजीविका सहायता हेतु अपना विवरण दर्ज कराएं।\n\nकृपया अपना पूरा नाम और जिला/गाँव बताएं:\n(What is your full name and district/village?)';
        quickReplies = ['रमेश कुमार, सलेम (Melpadi)', 'सुनीता, मदुरै (Alanganallur)', 'राजेश, त्रिची'];
        nextStage = 1;
        break;
      }

      case 1: {
        // Capture Name & Village, ask Education
        const parts = trimmedInput.split(/[,–-]/);
        nextState.name = parts[0]?.trim() || trimmedInput;
        nextState.district = parts[1]?.trim() || 'Salem';
        nextState.village = 'Melpadi Gram Panchayat';

        botReply = `बहुत बढ़िया ${nextState.name} जी! आपकी शैक्षणिक योग्यता क्या है?\n(What is your educational qualification?)\n\n1️⃣ 8वीं पास (8th Pass)\n2️⃣ 10वीं पास (10th Pass / High School)\n3️⃣ 12वीं / ITI डिप्लोमा\n4️⃣ स्नातक (Graduate)\n5️⃣ कोई औपचारिक शिक्षा नहीं (No Formal Education)`;
        quickReplies = ['10वीं पास (10th Pass)', '8वीं पास (8th Pass)', '12वीं / ITI', 'स्नातक (Graduate)'];
        nextStage = 2;
        break;
      }

      case 2: {
        // Capture Education, ask Existing Skills / Experience
        nextState.education = trimmedInput;
        botReply =
          'धन्यवाद! क्या आपके पास कोई पूर्व कार्य अनुभव या कौशल है?\n(Do you have any previous work experience or trade skills?)\n\nउदाहरण: सिलाई एवं वस्त्र निर्माण, इलेक्ट्रीशियन, वाहन मरम्मत (ऑटोमोटिव), खुदरा व्यापार/दुकान, कृषि, या कोई अनुभव नहीं।';
        quickReplies = [
          'सिलाई एवं वस्त्र (Tailoring)',
          'इलेक्ट्रीशियन (Domestic Electrician)',
          'दोपहिया मैकेनिक (Automotive)',
          'खुदरा व्यापार/किराना दुकान',
          'कोई अनुभव नहीं (Fresh Learner)',
        ];
        nextStage = 3;
        break;
      }

      case 3: {
        // Capture Skills, ask Employment Preference
        nextState.skills = trimmedInput;
        botReply =
          'शानदार! आप मासिक वेतन वाली नौकरी चाहते हैं या अपनी स्वयं की दुकान/व्यवसाय शुरू करना चाहते हैं?\n(Do you prefer monthly wage employment or self-employment?)\n\n1️⃣ स्वरोजगार / अपनी दुकान (Self Employment)\n2️⃣ मासिक वेतन रोजगार (Wage Employment)\n3️⃣ दोनों स्वीकार्य (Flexible)';
        quickReplies = ['स्वरोजगार / दुकान (Self-Employment)', 'मासिक वेतन नौकरी (Wage Work)', 'दोनों स्वीकार्य (Flexible)'];
        nextStage = 4;
        break;
      }

      case 4: {
        // Capture Preference, ask Mobility
        nextState.employmentPreference = (trimmedInput.includes('சொந்த') || trimmedInput.includes('स्वरोजगार') || trimmedInput.includes('दुकान') || trimmedInput.includes('self'))
          ? 'self'
          : (trimmedInput.includes('ஊதியம்') || trimmedInput.includes('वेतन') || trimmedInput.includes('नौकरी') || trimmedInput.includes('wage'))
          ? 'wage'
          : 'either';

        botReply =
          'क्या आप प्रशिक्षण के लिए नजदीकी सरकारी ITI या PMKK कौशल केंद्र जा सकते हैं?\n(Can you travel to the nearby ITI or skill training center in your district?)\n\n1️⃣ हाँ, जिला केंद्र जा सकते हैं\n2️⃣ केवल स्थानीय गाँव के भीतर';
        quickReplies = ['हाँ, जा सकते हैं (Can Travel)', 'केवल स्थानीय गाँव (Local Only)'];
        nextStage = 5;
        break;
      }

      case 5: {
        // Capture Mobility, evaluate NSQF trades, present recommendations
        nextState.mobility = trimmedInput;
        const matchedCourses = getCoursesForSkills(nextState.skills);

        botReply = `✨ AI ने आपके विवरण का मूल्यांकन किया! PM-AJAY योजना में आपके लिए शीर्ष 3 अवसर:\n\n1️⃣ ${matchedCourses[0].qp_name} (${matchedCourses[0].qp_code})\n   • सहायता: ${matchedCourses[0].stipend}\n\n2️⃣ ${matchedCourses[1].qp_name} (${matchedCourses[1].qp_code})\n   • सहायता: ${matchedCourses[1].stipend}\n\n3️⃣ ${matchedCourses[2].qp_name} (${matchedCourses[2].qp_code})\n   • सहायता: ${matchedCourses[2].stipend}\n\nकृपया अपनी पसंदीदा योजना का विकल्प चुनें (1, 2, या 3):`;
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
          language: 'hi',
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

        botReply = `🎉 बधाई हो ${nextState.name || 'नागरिक'} जी!\n\nआपका PM-AJAY आवेदन WhatsApp के माध्यम से सफलतापूर्वक दर्ज कर लिया गया है! ✅\n\n📋 आवेदन संख्या (Case ID): *${caseId}*\n📌 चयनित योजना: *${selectedCourse.qp_name}* (NSQF Level ${selectedCourse.nsqf_level})\n💰 सरकारी सहायता: ${selectedCourse.stipend}\n🏛️ सत्यापन अधिकारी: जिला कल्याण अधिकारी (DWO), ${nextState.district || 'Salem'}\n📄 स्वीकृति आदेश संख्या: ${sanctionOrderNo}\n\nसत्यापन पूरा होने पर आपको WhatsApp संदेश एवं डिजिटल QR स्वीकृति आदेश भेजा जाएगा। धन्यवाद!`;
        quickReplies = ['📄 स्वीकृति आदेश देखें', '🔄 नया पंजीकरण शुरू करें'];

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
          'आपका पंजीकरण पूरा हो चुका है। नया पंजीकरण शुरू करने के लिए नीचे दिए गए बटन पर क्लिक करें।';
        quickReplies = ['🔄 नया पंजीकरण शुरू करें'];
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
