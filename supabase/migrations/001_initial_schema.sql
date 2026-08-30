-- =============================================================================
-- KURAL SEVI — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- All tables follow DPDP Act 2023 data minimization principles.
-- PII is isolated in `beneficiaries`; all other tables reference by UUID.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE channel_type AS ENUM ('ivr', 'whatsapp', 'field_worker');
CREATE TYPE session_state AS ENUM (
  'initiated', 'consent_pending', 'consent_captured',
  'field_collection', 'confirmation', 'completed', 'abandoned', 'dropped'
);
CREATE TYPE field_status AS ENUM ('extracted', 'confirmed', 'rejected', 'unknown');
CREATE TYPE confidence_label AS ENUM ('high', 'medium', 'needs_officer_review');
CREATE TYPE pathway_type AS ENUM ('wage_employment', 'self_employment', 'home_enterprise');
CREATE TYPE officer_action AS ENUM ('approved', 'modified', 'rejected', 'pending');
CREATE TYPE beneficiary_decision AS ENUM ('interested', 'not_interested', 'wants_to_discuss', 'unable_to_participate', 'pending');
CREATE TYPE referral_status AS ENUM ('not_required', 'required_pending', 'assigned', 'completed');
CREATE TYPE case_priority AS ENUM ('high', 'medium', 'low');

-- =============================================================================
-- TABLE: beneficiaries
-- Core PII table. Access restricted by RLS to service-role only for PII fields.
-- Aadhaar stored ONLY as HMAC-SHA256 hash — never plaintext.
-- =============================================================================
CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id VARCHAR(20) UNIQUE NOT NULL,            -- Portable case ID (e.g., KS-2026-00001)
  phone_hash VARCHAR(64) NOT NULL,                 -- SHA-256 hash of phone number for matching
  name_encrypted TEXT,                             -- AES-256 encrypted name (nullable — data minimization)
  aadhaar_hash VARCHAR(64),                        -- HMAC-SHA256(aadhaar, CONSENT_HMAC_SECRET)
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  age_group VARCHAR(20),                           -- e.g., '18-25', '26-35'
  language_code VARCHAR(10) NOT NULL,              -- e.g., 'ta', 'hi', 'te'
  is_sc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  erased_at TIMESTAMPTZ                            -- DPDP right to erasure timestamp
);

-- Generate sequential case ID
CREATE SEQUENCE case_id_seq START 1;
CREATE OR REPLACE FUNCTION generate_case_id() RETURNS TEXT AS $$
BEGIN
  RETURN 'KS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('case_id_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE: consent_records
-- DPDP-compliant consent log. Immutable — rows never updated.
-- =============================================================================
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE RESTRICT,
  session_id UUID NOT NULL,                        -- References sessions.id (set below)
  channel channel_type NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  consent_text_hash VARCHAR(64) NOT NULL,          -- SHA-256 of the exact consent text presented
  consent_audio_path TEXT,                         -- Path to Supabase Storage recording
  consent_given BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  purpose TEXT NOT NULL DEFAULT 'Livelihood profiling and NSQF-aligned skilling recommendations under PM-AJAY GIA',
  retention_period_days INTEGER NOT NULL DEFAULT 1825, -- 5 years
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: sessions
-- One row per intake session (call or WhatsApp conversation).
-- Supports FR-13a resume/continuity on disconnect.
-- =============================================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
  channel channel_type NOT NULL,
  state session_state NOT NULL DEFAULT 'initiated',
  language_code VARCHAR(10) NOT NULL DEFAULT 'ta',
  phone_number_hash VARCHAR(64) NOT NULL,
  session_token VARCHAR(128),                      -- Temp token for drop-reconnect matching (FR-13a)
  session_token_expires_at TIMESTAMPTZ,
  last_confirmed_field VARCHAR(100),               -- Last confirmed field for resume (FR-13a)
  call_sid TEXT,                                   -- Twilio CallSid or WhatsApp message ID
  stt_confidence_avg FLOAT,                        -- Running average STT confidence
  transcript_path TEXT,                            -- Supabase Storage path to full transcript
  recording_path TEXT,                             -- Supabase Storage path to call recording
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  dropped_at TIMESTAMPTZ,
  resumed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: session_fields
