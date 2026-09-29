import Link from 'next/link';
import { Metadata } from 'next';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  GraduationCap,
  Briefcase,
  Home,
  FileText,
  Phone,
  HelpCircle,
  Clock,
  Building,
  UserCheck,
  Award,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Wrench,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { IndicEar, IndicChakra } from '@/components/icons/indic';

export const metadata: Metadata = {
  title: 'PM-AJAY | Pradhan Mantri Anusuchit Jaati Abhyuday Yojana — Official Portal',
  description:
    'Official information and scheme guidelines for PM-AJAY (Pradhan Mantri Anusuchit Jaati Abhyuday Yojana) under the Ministry of Social Justice and Empowerment, Government of India. Explore skill training jobs, livelihood grants, and Adarsh Gram benefits.',
};

const SCHEME_COMPONENTS = [
  {
    id: 'skill-training',
    tag: 'Component 1 · Employment & Jobs',
    icon: GraduationCap,
    headerColor: 'text-[#0B3064]',
    badgeBg: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
    title: 'Skill Development & Vocational Training',
    hindiTitle: 'कौशल विकास एवं व्यावसायिक प्रशिक्षण',
    summary:
      'Free NSQF-certified vocational training mapped to national QP-NOS standards, designed to prepare Scheduled Caste youth for formal wage employment and self-employment.',
    stipend: '₹1,500/month training stipend + 100% course fee covered',
    jobRoles: [
      'Apparel & Garment: Sewing Machine Operator, Quality Assessor',
      'Automotive: Two/Four-Wheeler Maintenance & Electrical Technician',
      'Electronics: Mobile Phone Hardware Engineer, Solar Panel Installer',
      'Healthcare: General Duty Assistant, Home Health Aide',
      'Construction & Utilities: Domestic Electrician, Plumber, Mason',
      'IT & Digital: Data Entry Operator, DTP Operator, Customer Care',
    ],
    highlights: [
      'National Skill Qualification Framework (NSQF Levels 3–6)',
      'Direct job placement tie-ups with MSMEs and industrial units',
      'Free toolkit and course materials provided upon enrollment',
      'Recognized certificate awarded by National Skill Development Corporation',
    ],
  },
  {
    id: 'livelihood-grants',
    tag: 'Component 2 · Enterprise & Grants',
    icon: Briefcase,
    headerColor: 'text-[#C24810]',
    badgeBg: 'bg-[#FFF4ED] text-[#C24810] border-[#FDD8C2]',
    title: 'Grant-in-Aid for Livelihood & Self-Employment',
    hindiTitle: 'आजीविका एवं सूक्ष्म उद्यम सहायता अनुदान',
    summary:
      'Direct capital subsidy grants and financial assistance to help SC beneficiaries establish sustainable micro-enterprises and generate steady household income.',
    stipend: 'Individual grants up to ₹50,000 · SHG Cluster grants up to ₹10 Lakhs',
    jobRoles: [
      'Dairy & Animal Husbandry: Milking units, cattle feed units, goatery',
      'Artisan & Weaving: Powerloom, handloom fabrics, pottery, metalcraft',
      'Agro-Processing: Flour mill, oil expeller, spice grinding units',
      'Service Enterprises: Two-wheeler repair shop, mobile service center',
      'Retail & Vending: Vegetable/fruit vending carts, grocery mini-stores',
      'Women SHG Collectives: Sanitary napkin units, tailoring enterprises',
    ],
    highlights: [
      'Up to ₹50,000 or 50% of project cost as direct capital subsidy',
      'No collateral requirement for approved PM-AJAY beneficiaries',
      'Linkage with PM Mudra Yojana and Stand-Up India bank credit',
      'Direct Benefit Transfer (DBT) into Aadhaar-seeded Jan Dhan accounts',
    ],
  },
  {
    id: 'adarsh-gram',
    tag: 'Component 3 · Village Infrastructure',
    icon: Home,
    headerColor: 'text-[#0A783C]',
    badgeBg: 'bg-[#EDF9F1] text-[#0A783C] border-[#BBE8CB]',
    title: 'Adarsh Gram (Model Village) Development',
    hindiTitle: 'प्रधानमंत्री आदर्श ग्राम योजना घटक',
    summary:
      'Comprehensive infrastructure enhancement in villages with more than 50% Scheduled Caste population to eliminate development gaps and provide all critical civic amenities.',
    stipend: '₹21 Lakhs infrastructure grant per eligible Gram Panchayat',
    jobRoles: [
      'Piped clean drinking water supply & solar water filtration',
      'All-weather concrete pucca roads and internal village lanes',
      'Solar-powered LED street lighting on all village access routes',
      'Modern Anganwadi centers and child daycare community facilities',
      'Gram Panchayat digital service center & public reading room',
      'Proper underground drainage and solid waste segregation systems',
    ],
    highlights: [
      'Mandatory saturation of basic civic amenities in SC habitations',
      'Villages selected based on census data (>50% SC concentration)',
      'Monitored directly by District Welfare Officers & Panchayati Raj',
      'Focus on health, education, connectivity, and sanitation',
    ],
  },
  {
    id: 'hostel-support',
    tag: 'Component 4 · Education & Hostels',
    icon: FileText,
    headerColor: 'text-[#0B3064]',
    badgeBg: 'bg-[#EAF1FB] text-[#0B3064] border-[#BACEEB]',
    title: 'Babu Jagjivan Ram Hostels & Educational Aid',
    hindiTitle: 'बाबू जगजीवन राम छात्रावास एवं शिक्षा संवर्धन',
    summary:
      'Construction and modernization of residential hostels for SC boys and girls pursuing middle, secondary, higher secondary, and technical vocational courses.',
    stipend: '100% Central funding for girls’ hostels · 50% for boys’ hostels',
    jobRoles: [
      'Safe residential accommodation near government schools & colleges',
      'Modern digital study rooms equipped with computers and internet',
      'Free nutritious boarding and hygienic sanitary facilities',
      'Academic mentoring, competitive exam coaching & career counseling',
    ],
    highlights: [
      'Reduces dropout rates among rural SC students, especially girls',
      'Priority admission to first-generation learners and BPL students',
      'Equipped with solar heating and barrier-free access for Divyangjan',
      'Integrated with State pre-matric and post-matric scholarship portals',
    ],
  },
];

