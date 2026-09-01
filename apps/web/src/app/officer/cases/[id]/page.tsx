import { use } from 'react';
import { CaseDetailView, type CaseDetailData } from '@/features/cases';

const SAMPLE_CASE_DATA: CaseDetailData = {
  case_id: 'KS-2025-00001',
  district: 'Namakkal',
  state: 'Tamil Nadu',
  language: 'Tamil',
  gender: 'Female',
  age_group: '18-30',
  profile: {
    educational_background: '8th Standard completed, can read and write Tamil',
    family_occupation: 'Traditional handloom weaving family (3 generations)',
    current_livelihood: 'Daily wage agricultural labour, seasonal · ~₹4,500/month',
    skills_and_interests: 'Hand stitching, basic tailoring; interested in garment stitching and food processing',
    mobility_constraints: 'Can travel up to 10km · Disability/hard to travel · Caregiving · Working',
    employment_preference: 'Strongly prefers self-employment or home-based work',
    local_economic_context: 'Textile cluster in Namakkal, weekly market, common service centre available',
    completeness: 0.82,
  },
  recommendations: [
    {
      rank: 1,
      qp_code: 'APP/0891',
      qp_name: "Tailor – Woven and Men's Garment",
      nsqf_level: 4,
      pathway_type: 'self_employment',
      matched_skills: ['Hand stitching', 'Basic stitching'],
      skills_to_acquire: ['Pattern making', 'Garment fitting'],
      confidence: 'high',
      topsis_score: 0.87,
      explanation:
        'Recommended because you already have hand stitching and basic stitching skills, are a primary care employment, and are living near textile centres (10km). This makes Tailor (garments/industry) feasible.',
      opportunity: {
        strength: 'high',
        source: 'e-Shram District Data',
        date: 'June 2026',
        evidence: '98%+ placement rate – Namakkal',
      },
      income_range: '₹10,000 – ₹25,000/month',
      travel_feasible: true,
      training_hours: 300,
    },
    {
      rank: 2,
      qp_code: 'FIC/Q5001',
      qp_name: 'Papad and Ready-to-Eat Products Maker',
      nsqf_level: 2,
      pathway_type: 'home_enterprise',
      matched_skills: ['Traditional cooking', 'Packaging'],
      skills_to_acquire: ['Standardized recipes', 'Hygiene standards', 'Local distribution'],
      confidence: 'high',
      topsis_score: 0.79,
      explanation:
        'Recommended as a home-based option ideal given your caregiving responsibilities. Strong local market demand in Namakkal weekly market.',
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
      matched_skills: ['Traditional weaving knowledge'],
      skills_to_acquire: ['Handloom operation', 'Natural dyeing', 'Design replication'],
      confidence: 'medium',
      topsis_score: 0.63,
      explanation:
        "Aligns with your family's 3-generation weaving tradition. Medium confidence due to local demand data being from March 2026 — verify current market conditions.",
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
  // Overlay ID if custom id provided
  const caseId = resolved.id === '1' || resolved.id === '5' ? 'KS-2025-00001' : `KS-2025-${resolved.id.padStart(5, '0')}`;
  const caseData = { ...SAMPLE_CASE_DATA, case_id: caseId };
  return <CaseDetailView caseData={caseData} />;
}