-- Individual field extractions with per-field confirmation status (FR-3).
-- The 7 PS-mandated fields plus system metadata fields.
-- =============================================================================
CREATE TABLE session_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT,
  raw_transcript_excerpt TEXT,                     -- The exact speech that yielded this extraction
  extraction_confidence FLOAT,                     -- LLM extraction confidence 0–1
  status field_status NOT NULL DEFAULT 'extracted',
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  readback_text TEXT,                              -- Exact text read back for confirmation (FR-3)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_session_field UNIQUE (session_id, field_name)
);

-- =============================================================================
-- TABLE: profiles
-- Confirmed, structured beneficiary profiles (7 PS fields + derived metadata).
-- Created only after all required fields are confirmed (FR-3).
-- =============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE RESTRICT,
  session_id UUID NOT NULL REFERENCES sessions(id),

  -- The 7 PS-mandated structured fields
  educational_background JSONB,                   -- { level: 'primary', completed_years: 5, ... }
  family_occupation JSONB,                        -- { occupation: 'weaving', traditional: true, ... }
  current_livelihood JSONB,                       -- { activity: 'daily_wage', income_range: '0-5000', ... }
  skills_and_interests JSONB,                     -- { skills: ['tailoring'], interests: ['food_processing'], informal: true }
  mobility_constraints JSONB,                     -- { has_disability: false, travel_radius_km: 10, caregiving: true }
  employment_preference VARCHAR(30),              -- 'wage', 'self', 'either'
  local_economic_context JSONB,                   -- { district_industries: [], nearby_markets: [] }

  -- Derived metadata from profiling
  skills_embedding VECTOR(768),                   -- pgvector embedding of skills + interests text
  profile_completeness FLOAT NOT NULL DEFAULT 0, -- 0–1, fraction of fields confirmed
  is_complete BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: nsqf_catalog
-- NSQF/QP-NOS trade catalog (seeded from NSDC Track 2 data).
-- =============================================================================
CREATE TABLE nsqf_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qp_code VARCHAR(50) UNIQUE NOT NULL,            -- e.g., 'TEX/Q4101'
  qp_name TEXT NOT NULL,                          -- e.g., 'Weaving Machine Operator'
  sector VARCHAR(100) NOT NULL,                   -- e.g., 'Textile'
  nsqf_level INTEGER NOT NULL CHECK (nsqf_level BETWEEN 1 AND 10),
  pathway_type pathway_type NOT NULL,
  gender_eligible VARCHAR(20) DEFAULT 'all',      -- 'all', 'female_preferred', 'male_preferred'
  requires_mobility BOOLEAN DEFAULT FALSE,
  requires_physical_strength BOOLEAN DEFAULT FALSE,
  min_education_years INTEGER DEFAULT 0,
  typical_income_min INTEGER,                     -- Monthly INR
  typical_income_max INTEGER,
  training_duration_hours INTEGER,
  description TEXT,
  required_skills TEXT[],                         -- Skills needed to enter this trade
  skills_acquired TEXT[],                         -- Skills gained after training
  trade_embedding VECTOR(768),                    -- pgvector embedding for similarity search
  is_active BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: district_data_cache
-- Cached external data (e-Shram, Udyam, DIP) — never queried live (Section 10).
-- =============================================================================
CREATE TABLE district_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL,                    -- 'eshram', 'udyam', 'dip', 'sidh'
  data_type VARCHAR(100) NOT NULL,                -- 'occupation_distribution', 'msme_count', etc.
  payload JSONB NOT NULL,
  fetch_date DATE NOT NULL,
  is_latest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: recommendations
-- Top-3 pathway recommendations per profile with full audit trail.
-- =============================================================================
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE RESTRICT,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),

  -- Pathway details (FR-7)
  qp_code VARCHAR(50) NOT NULL REFERENCES nsqf_catalog(qp_code),
  nsqf_level INTEGER NOT NULL,
  pathway_type pathway_type NOT NULL,
  matched_skills TEXT[],                          -- Beneficiary's existing skills that match
  skills_to_acquire TEXT[],                       -- Gap skills needed
  travel_feasibility BOOLEAN NOT NULL,
  local_opportunity_signal JSONB,                 -- { exists: true, source: 'e-Shram', date: '2026-06' }
  
  -- Confidence & Explanation (FR-8, FR-8a)
  confidence_label confidence_label NOT NULL,
  confidence_inputs JSONB NOT NULL,               -- { profile_completeness, stt_confidence, extraction_certainty, local_data_available }
  explanation_text TEXT NOT NULL,                 -- Plain-language FR-8a explanation
  explanation_factors JSONB NOT NULL,             -- Structured factors that generated the explanation (auditable)
  
  -- AHP/TOPSIS scoring (Section 9)
  ahp_scores JSONB NOT NULL,                      -- Per-criterion AHP-weighted scores
  topsis_score FLOAT NOT NULL,                    -- Final TOPSIS relative closeness
  
  -- Constraint filter log (FR-8d)
  hard_filter_passed BOOLEAN NOT NULL DEFAULT TRUE,
  constraint_flags JSONB,                         -- Which constraints were evaluated
  
  -- Freshness (FR-8b)
  local_data_source VARCHAR(100),
  local_data_last_updated DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: officer_cases
