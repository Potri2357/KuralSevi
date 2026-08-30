# Kural Sevi — AI-Driven Voice Assistant for Livelihood Mapping

**PM-AJAY GIA · Problem Statement #26097**

> **குரல் செவி · कुरल सेवी · కురల్ సేవి**  
> *Voice-first intake, multilingual AI profiling, explainable NSQF-aligned skilling recommendations, and district planning intelligence for Scheduled Caste (SC) communities under PM-AJAY.*

[![Tests](https://img.shields.io/badge/tests-20%20passing-brightgreen)](#testing--verification)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#setup-guide)
[![DPDP Act 2023](https://img.shields.io/badge/compliance-DPDP%20Act%202023-blue)](#data-protection--governance)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal)](https://fastapi.tiangolo.com)

---

## Table of Contents

- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [External API Integrations & Requirements (Detailed)](#external-api-integrations--requirements)
  - [1. Sarvam AI (Speech-to-Text & Text-to-Speech)](#1-sarvam-ai-regional-speech-layer)
  - [2. Google AI Gemini (LLM & Embeddings)](#2-google-ai-gemini-interview-driver--pgvector-embeddings)
  - [3. Telephony: Twilio IVR & Inbound Webhooks](#3-telephony-twilio-ivr-gateway)
  - [4. Messaging: WhatsApp Cloud API](#4-meta-whatsapp-cloud-api)
  - [5. Database & BaaS: Supabase Cloud / Local](#5-supabase-postgres-pgvector--storage)
  - [6. Open Government Data: data.gov.in (e-Shram & Udyam)](#6-open-government-data-datagovin-track-1)
  - [7. Government Fallback: Bhashini NLTM](#7-government-fallback-bhashini-nltm-pilot)
- [Setup & Quickstart Guide](#setup-guide)
- [Testing & Verification](#testing--verification)
- [Key FR → File Mapping](#key-fr--file-mapping)
- [Data Protection & Governance (DPDP Act 2023)](#data-protection--governance)
- [Production Deployment Roadmap](#production-deployment-roadmap)

---

## Architecture

```text
       Beneficiary Inbound Call / WhatsApp Voice Note
                             ↓
              Twilio IVR  /  WhatsApp Cloud API
                             ↓
              Voice API (FastAPI Orchestrator)
              ├── STT: Sarvam Saaras (ta-IN / hi-IN / te-IN)
              ├── Interview FSM + Session Resume (FR-13a)
              ├── LLM Driver: Gemini 2.5 Flash (7-field extraction)
              └── TTS: Sarvam Bulbul V3 (Voice response generation)
                             ↓
                Supabase (PostgreSQL + pgvector)
                             ↓
            3-Stage Recommendation Engine (Hexagonal Architecture)
              ├── Stage 1: Hard Constraint Filters (NSQF, safety, travel, disability)
              ├── Stage 2: pgvector Cosine Similarity Search (Gemini 768d embeddings)
              └── Stage 3: AHP Multi-Criteria + TOPSIS Ranking (FR-8c skill gap)
                             ↓
              Next.js 15 Officer Review Queue (FR-9, FR-10)
                             ↓
           District Planning Intelligence & Batch Aggregation (FR-14, FR-16)
```

---

## Repository Structure

```text
KuralSevi/
├── apps/
│   ├── web/                         # Next.js 15 App Router dashboard
│   │   ├── src/app/
│   │   │   ├── officer/             # Case queue, planning intelligence, export, beneficiary intake
│   │   │   ├── admin/               # System configuration & audit logs
│   │   │   └── api/                 # Next.js API routes (actions, exports, planning)
│   │   ├── src/components/          # UI design system (Glassmorphism, Tailwind CSS, Recharts)
│   │   └── package.json
│   │
│   └── voice-api/                   # FastAPI voice orchestration service
│       ├── main.py                  # FastAPI app entry point & CORS
│       ├── config.py                # Pydantic Settings & environment validation
│       ├── routers/                 # Twilio IVR & WhatsApp webhooks
│       ├── services/                # STT, TTS, LLM (Gemini), FSM & Session persistence
│       ├── prompts/                 # System prompts in Tamil, Hindi, and Telugu
│       ├── tests/                   # Python unit tests for Interview FSM
│       ├── requirements.txt         # Python dependencies
│       └── package.json             # npm workspace integration
│
├── packages/
│   ├── shared/                      # TypeScript shared types and constants
│   │   ├── src/types/               # Beneficiary, recommendation, officer, and planning schemas
│   │   └── src/constants/           # NSQF levels, languages, sector codes
│   │
│   └── recommendation-engine/       # 3-Stage Hexagonal Recommendation Pipeline
│       ├── src/stage1-hard-filter.ts       # Hard constraints (travel radius, gender, disability)
│       ├── src/stage2-pgvector-search.ts   # Vector similarity against NSQF QP-NOS catalog
│       ├── src/stage3-ahp-topsis.ts        # Analytical Hierarchy Process + TOPSIS multi-criteria
│       ├── src/confidence.ts               # FR-8 confidence computation (high / medium / review)
│       ├── src/explanation.ts              # FR-8a explainable reasoning generation
│       └── src/__tests__/                  # Unit test suite (node:test + tsx)
│
├── supabase/
│   ├── migrations/                  # 001_initial_schema, 002_rls_policies, 003_pgvector, 004_nsqf_catalog
│   └── functions/                   # Edge Functions: weekly-ingest, batch-aggregate
│
├── scripts/
│   ├── test-full-flow.ts            # Complete end-to-end simulation test
│   ├── ingest-eshram.ts             # data.gov.in e-Shram unorganized worker ingestion
│   ├── ingest-udyam.ts              # data.gov.in Udyam MSME enterprise cluster ingestion
│   └── generate-embeddings.ts       # Gemini text-embedding-004 vector generation for catalog
│
├── .env.example                     # Exhaustive template of all environment credentials
├── package.json                     # Root npm workspaces configuration
└── tsconfig.json                    # Root TypeScript configuration
```

---

## External API Integrations & Requirements

This section details all external third-party services and APIs integrated into Kural Sevi, their operational status, credential requirements, and fallback options.

### Summary Matrix

| API Service | Provider | Purpose | Endpoints / Models | Status | Env Variables Required |
|---|---|---|---|---|---|
| **STT (Speech-to-Text)** | Sarvam AI | Regional voice transcription | `POST https://api.sarvam.ai/speech-to-text` (`saaras:v2`) | Implemented (Mockable) | `SARVAM_API_KEY`, `SARVAM_STT_URL` |
| **TTS (Text-to-Speech)** | Sarvam AI | Regional voice prompt synthesis | `POST https://api.sarvam.ai/text-to-speech` (`bulbul:v3`) | Implemented (Mockable) | `SARVAM_API_KEY`, `SARVAM_TTS_URL` |
| **LLM Reasoning** | Google AI | 7-field extraction & dialogue FSM | `gemini-2.5-flash` | Implemented (Mockable) | `GOOGLE_AI_API_KEY`, `GEMINI_MODEL` |
| **Vector Embeddings** | Google AI | 768-dim semantic search vectors | `text-embedding-004` | Implemented | `GOOGLE_AI_API_KEY` |
| **Telephony (IVR)** | Twilio | Inbound/outbound call webhook & TwiML | `/webhooks/twilio/incoming-call`, `/interview-start` | Implemented | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Messaging Channel** | Meta WhatsApp | Voice-note and text intake | `/webhooks/whatsapp`, Graph API v19.0 | Implemented | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` |
| **Database & Vector DB** | Supabase | PostgreSQL 15+, pgvector, RLS, Storage | REST / GraphQL / Direct Postgres | Implemented | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Track 1 Labor Data** | data.gov.in | District-level unorganized worker counts | `https://api.data.gov.in/resource/{ESHRAM_DATASET_ID}` | Implemented | `DATA_GOV_API_KEY`, `ESHRAM_DATASET_ID` |
| **Track 1 MSME Data** | data.gov.in | District-level enterprise opportunities | `https://api.data.gov.in/resource/{UDYAM_DATASET_ID}` | Implemented | `DATA_GOV_API_KEY`, `UDYAM_DATASET_ID` |
| **Government STT/TTS** | Bhashini (MeitY) | Sovereign Indian language pipeline | ULCA / Bhashini inference APIs | Fallback ready | `BHASHINI_API_KEY`, `BHASHINI_USER_ID`, `BHASHINI_PIPELINE_ID` |

---

### 1. Sarvam AI (Regional Speech Layer)

- **Purpose**: High-accuracy Speech-to-Text and natural Text-to-Speech tailored for Indian languages with dialect and code-switching handling (Tamil, Hindi, Telugu).
- **Integrated Files**:
  - `apps/voice-api/services/stt_service.py`
  - `apps/voice-api/services/tts_service.py`
- **Endpoints Used**:
  - `POST https://api.sarvam.ai/speech-to-text`
    - Payload: `{ "model": "saaras:v2", "language_code": "ta-IN"|"hi-IN"|"te-IN", "audio": "<base64_wav>" }`
    - Response: `{ "transcript": "...", "confidence": 0.92 }`
  - `POST https://api.sarvam.ai/text-to-speech`
    - Payload: `{ "inputs": ["..."], "target_language_code": "ta-IN", "speaker": "meera", "model": "bulbul:v3" }`
    - Response: `{ "audios": ["<base64_wav>"] }`
- **Development / Offline Mode**:
  - Set `ENABLE_MOCK_STT=true` and `ENABLE_MOCK_TTS=true` in `.env` to develop without an active Sarvam key.

---

### 2. Google AI Gemini (Interview Driver & pgvector Embeddings)

- **Purpose**:
  1. **Conversational Extraction**: Extracts 7 PS-mandated fields (`educational_background`, `family_occupation`, `current_livelihood`, `skills_and_interests`, `mobility_constraints`, `employment_preference`, `local_economic_context`) with confidence scores.
  2. **Vector Embeddings**: Converts trade QP-NOS descriptions and beneficiary profiles into 768-dimensional vectors for cosine similarity matching.
- **Integrated Files**:
  - `apps/voice-api/services/llm_service.py`
  - `scripts/generate-embeddings.ts`
  - `packages/recommendation-engine/src/stage2-pgvector-search.ts`
- **Models Used**:
  - Reasoning: `gemini-2.5-flash`
  - Embedding: `text-embedding-004` (768 dimensions)
- **Development / Offline Mode**:
  - Set `ENABLE_MOCK_LLM=true` to simulate interview turns and field confirmation without external API calls.

---

### 3. Telephony: Twilio IVR Gateway

- **Purpose**: Handles inbound telephone calls from beneficiaries without smartphones or internet access.
- **Integrated Files**:
  - `apps/voice-api/routers/twilio_router.py`
  - `apps/web/src/app/api/webhooks/twilio/route.ts`
- **Endpoints Exposed**:
  - `POST /webhooks/twilio/incoming-call`: TwiML greeting and missed-call acknowledgment.
  - `POST /webhooks/twilio/interview-start`: Telephony session establishment.
  - `POST /webhooks/twilio/process-turn`: Processes speech gather inputs and returns audio streams.
- **Production Migration**:
  - For TRAI / DoT compliance in India, Twilio can be switched to **Exotel** or **Tata Tele Business** using the same webhook interface.

---

### 4. Meta WhatsApp Cloud API

- **Purpose**: Enables low-friction asynchronous beneficiary intake via WhatsApp voice notes and text messages.
- **Integrated Files**:
  - `apps/voice-api/routers/whatsapp_router.py`
  - `apps/web/src/app/api/webhooks/whatsapp/route.ts`
- **Endpoints Exposed**:
  - `GET /webhooks/whatsapp`: Hub verification handshake (`hub.challenge`).
  - `POST /webhooks/whatsapp`: Receives incoming text messages or audio attachments.
- **External Calls**:
  - `GET https://graph.facebook.com/v19.0/{media_id}`: Downloads beneficiary voice note audio.
  - `POST https://graph.facebook.com/v19.0/{phone_number_id}/messages`: Dispatches synthesized Bulbul V3 audio replies.

---

### 5. Supabase (Postgres, pgvector & Storage)

- **Purpose**: Relational storage for 12 database tables, vector similarity search via `pgvector`, Row Level Security (RLS) scoped by district, and storage for consent audio recordings.
- **Integrated Files**:
  - `supabase/migrations/*.sql`
  - `apps/web/src/lib/supabase.ts`
  - `apps/voice-api/services/session_manager.py`
- **Setup Options**:
  - **Local Development**: `npx supabase start` (uses local Docker instance).
  - **Cloud Instance**: Connect with standard `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

### 6. Open Government Data: data.gov.in (Track 1)

- **Purpose**: Periodically ingests local district market demand data to enrich recommendations with real-time economic context.
- **Integrated Files**:
  - `scripts/ingest-eshram.ts`: e-Shram unorganized worker registrations by sector and district.
  - `scripts/ingest-udyam.ts`: Udyam MSME enterprise registrations and micro-cluster density.
- **Execution**:
  ```bash
  npm run ingest:eshram
  npm run ingest:udyam
  ```

---

### 7. Government Fallback: Bhashini NLTM (Pilot)

- **Purpose**: Sovereign, in-country AI fallback mandated for government deployments to ensure data residency and Indian language coverage.
- **Status**: Pipeline architecture and adapter interfaces defined; ready to be toggled via `VOICE_PIPELINE_PROVIDER=bhashini` in production.

---

## Setup Guide

### Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Python**: >= 3.11 (with `pip` and `venv`)

### 1. Clone & Configure Environment

```bash
git clone <repository-url>
cd KuralSevi

# Copy environment template
cp .env.example .env
```

Edit `.env` and fill in your API credentials (or enable mock flags for local testing):
```env
ENABLE_MOCK_STT=true
ENABLE_MOCK_TTS=true
ENABLE_MOCK_LLM=true
```

### 2. Install Dependencies

```bash
# Install root, web, shared, and recommendation engine dependencies
npm install

# Install voice-api Python dependencies
cd apps/voice-api
pip install -r requirements.txt
cd ../..
```

*(Note: On macOS, if you encounter npm cache permission issues, pass `--cache /tmp/npm-cache`)*

### 3. Database Initialization

```bash
# Option A: Using local Supabase CLI
npm run db:start
npm run db:migrate

# Option B: Using Supabase Cloud Project
# Execute SQL migrations from supabase/migrations/ in order:
# 001_initial_schema.sql
# 002_rls_policies.sql
# 003_pgvector_setup.sql
# 004_seed_nsqf_catalog.sql
```

### 4. Run Development Servers

Run both the Next.js Dashboard and Voice API concurrently from the root directory:

```bash
npm run dev
```

- Next.js Officer Dashboard: [http://localhost:3000](http://localhost:3000)
- FastAPI Voice Orchestrator: [http://localhost:8000](http://localhost:8000)
- Voice API Interactive Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Testing & Verification

The repository contains full automated test suites across all layers.

### Run All Workspace Tests

```bash
npm test
```

Runs:
1. **`@kural-sevi/voice-api`**: 10 Python unit tests validating the multi-turn Interview FSM, field confirmation loop, and session disconnect resume (FR-13a).
2. **`@kural-sevi/recommendation-engine`**: 10 TypeScript tests validating Stage 1 hard filters, Hexagonal Ports & Adapters, and FR-8 confidence computation.

### Run Linter & Typecheck

```bash
npm run lint    # ESLint across all workspaces (Next.js & TypeScript)
npm run build   # Typechecks and builds shared package, engine, and Next.js app
```

### Run End-to-End Recommendation Simulation

```bash
npx tsx scripts/test-full-flow.ts
```

Simulates the complete pipeline:
`Beneficiary Profile → Stage 1 Hard Filters → Stage 3 AHP/TOPSIS → FR-8 Confidence → FR-8a Traceable Explanation`.

---

## Key FR → File Mapping

| Functional Requirement | Description | Implementation File(s) |
|---|---|---|
| **FR-1** | Multilingual voice intake (Tamil, Hindi, Telugu) | `apps/voice-api/prompts/interview_system_prompt.py` |
| **FR-2** | 7 PS-mandated field extraction | `apps/voice-api/services/llm_service.py`, `interview_fsm.py` |
| **FR-3** | Explicit confirmation loop before finalization | `apps/voice-api/services/interview_fsm.py` (`CONFIRMATION` state) |
| **FR-4a** | IVR telephony channel | `apps/voice-api/routers/twilio_router.py` |
| **FR-4b** | WhatsApp voice note channel | `apps/voice-api/routers/whatsapp_router.py` |
| **FR-5** | Assisted enrollment for field workers | `apps/web/src/app/officer/beneficiary/new/page.tsx` |
| **FR-6** | NSQF QP-NOS occupational catalog | `supabase/migrations/004_seed_nsqf_catalog.sql` |
| **FR-7** | Livelihood pathway recommendation output | `packages/recommendation-engine/src/index.ts` |
| **FR-8** | Confidence label scoring (`high`, `medium`, `needs_review`) | `packages/recommendation-engine/src/confidence.ts` |
| **FR-8a** | Explainable plain-language justification | `packages/recommendation-engine/src/explanation.ts` |
| **FR-8b** | Local economic data freshness indicator | `local_data_last_updated` on recommendations |
| **FR-8c** | Traceable skill gap analysis | `packages/recommendation-engine/src/stage3-ahp-topsis.ts` |
| **FR-8d** | Safety, disability, and travel constraint filtering | `packages/recommendation-engine/src/stage1-hard-filter.ts` |
| **FR-9** | Officer case review queue with SLA prioritization | `apps/web/src/app/officer/cases/page.tsx` |
| **FR-10** | Officer actioning (Approve / Modify / Reject) | `apps/web/src/app/officer/cases/[id]/page.tsx` |
| **FR-11** | High-barrier case specialist referral | `consultant_referral_status` in `officer_cases` |
| **FR-12** | Portable, memorable case ID generation | `generate_case_id()` in `session_manager.py` |
| **FR-13** | Audio consent recording and HMAC audit trail | `session_manager.save_consent()`, `consent_records` |
| **FR-13a** | Mid-call disconnect recovery and resume | `interview_fsm.resume_from_last_confirmed()` |
| **FR-14** | District-level demand & skilling dashboard | `apps/web/src/app/officer/planning/page.tsx` |
| **FR-15** | Case queue filtering and status management | `apps/web/src/app/officer/cases/page.tsx` |
| **FR-16** | Batch aggregate planning computation | `scripts/aggregate-planning.ts`, Supabase Edge Function |
| **FR-17** | CSV / JSON district planning export | `apps/web/src/app/officer/export/page.tsx`, `/api/export/route.ts` |

---

## Data Protection & Governance

Built in compliance with the **Digital Personal Data Protection (DPDP) Act 2023**:

- **Explicit Voice Consent**: Audio consent recordings captured and cryptographically hashed before profiling starts.
- **Aadhaar Protection**: No raw Aadhaar numbers stored; SHA-256 HMAC pseudonymization with server-side secret (`CONSENT_HMAC_SECRET`).
- **Row-Level Security (RLS)**: District-scoped database policies ensure district welfare officers can only access cases within their administrative jurisdiction.
- **Data Residency**: Architecture prepared for India-region hosting (AWS `ap-south-1` / MeitY-empanelled cloud).

---

## Production Deployment Roadmap

- [x] Monorepo packaging and shared type validation
- [x] Mock simulation modes for offline development
- [x] Next.js 15 production build and type checking
- [x] Automated test suites across all workspaces
- [ ] Transition IVR transport from Twilio to Exotel / Tata Tele Business for TRAI compliance
- [ ] Connect production WhatsApp Business Account via Meta Business Manager
- [ ] Provision production Supabase Cloud project with Point-In-Time Recovery (PITR)
- [ ] Enable Bhashini NLTM as automated STT fallback
- [ ] Finalize district pilot language selection (Tamil Nadu — Namakkal district)
