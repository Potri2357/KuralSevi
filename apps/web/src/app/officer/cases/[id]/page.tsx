import { use } from 'react';
import { CaseDetailView, type CaseDetailData } from '@/features/cases';

const SAMPLE_CASE_DATA: CaseDetailData = {
  case_id: 'KS-2026-00142',
  district: 'Namakkal',
  state: 'Tamil Nadu',
  language: 'Tamil',
  gender: 'Female',
  age_group: '26-35',
  profile: {
    educational_background: '8th Standard completed, can read and write Tamil',
    family_occupation: 'Traditional handloom weaving family (3 generations)',
    current_livelihood: 'Daily wage agricultural labour, seasonal, ~₹4,500/month',
    skills_and_interests: 'Hand stitching, basic tailoring, interested in garment stitching and food processing',
    mobility_constraints: 'Can travel up to 10km, no disability, has 2 young children (caregiving ~3hrs/day)',
    employment_preference: 'Strongly prefers self-employment or home-based work',
    local_economic_context: 'Textile cluster in Namakkal, weekly market, common service centre available',
    completeness: 0.92,
  },
  recommendations: [
    {
      rank: 1,
      qp_code: 'APP/Q0301',
      qp_name: 'Tailor — Women\'s and Men\'s Garment',
      nsqf_level: 4,
      pathway_type: 'self_employment',
      matched_skills: ['hand_stitching', 'basic_stitching'],
      skills_to_acquire: ['pattern_making', 'garment_fitting'],
      confidence: 'high',
      topsis_score: 0.87,
      explanation: "Recommended because you already have hand stitching and basic stitching skills, you prefer self-employment, and tailoring opportunities are strong in Namakkal district (45+ registered tailoring MSMEs).",
      opportunity: {
        strength: 'high',
        source: 'e-Shram District Data',
        date: 'June 2026',
        evidence: '45 MSMEs in garment sector, Namakkal',
      },
      income_range: '₹8,000 – ₹25,000/month',
      travel_feasible: true,
      training_hours: 300,
    },
    {
      rank: 2,
      qp_code: 'FIC/Q5001',
      qp_name: 'Papad and Ready-to-Eat Products Maker',
      nsqf_level: 2,
      pathway_type: 'home_enterprise',
      matched_skills: ['traditional_cooking'],
      skills_to_acquire: ['standardized_recipes', 'hygiene', 'pricing', 'local_distribution'],
      confidence: 'high',
      topsis_score: 0.79,
      explanation: "Recommended as a home-based option ideal given your caregiving responsibilities. Strong local market demand in Namakkal weekly market.",
      opportunity: {
        strength: 'medium',
        source: 'District Industrial Profile',
        date: 'March 2026',
        evidence: 'Growing self-help group food enterprises in district',
      },
      income_range: '₹4,000 – ₹15,000/month',
      travel_feasible: true,
      training_hours: 80,
    },
    {
      rank: 3,
      qp_code: 'HAN/Q0101',
      qp_name: 'Handloom Weaver',
      nsqf_level: 3,
      pathway_type: 'home_enterprise',
      matched_skills: ['traditional_weaving_knowledge'],
      skills_to_acquire: ['handloom_operation', 'natural_dyeing', 'design_replication'],
      confidence: 'medium',
      topsis_score: 0.63,
      explanation: "Aligns with your family's 3-generation weaving tradition. Medium confidence due to local demand data being from March 2026 — verify current market conditions.",
      opportunity: {
        strength: 'medium',
        source: 'e-Shram District Data',
        date: 'March 2026',
        evidence: '12 handloom cooperative members in district',
      },
      income_range: '₹6,000 – ₹20,000/month',
      travel_feasible: true,
      training_hours: 180,
    },
  ],
};

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  // Dynamically overlay the resolved ID if needed
  const caseData = { ...SAMPLE_CASE_DATA, case_id: `KS-2026-${resolved.id.padStart(5, '0')}` };
  return <CaseDetailView caseData={caseData} />;
}
