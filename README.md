# Kural Sevi — AI-Driven Voice Assistant for Livelihood Mapping

**PM-AJAY GIA · Problem Statement #26097**

Kural Sevi is an AI-powered voice assistant designed to profile Scheduled Caste (SC) beneficiaries and generate personalised, NSQF-aligned livelihood and skilling recommendations. The system operates over ordinary phone calls and WhatsApp — no smartphone or literacy required — and produces a structured officer review queue with district-level planning intelligence.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#developer-setup)
[![DB](https://img.shields.io/badge/database-live-brightgreen)](#database)
[![DPDP Act 2023](https://img.shields.io/badge/compliance-DPDP%20Act%202023-blue)](#data-protection--compliance)

---

## Table of Contents

- [What the System Does](#what-the-system-does)
- [How It Works](#how-it-works)
- [Channels of Access](#channels-of-access)
- [Recommendation Engine](#recommendation-engine)
- [Officer Dashboard](#officer-dashboard)
- [Data Protection & Compliance](#data-protection--compliance)
- [External Services Used](#external-services-used)
- [Functional Requirements Coverage](#functional-requirements-coverage)
- [Deployment Status](#deployment-status)
- [Developer Setup](#developer-setup)

---

## What the System Does

Kural Sevi automates the first-mile livelihood profiling process for SC beneficiaries under the PM-AJAY Grant-in-Aid scheme. It collects seven structured data points from each beneficiary through a natural voice conversation, then uses a three-stage AI pipeline to recommend the most suitable NSQF-qualified vocational trade or self-employment pathway.

The system supports Tamil, Hindi, and Telugu with more languages configurable for future rollout.

**Key outcomes for district administration:**

- Structured beneficiary profiles collected without field visits or paper forms.
- Top-3 NSQF trade recommendations with plain-language justifications, ready for officer review.
- SLA-tracked officer case queue with approve, modify, or reject actions.
- District-level skilling demand dashboard and exportable planning reports.

---

## How It Works

```
Beneficiary phones in or sends a WhatsApp voice note
                        ↓
      AI voice assistant conducts a guided interview
      (7 mandated profiling fields, confirmation loop)
                        ↓
        Livelihood profile saved to secure database
                        ↓
     Recommendation engine matches profile against
       40+ NSQF QP-NOS trades using AI similarity,
       constraint filters, and multi-criteria ranking
                        ↓
     Officer receives case in the review dashboard
       with recommendation, confidence label,
       and plain-language explanation
                        ↓
     District planning reports updated automatically
```

---

## Channels of Access

| Channel | How Beneficiaries Use It | Requirements |
|---|---|---|
| **IVR Phone Call** | Calls a dedicated number; AI assistant speaks and listens in local language | Basic mobile phone, no internet |
| **WhatsApp Voice Note** | Sends voice messages via WhatsApp; receives audio replies | WhatsApp on any phone |
| **Field Worker Assisted** | District officer fills the form on behalf of the beneficiary via the web dashboard | Officer access to dashboard |

---

## Recommendation Engine

Each completed beneficiary profile is processed through a three-stage pipeline:

1. **Constraint Filtering** — Eliminates trades that are incompatible with the beneficiary's mobility, disability, educational background, or geographic constraints.

2. **Semantic Similarity Search** — Matches the beneficiary's skills and interests against the full NSQF trade catalog using AI-generated semantic embeddings.

3. **Multi-Criteria Ranking** — Applies Analytical Hierarchy Process (AHP) and TOPSIS scoring across income potential, local market demand, training duration, and skill gap size to rank the top three suitable trades.

Each recommendation includes:
- NSQF level and qualification code (QP-NOS)
- Pathway type: Wage Employment, Self Employment, or Home Enterprise
- Confidence label: High, Medium, or Needs Officer Review
- Plain-language explanation of why the trade was recommended
- Local economic data freshness indicator (sourced from e-Shram and Udyam registries)

---

## Officer Dashboard

The web-based officer dashboard (accessible at the deployment URL) provides:

- **Case Queue** — All pending beneficiary cases, sorted by SLA deadline and priority.
- **Case Review** — Full beneficiary profile, top-3 recommendations, AI explanation, and action buttons (Approve / Modify / Reject).
- **Specialist Referral** — Flag high-complexity cases for consultant referral.
- **Planning Intelligence** — District-level charts showing skill demand trends, top requested trades, and dropout rates.
- **Export** — Download district planning data as CSV or JSON for offline use or reporting.

---

## Data Protection & Compliance

The system is built in compliance with the **Digital Personal Data Protection (DPDP) Act 2023**:

- **Explicit Voice Consent** — Every beneficiary provides verbal consent before profiling begins. The consent audio is recorded and cryptographically hashed for audit.
- **Aadhaar Protection** — No raw Aadhaar numbers are stored at any point. Only a one-way cryptographic hash (HMAC-SHA256) is retained for identity matching.
- **Jurisdiction-Scoped Access** — District welfare officers can only view and act on cases within their assigned administrative district. Access is enforced at the database level.
- **Right to Erasure** — Beneficiary records can be erased on request in line with DPDP provisions, with an audit timestamp preserved.
- **Data Residency** — The system architecture is prepared for deployment on MeitY-empanelled cloud infrastructure within India.

---

## External Services Used

| Service | Provider | Purpose |
|---|---|---|
| Speech-to-Text | Sarvam AI | Converts beneficiary voice input into text in Tamil, Hindi, and Telugu |
| Text-to-Speech | Sarvam AI | Converts AI-generated responses into natural voice audio |
| AI Reasoning & Extraction | Google Gemini 2.5 | Conducts the interview, extracts structured fields, and generates explanations |
| Semantic Embeddings | Google Gemini | Converts trade descriptions and profiles into vectors for similarity matching |
| Telephony (IVR) | Exotel | Manages inbound phone calls; TRAI/DoT compliant for India |
| Messaging | WhatsApp (Meta) | Handles voice note and text intake over WhatsApp |
| Database | Supabase (PostgreSQL) | Stores all beneficiary, session, recommendation, and audit data |
| Labor Market Data | data.gov.in | Periodic ingestion of e-Shram and Udyam district-level economic data |
| Government Speech Fallback | Bhashini (MeitY) | Sovereign AI pipeline fallback for government-mandated data residency |

---

## Functional Requirements Coverage

| Requirement | Description | Status |
|---|---|---|
| FR-1 | Multilingual voice intake (Tamil, Hindi, Telugu) | Implemented |
| FR-2 | Collection of 7 PS-mandated profiling fields | Implemented |
| FR-3 | Explicit field-by-field confirmation before saving | Implemented |
| FR-4a | IVR telephone channel | Implemented |
| FR-4b | WhatsApp voice note channel | Implemented |
| FR-5 | Assisted enrollment by field workers via dashboard | Implemented |
| FR-6 | NSQF QP-NOS occupational trade catalog | Implemented (40+ trades seeded) |
| FR-7 | Top-3 livelihood pathway recommendations | Implemented |
| FR-8 | Confidence scoring (High / Medium / Needs Review) | Implemented |
| FR-8a | Plain-language recommendation explanation | Implemented |
| FR-8b | Local economic data freshness indicator | Implemented |
| FR-8c | Skill gap analysis and traceability | Implemented |
| FR-8d | Safety, disability, and travel constraint filtering | Implemented |
| FR-9 | Officer case review queue with SLA prioritization | Implemented |
| FR-10 | Officer actions: Approve, Modify, Reject | Implemented |
| FR-11 | Specialist referral for high-barrier cases | Implemented |
| FR-12 | Portable case ID generation (e.g., KS-2026-00001) | Implemented |
| FR-13 | Audio consent recording with cryptographic audit trail | Implemented |
| FR-13a | Mid-call disconnect recovery and session resume | Implemented |
| FR-14 | District-level skilling demand dashboard | Implemented |
| FR-15 | Case queue filtering and status management | Implemented |
| FR-16 | Batch planning aggregate computation (nightly) | Implemented |
| FR-17 | CSV and JSON district planning data export | Implemented |

---

## Deployment Status

| Component | Status |
|---|---|
| Web dashboard (Next.js) | Live at `http://localhost:3000` (development) |
| Voice API (FastAPI) | Running on port 8000 |
| Database schema | Applied — all 4 migrations live on Supabase cloud |
| NSQF trade catalog | Seeded (40+ QP-NOS trades) |
| Trade embeddings | Pending — run `npm run generate:embeddings` to populate |
| WhatsApp Business Account | Pending production Meta approval |
| IVR (Exotel production) | Pending TRAI compliance configuration |
| Bhashini STT fallback | Pending integration activation |
| Pilot district | Tamil Nadu — Namakkal (planned) |

---

## Developer Setup

### Prerequisites

- Node.js >= 20
- npm >= 10
- Python >= 3.11

### Install & Run

```bash
# Clone and install
git clone <repository-url>
cd KuralSevi
npm install

# Install Python dependencies for the Voice API
cd apps/voice-api && pip install -r requirements.txt && cd ../..

# Copy and configure environment
cp .env.example .env

# Start all services (web dashboard + voice API + WhatsApp bot)
npm run dev
```

### Database

The database schema is already applied to the live Supabase cloud project. To apply future migrations:

```bash
npm run db:migrate
```

For local development with Docker:

```bash
npm run db:start   # Start local Supabase instance
npm run db:migrate # Apply migrations
```

### Running Tests

```bash
npm test   # Runs all unit tests across voice API and recommendation engine
```