const ELIGIBILITY_CRITERIA = [
  {
    title: 'Community Status',
    detail: 'Must belong to the Scheduled Caste (SC) community as recognized under the Constitution of India.',
    icon: UserCheck,
  },
  {
    title: 'Income Ceiling',
    detail: 'Annual family income should not exceed ₹2,50,000 (Priority to BPL and Antyodaya households).',
    icon: TrendingUp,
  },
  {
    title: 'Age Requirement',
    detail: '18 to 45 years for Skill Development & Enterprise Grants; school/college going age for Hostels.',
    icon: Clock,
  },
  {
    title: 'Bank & Aadhaar Linkage',
    detail: 'Valid Aadhaar card linked with active DBT-enabled Jan Dhan or regular savings bank account.',
    icon: Award,
  },
];

const HOW_TO_APPLY_STEPS = [
  {
    step: '1',
    title: 'Visit Village Panchayat Kiosk',
    desc: 'Visit your local Gram Panchayat office or designated Kural Sevi Village Kiosk. Assistance is provided free of cost.',
  },
  {
    step: '2',
    title: 'Voice-Assisted Registration',
    desc: 'State your personal details, skill interest, or livelihood preference in your native language (Tamil or Hindi). No form-filling required.',
  },
  {
    step: '3',
    title: 'District Welfare Review',
    desc: 'The District Welfare Officer (DWO) verifies your caste status and eligibility against the official state database.',
  },
  {
    step: '4',
    title: 'Direct Benefit Transfer (DBT)',
    desc: 'Approved grant subsidy is credited directly to your bank account, or you are enrolled into the upcoming skill training batch.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-[#0B3064]/10 selection:text-[#0B3064]">
      {/* 1. NATIONAL TRICOLOR TOP STRIP */}
      <div className="h-1.5 w-full flex" aria-hidden="true">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* 2. OFFICIAL GOVERNMENT PORTAL TOP BAR */}
      <div className="bg-[#0B3064] text-white py-1.5 px-4 sm:px-6 lg:px-8 text-xs border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">भारत सरकार | Government of India</span>
            <span className="text-white/40">|</span>
            <span className="text-white/80">सामाजिक न्याय और अधिकारिता मंत्रालय | Ministry of Social Justice & Empowerment</span>
          </div>
          <div className="flex items-center gap-4 text-white/80 font-mono text-[11px]">
            <span>PM-AJAY Centrally Sponsored Scheme</span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline">Toll Free: 1800-11-2001</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Emblems */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#0B3064] flex items-center justify-center text-white shadow-md">
              <IndicChakra className="w-7 h-7 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B3064] font-display">
                  PM-AJAY
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF9F1] text-[#0A783C] border border-[#BBE8CB]">
                  Official Portal
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-tight">
                Pradhan Mantri Anusuchit Jaati Abhyuday Yojana · Kural Sevi
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Department of Social Welfare · State & Central Governance
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-700">
            <a href="#about" className="hover:text-[#0B3064] transition-colors">
              About Scheme
            </a>
            <a href="#components" className="hover:text-[#0B3064] transition-colors">
              Training & Jobs
            </a>
            <a href="#grants" className="hover:text-[#0B3064] transition-colors">
              Enterprise Grants
            </a>
            <a href="#eligibility" className="hover:text-[#0B3064] transition-colors">
              Eligibility
            </a>
            <a href="#process" className="hover:text-[#0B3064] transition-colors">
              How to Apply
            </a>
            <a href="#helpline" className="hover:text-[#0B3064] transition-colors">
              Contact & Helpline
            </a>
          </div>

          {/* Portal Access Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              id="header-portal-signin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B3064] hover:bg-[#144282] active:bg-[#082142] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 4. HERO SECTION */}
      <section className="bg-gradient-to-b from-white to-slate-100/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 bg-[#FFF4ED] border border-[#FDD8C2] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#C24810]">
                <span className="w-2 h-2 rounded-full bg-[#E05A1B] animate-pulse" />
                <span>Ministry of Social Justice & Empowerment · Scheme Guidelines</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B3064] font-display leading-[1.15] tracking-tight">
                Pradhan Mantri Anusuchit Jaati Abhyuday Yojana
              </h1>
              <p className="text-base sm:text-lg text-slate-700 font-medium">
                प्रधानमंत्री अनुसूचित जाति अभ्युदय योजना (PM-AJAY)
              </p>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                A flagship Centrally Sponsored Scheme aimed at reducing poverty and socio-economic vulnerability among
                Scheduled Caste (SC) communities through free NSQF-aligned skill development, enterprise capital grants,
                and comprehensive infrastructure creation in Adarsh Gram villages.
              </p>

              {/* Key Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-xl font-bold text-[#0B3064] font-display">100% Free</div>
                  <div className="text-xs text-slate-600 mt-0.5">NSQF Skill Training</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-xl font-bold text-[#C24810] font-display">Up to ₹10L</div>
                  <div className="text-xs text-slate-600 mt-0.5">Livelihood Grants</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="text-xl font-bold text-[#0A783C] font-display">₹21 Lakhs</div>
                  <div className="text-xs text-slate-600 mt-0.5">Per Adarsh Gram</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#components"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0B3064] hover:bg-[#144282] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  Explore Jobs & Skill Training
                </a>
                <a
                  href="#eligibility"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#0A783C]" />
                  Check Eligibility Criteria
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#E05A1B] hover:bg-[#c44c14] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Lock className="w-4 h-4" />
                  Official Portal Login
                </Link>
              </div>
            </div>

            {/* Right Graphic Banner */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-white">
                <div className="h-2 w-full flex">
                  <div className="flex-1 bg-[#FF9933]" />
                  <div className="flex-1 bg-white" />
                  <div className="flex-1 bg-[#138808]" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/pmajay-hero.jpg"
                  alt="PM-AJAY Scheme Community Beneficiaries"
                  className="w-full h-auto object-cover max-h-[380px]"
                />
                <div className="p-4 bg-slate-900 text-white text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[#FF9933]">PM-AJAY Field Mission</span>
                    <span className="text-[11px] text-slate-400 font-mono">Govt. of India</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1">
                    Empowering rural Scheduled Caste families with wage employment, micro-enterprise toolkits, and social security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ABOUT THE SCHEME */}
      <section id="about" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B3064] bg-[#EAF1FB] px-3 py-1 rounded-full border border-[#BACEEB]">
              National Scheme Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B3064] font-display mt-3 mb-4">
              What is PM-AJAY (Pradhan Mantri Anusuchit Jaati Abhyuday Yojana)?
            </h2>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              PM-AJAY is a Centrally Sponsored Scheme formulated by the Ministry of Social Justice and Empowerment,
              Government of India. It represents a unified merger of three erstwhile welfare schemes:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="w-10 h-10 rounded-lg bg-[#0B3064] flex items-center justify-center text-white mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Erstwhile SCA to SCSP</h3>
              <p className="text-xs text-slate-500 font-mono mb-2">Special Central Assistance</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Re-engineered into comprehensive Grant-in-Aid for income-generating schemes, vocational training, and SHG development.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="w-10 h-10 rounded-lg bg-[#0A783C] flex items-center justify-center text-white mb-3">
                <Home className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Erstwhile PMAGY</h3>
              <p className="text-xs text-slate-500 font-mono mb-2">Pradhan Mantri Adarsh Gram Yojana</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrated as the Adarsh Gram component providing ₹21 Lakh per village to saturate infrastructure in high-density SC habitations.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80">
              <div className="w-10 h-10 rounded-lg bg-[#C24810] flex items-center justify-center text-white mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Erstwhile BJRCY</h3>
              <p className="text-xs text-slate-500 font-mono mb-2">Babu Jagjivan Ram Chhatrawas</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unified into residential educational hostels for SC boys and girls to enhance access to quality middle, higher, and technical education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DETAILED SCHEME COMPONENTS & JOBS */}
      <section id="components" className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A783C] bg-[#EDF9F1] px-3.5 py-1 rounded-full border border-[#BBE8CB]">
              Comprehensive Scheme Pillars
            </span>
            <h2 className="text-3xl font-bold text-[#0B3064] font-display mt-3 mb-2">
              Opportunities, Jobs & Benefits Under PM-AJAY
            </h2>
            <p className="text-slate-600 text-sm">
              Detailed breakdown of central assistance, vocational trades, grant amounts, and civic amenities available to eligible citizens.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {SCHEME_COMPONENTS.map((comp) => {
              const Icon = comp.icon;
              return (
                <div
                  key={comp.id}
                  id={comp.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  {/* Top Bar */}
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${comp.badgeBg}`}>
                        {comp.tag}
                      </span>
                      <Icon className={`w-5 h-5 ${comp.headerColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 font-display">{comp.title}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{comp.hindiTitle}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mt-3">{comp.summary}</p>

                    {/* Stipend Banner */}
                    <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-[#E05A1B] shrink-0" />
                      <span className="text-xs font-bold text-slate-800">{comp.stipend}</span>
                    </div>
                  </div>

                  {/* Trades & Job Roles */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-[#0B3064]" />
                        <span>Key Trades, Enterprise Areas & Amenities</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {comp.jobRoles.map((role, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0B3064] shrink-0 mt-1.5" />
                            <span>{role}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0A783C]" />
                        <span>Key Scheme Provisions</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {comp.highlights.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 flex items-start gap-1.5"
                          >
                            <span className="text-[#0A783C] font-bold">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. BENEFICIARY PROFILES & AVATARS SECTION */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Image & Caption */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl overflow-hidden border-4 border-slate-100 shadow-lg bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/pmajay-avatars.jpg"
                  alt="PM-AJAY Beneficiary Profiles and Avatars"
                  className="w-full h-auto object-cover"
                />
                <div className="p-4 bg-white border-t border-slate-200">
                  <h4 className="text-xs font-bold text-[#0B3064] uppercase tracking-wider">
                    Diverse Beneficiary Cohorts
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Directly reaching rural youth, women-led SHG micro-entrepreneurs, small artisans, and students from Scheduled Caste communities.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Beneficiary Breakdown */}
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C24810] bg-[#FFF4ED] px-3.5 py-1 rounded-full border border-[#FDD8C2]">
                Target Beneficiaries
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B3064] font-display">
                Who Does PM-AJAY Serve?
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                The scheme provides differentiated assistance tailored to the unique economic realities of distinct
                demographic groups within the Scheduled Caste population:
              </p>

              <div className="space-y-3.5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#0B3064] text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Rural SC Youth (Age 18–45)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Provided with free residential or non-residential skill training, monthly stipend, travel allowance, and guaranteed placement linkages in manufacturing and services.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#C24810] text-white flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Women-Led Self-Help Groups (SHGs)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Cluster grants up to ₹10 Lakhs with zero collateral for setting up shared production units, textile stitching centers, and food packaging collectives.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#0A783C] text-white flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Traditional Artisans & Marginal Farmers</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Modern subsidized equipment, customized toolkits, and working capital grants to preserve traditional occupations while upgrading productivity and income.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. ELIGIBILITY CRITERIA */}
      <section id="eligibility" className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B3064] bg-[#EAF1FB] px-3.5 py-1 rounded-full border border-[#BACEEB]">
              Verification Standards
            </span>
            <h2 className="text-3xl font-bold text-[#0B3064] font-display mt-3 mb-2">
              Citizen Eligibility Checklist
            </h2>
            <p className="text-slate-600 text-sm">
              All benefits are subject to verification against official state and national revenue registries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ELIGIBILITY_CRITERIA.map((crit, idx) => {
              const Icon = crit.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-[#0B3064]/10 text-[#0B3064] flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1.5">{crit.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{crit.detail}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-[#0A783C]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mandatory Verification</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Required Documents */}
          <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 max-w-4xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0B3064]" />
              <span>Required Verification Documents for Citizen Intake</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0B3064]" />
                <span>Valid SC Community Certificate</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0B3064]" />
                <span>Aadhaar Number & Photo ID</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0B3064]" />
                <span>Jan Dhan / DBT Bank Passbook</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. CITIZEN APPLICATION PROCESS (HOW TO APPLY) */}
      <section id="process" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A783C] bg-[#EDF9F1] px-3.5 py-1 rounded-full border border-[#BBE8CB]">
              Accessible Public Delivery
            </span>
            <h2 className="text-3xl font-bold text-[#0B3064] font-display mt-3 mb-2">
              How Beneficiaries Can Apply
            </h2>
            <p className="text-slate-600 text-sm">
              Citizen intake is conducted at the grassroots level through Gram Panchayat Kiosks, ensuring zero technical or literacy barriers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_TO_APPLY_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-[#0B3064] text-white font-bold font-display text-base flex items-center justify-center mb-4 shadow-sm">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-semibold text-[#0B3064]">
                  Zero Application Fee
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. HELPLINE & GRIEVANCE REDRESSAL */}
      <section id="helpline" className="py-12 bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#E05A1B] uppercase tracking-wider">Citizen Assistance</span>
                <h3 className="text-xl font-bold text-[#0B3064] font-display">Official Helpdesk & Enquiries</h3>
                <p className="text-xs text-slate-600">
                  National and state welfare representatives are available on working days (9:30 AM to 6:00 PM).
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EAF1FB] text-[#0B3064] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">National Scheme Toll-Free</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">1800-11-2001</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EDF9F1] text-[#0A783C] flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">District Welfare Officer (DWO)</div>
                    <div className="text-xs font-semibold text-slate-700">Available at all 38 District Collectorates</div>
                  </div>
                </div>
              </div>

              <div className="text-left md:text-right">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B3064] hover:bg-[#144282] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  Official Department Login
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-slate-500 mt-2">
                  Authorized access for DWO, Village Panchayat & Admin officials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. OFFICIAL GOVERNMENT FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B3064] flex items-center justify-center text-white">
                  <IndicChakra className="w-5 h-5 text-white" strokeWidth={2.4} />
                </div>
                <span className="font-bold text-[#0B3064] text-base font-display">
                  Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (PM-AJAY)
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Department of Social Justice and Empowerment, Ministry of Social Justice and Empowerment,
                Government of India in coordination with the Department of Social Welfare, Government of Tamil Nadu.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">Important Portals</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <a href="https://socialjustice.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B3064] flex items-center gap-1">
                    <span>socialjustice.gov.in</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B3064] flex items-center gap-1">
                    <span>india.gov.in (National Portal)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
                <li>
                  <a href="https://ncs.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B3064] flex items-center gap-1">
                    <span>National Career Service (NCS)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">Authorized Portal</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>
                  <Link href="/login" className="hover:text-[#0B3064] font-medium text-[#0B3064]">
                    Official Portal Sign In
                  </Link>
                </li>
                <li className="text-[11px] text-slate-500">
                  Role authenticated: District Welfare Officer, Village Panchayat, Central Admin.
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Compliance Strip */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0B3064]" />
                Digital Personal Data Protection (DPDP) Act 2023 Compliant
              </span>
              <span>·</span>
              <span>Website Content Managed by Ministry of Social Justice & Empowerment</span>
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              PM-AJAY GIA · Kural Sevi v2.4 · National Governance Platform
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