-- Officer review queue (FR-9, FR-10).
-- =============================================================================
CREATE TABLE officer_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE RESTRICT,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  priority case_priority NOT NULL DEFAULT 'medium',
  officer_action officer_action NOT NULL DEFAULT 'pending',
  beneficiary_decision beneficiary_decision NOT NULL DEFAULT 'pending',
  modified_recommendation JSONB,                  -- If officer chose 'modified', stores the override
  officer_notes TEXT,
  assigned_officer_id UUID,
  actioned_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,                       -- computed: created_at + OFFICER_SLA_DAYS
  consultant_referral_status referral_status DEFAULT 'not_required',
  consultant_referral_notes TEXT,
  is_high_confidence BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- TABLE: planning_aggregates
-- Pre-computed district-level statistics (FR-14, FR-16 — batch, not live).
-- =============================================================================
CREATE TABLE planning_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  aggregation_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_beneficiaries INTEGER DEFAULT 0,
  completed_profiles INTEGER DEFAULT 0,
  pending_officer_review INTEGER DEFAULT 0,
  sla_breached INTEGER DEFAULT 0,
  top_requested_trades JSONB,                     -- [{ qp_code, trade_name, count }]
  common_existing_occupations JSONB,
  recurring_skill_gaps JSONB,
  mobility_barrier_count INTEGER DEFAULT 0,
  self_employment_count INTEGER DEFAULT 0,
  wage_employment_count INTEGER DEFAULT 0,
  district_coverage JSONB,                        -- Geographic breakdown
  consultant_referral_pending INTEGER DEFAULT 0,
  mid_interview_dropoff INTEGER DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_district_date UNIQUE (district, aggregation_date)
);

-- =============================================================================
-- TABLE: audit_log
-- Immutable append-only log of all recommendations (auditability requirement).
-- =============================================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,               -- 'recommendation_generated', 'officer_action', 'consent_captured', etc.
  entity_type VARCHAR(50) NOT NULL,               -- 'beneficiary', 'session', 'recommendation', 'officer_case'
  entity_id UUID NOT NULL,
  actor_id UUID,                                  -- Officer ID if human action
  actor_type VARCHAR(20),                         -- 'system', 'officer', 'beneficiary'
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent any updates to audit_log
CREATE RULE no_update_audit_log AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit_log AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_beneficiaries_case_id ON beneficiaries(case_id);
CREATE INDEX idx_beneficiaries_phone_hash ON beneficiaries(phone_hash);
CREATE INDEX idx_sessions_beneficiary ON sessions(beneficiary_id);
CREATE INDEX idx_sessions_phone_hash ON sessions(phone_number_hash);
CREATE INDEX idx_sessions_token ON sessions(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX idx_session_fields_session ON session_fields(session_id);
CREATE INDEX idx_profiles_beneficiary ON profiles(beneficiary_id);
CREATE INDEX idx_recommendations_profile ON recommendations(profile_id);
CREATE INDEX idx_recommendations_beneficiary ON recommendations(beneficiary_id);
CREATE INDEX idx_officer_cases_district ON officer_cases(district, officer_action);
CREATE INDEX idx_officer_cases_sla ON officer_cases(sla_deadline) WHERE officer_action = 'pending';
CREATE INDEX idx_planning_aggregates_district ON planning_aggregates(district, aggregation_date DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_id, event_type);
CREATE INDEX idx_district_data_cache_district ON district_data_cache(district, source, is_latest);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update `updated_at` on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_beneficiaries_updated_at BEFORE UPDATE ON beneficiaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_session_fields_updated_at BEFORE UPDATE ON session_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_officer_cases_updated_at BEFORE UPDATE ON officer_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
