-- =============================================================================
-- KURAL SEVI — User Profiles & Role-Based Access Control
-- Migration: 005_user_profiles.sql
-- Roles: admin | district_officer | panchayat_kiosk
-- Role claim stored in app_metadata (server-side only, not user-editable)
-- =============================================================================

-- Role enum
CREATE TYPE user_role AS ENUM ('admin', 'district_officer', 'panchayat_kiosk');

-- =============================================================================
-- TABLE: user_profiles
-- One row per auth.users entry. Role is the single source of truth for authz.
-- NEVER read role from user_metadata — it is user-editable.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'district_officer',
  district     TEXT,                       -- district_officer / panchayat_kiosk scope
  panchayat    TEXT,                       -- kiosk: which GP this kiosk serves
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create a profile skeleton when a new auth user signs up
-- Role must be set by an admin via the service-role after creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    -- Default to district_officer; admin upgrades via service-role
    COALESCE((NEW.raw_app_meta_data->>'role')::user_role, 'district_officer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Admins can read all profiles
CREATE POLICY "user_profiles_select_admin"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = (SELECT auth.uid()) AND up.role = 'admin'
    )
  );

-- Only service_role can INSERT/UPDATE/DELETE (admin UI uses service-role endpoint)
-- No authenticated INSERT policy → all mutations go through API routes with service_role key

-- =============================================================================
-- Seed users (use after sign-up via Supabase Auth; update role as needed)
-- Example: UPDATE public.user_profiles SET role = 'admin' WHERE id = '<uuid>';
-- =============================================================================
