import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route applies the user_profiles migration using the service role
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Apply migration via raw SQL (Supabase supports rpc for SQL execution)
  const migrationSQL = `
    DO $$ BEGIN
      -- Create role enum if not exists
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'district_officer', 'panchayat_kiosk');
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name    TEXT NOT NULL,
      role         user_role NOT NULL DEFAULT 'district_officer',
      district     TEXT,
      panchayat    TEXT,
      is_active    BOOLEAN NOT NULL DEFAULT TRUE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

    -- Drop and recreate policies
    DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
    CREATE POLICY "user_profiles_select_own"
      ON public.user_profiles FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = id);

    DROP POLICY IF EXISTS "user_profiles_select_admin" ON public.user_profiles;
    CREATE POLICY "user_profiles_select_admin"
      ON public.user_profiles FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = (SELECT auth.uid()) AND up.role = 'admin'
        )
      );

    -- Updated_at trigger function
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$;

    DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
    CREATE TRIGGER trg_user_profiles_updated_at
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    if (error) {
      // Try alternative: use the postgres schema directly
      console.error('Migration RPC failed:', error.message);
      return NextResponse.json({ error: error.message, hint: 'Apply 005_user_profiles.sql manually via Supabase SQL Editor' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Migration applied' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
