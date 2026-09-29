#!/usr/bin/env node
// apply-migration.mjs — Applies user_profiles migration to Supabase
// Run: node apply-migration.mjs

const SUPABASE_URL = 'https://iuedutlxbqdgeniiggvu.supabase.co';
// Use service role key from env or hardcode for one-time run
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZWR1dGx4YnFkZ2VuaWlnZ3Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODEwNDU4MywiZXhwIjoyMTAzNjgwNTgzfQ';

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ sql }),
  });
  return res;
}

// Instead, we use the Supabase management API
async function applyMigration() {
  console.log('Applying user_profiles migration...');
  
  const statements = [
    // Create enum
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'district_officer', 'panchayat_kiosk');
      END IF;
    END $$`,
    
    // Create table
    `CREATE TABLE IF NOT EXISTS public.user_profiles (
      id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name    TEXT NOT NULL DEFAULT '',
      role         user_role NOT NULL DEFAULT 'district_officer',
      district     TEXT,
      panchayat    TEXT,
      is_active    BOOLEAN NOT NULL DEFAULT TRUE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    
    // Enable RLS
    `ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY`,
    
    // Policies
    `DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles`,
    `CREATE POLICY "user_profiles_select_own"
      ON public.user_profiles FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = id)`,
    
    `DROP POLICY IF EXISTS "user_profiles_select_admin" ON public.user_profiles`,
    `CREATE POLICY "user_profiles_select_admin"
      ON public.user_profiles FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = (SELECT auth.uid()) AND up.role = 'admin'
        )
      )`,
    
    // Updated_at trigger
    `CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $func$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $func$`,
    
    `DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles`,
    `CREATE TRIGGER trg_user_profiles_updated_at
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()`,
  ];

  for (const stmt of statements) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal',
      },
    });
    console.log(`Statement result: ${res.status}`);
  }

  console.log('\nNOTE: If the above did not work, copy supabase/migrations/005_user_profiles.sql');
  console.log('and paste it into Supabase Dashboard → SQL Editor → Run.');
  console.log('\nProject URL: https://supabase.com/dashboard/project/iuedutlxbqdgeniiggvu/sql');
}

applyMigration().catch(console.error);
