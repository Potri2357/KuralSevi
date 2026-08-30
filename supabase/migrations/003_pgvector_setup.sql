-- =============================================================================
-- KURAL SEVI — pgvector Setup
-- Migration: 003_pgvector_setup.sql
-- Sets up vector indexes for semantic similarity search in the recommendation engine.
-- =============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create IVFFlat index on trade embeddings for fast similarity search
-- 100 lists is appropriate for a catalog of ~1000-5000 trades
CREATE INDEX IF NOT EXISTS nsqf_catalog_trade_embedding_idx
  ON nsqf_catalog USING ivfflat (trade_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create index on profile skills embeddings
CREATE INDEX IF NOT EXISTS profiles_skills_embedding_idx
  ON profiles USING ivfflat (skills_embedding vector_cosine_ops)
  WITH (lists = 50);

-- Helper function: find top K similar trades for a given skills embedding
CREATE OR REPLACE FUNCTION find_similar_trades(
  query_embedding VECTOR(768),
  top_k INTEGER DEFAULT 15,
  exclude_qp_codes TEXT[] DEFAULT '{}'::TEXT[],
  min_nsqf_level INTEGER DEFAULT 1,
  max_nsqf_level INTEGER DEFAULT 10
)
RETURNS TABLE(
  qp_code VARCHAR,
  qp_name TEXT,
  sector VARCHAR,
  nsqf_level INTEGER,
  pathway_type pathway_type,
  gender_eligible VARCHAR,
  requires_mobility BOOLEAN,
  requires_physical_strength BOOLEAN,
  min_education_years INTEGER,
  typical_income_min INTEGER,
  typical_income_max INTEGER,
  required_skills TEXT[],
  skills_acquired TEXT[],
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    n.qp_code, n.qp_name, n.sector, n.nsqf_level, n.pathway_type,
    n.gender_eligible, n.requires_mobility, n.requires_physical_strength,
    n.min_education_years, n.typical_income_min, n.typical_income_max,
    n.required_skills, n.skills_acquired,
    1 - (n.trade_embedding <=> query_embedding) AS similarity
  FROM nsqf_catalog n
  WHERE
    n.is_active = TRUE
    AND n.qp_code != ALL(exclude_qp_codes)
    AND n.nsqf_level >= min_nsqf_level
    AND n.nsqf_level <= max_nsqf_level
    AND n.trade_embedding IS NOT NULL
  ORDER BY n.trade_embedding <=> query_embedding
  LIMIT top_k;
$$;
