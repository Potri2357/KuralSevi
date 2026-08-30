-- =============================================================================
-- KURAL SEVI — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- Officers can only access cases in their district.
-- Service role has full access for the voice-api backend.
-- Beneficiary PII is never exposed to frontend officer roles.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsqf_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE officer_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by voice-api backend)
-- This is automatic for service_role in Supabase

-- =============================================================================
-- OFFICER ROLE POLICIES
-- Officers see cases matching their district (stored in JWT custom claims)
-- =============================================================================

-- Officers can view officer_cases for their district only
CREATE POLICY officer_cases_select ON officer_cases
  FOR SELECT
  USING (
    district = (auth.jwt() ->> 'district')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Officers can update (action) officer_cases in their district
CREATE POLICY officer_cases_update ON officer_cases
  FOR UPDATE
  USING (
    district = (auth.jwt() ->> 'district')
    OR (auth.jwt() ->> 'role') = 'admin'
  )
  WITH CHECK (
    district = (auth.jwt() ->> 'district')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Officers can view recommendations for cases in their district
CREATE POLICY recommendations_select ON recommendations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM officer_cases oc
      WHERE oc.beneficiary_id = recommendations.beneficiary_id
      AND (oc.district = (auth.jwt() ->> 'district') OR (auth.jwt() ->> 'role') = 'admin')
    )
  );

-- Officers can view profiles for cases in their district
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM officer_cases oc
      WHERE oc.beneficiary_id = profiles.beneficiary_id
      AND (oc.district = (auth.jwt() ->> 'district') OR (auth.jwt() ->> 'role') = 'admin')
    )
  );

-- Beneficiary PII: Only admin role can view; officers see only case_id and district
CREATE POLICY beneficiaries_select_admin ON beneficiaries
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

-- NSQF catalog is publicly readable (reference data)
CREATE POLICY nsqf_catalog_select ON nsqf_catalog
  FOR SELECT USING (true);

-- District data cache: readable by authenticated officers
CREATE POLICY district_data_select ON district_data_cache
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Planning aggregates: officers see only their district
CREATE POLICY planning_aggregates_select ON planning_aggregates
  FOR SELECT
  USING (
    district = (auth.jwt() ->> 'district')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Audit log: admin only
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Consent records: admin only (contains recording paths)
CREATE POLICY consent_records_select ON consent_records
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Sessions: admin only
CREATE POLICY sessions_select ON sessions
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Session fields: admin only
CREATE POLICY session_fields_select ON session_fields
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin');
