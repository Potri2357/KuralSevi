import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseJs } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createNodeFetch } from '@/lib/node-fetch-adapter';

type UserRole = 'admin' | 'district_officer' | 'panchayat_kiosk';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://iuedutlxbqdgeniiggvu.supabase.co';

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_egP8KJhgDC6SoW4uqLzBeA_LpHeH7bF';

const serverFetch = createNodeFetch() as typeof fetch;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role: requestedRole } = body as {
      email?: string;
      password?: string;
      role?: UserRole;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Official email and password are required.' },
        { status: 400 }
      );
    }

    if (!requestedRole || !['admin', 'district_officer', 'panchayat_kiosk'].includes(requestedRole)) {
      return NextResponse.json(
        { error: 'Please select a designated role from the dropdown.' },
        { status: 400 }
      );
    }

    // Prepare response object to set cookies
    let response = NextResponse.json({ success: true });

    // 1. Initialize Supabase SSR client with custom Node HTTPS fetch
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: serverFetch },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // 2. Authenticate credentials via Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid credentials. Please verify your email and password.' },
        { status: 401 }
      );
    }

    // 3. Fetch user profile from public.user_profiles
    const directClient = createSupabaseJs(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: serverFetch },
      auth: { persistSession: false },
    });

    let { data: profile } = await directClient
      .from('user_profiles')
      .select('id, full_name, role, district, panchayat, is_active')
      .eq('id', authData.user.id)
      .single();

    // Graceful onboarding: If user exists in Auth but user_profiles row was not yet seeded
    if (!profile) {
      const emailLower = email.toLowerCase();
      const isAdminEmail =
        emailLower.includes('admin') ||
        emailLower.includes('potrinathanpm') ||
        emailLower.startsWith('admin@');

      const initialRole: UserRole =
        requestedRole === 'admin' && isAdminEmail
          ? 'admin'
          : requestedRole || 'district_officer';

      const displayName =
        authData.user.user_metadata?.full_name ||
        authData.user.email?.split('@')[0] ||
        'Official';

      const { data: newProfile } = await directClient
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          full_name: displayName,
          role: initialRole,
          is_active: true,
        })
        .select()
        .single();

      const fallbackProfile: {
        id: string;
        full_name: string;
        role: string;
        district: string | null;
        panchayat: string | null;
        is_active: boolean;
      } = newProfile || {
        id: authData.user.id,
        full_name: displayName,
        role: initialRole,
        is_active: true,
        district: null,
        panchayat: null,
      };
      profile = fallbackProfile;
    }

    const activeProfile = profile!;

    // 4. Strict Deactivation Check
    if (activeProfile.is_active === false) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Account Suspended: Your access has been deactivated. Please contact your system administrator.' },
        { status: 403 }
      );
    }

    // 5. STRICT ROLE RESTRICTION
    const actualRole = activeProfile.role as UserRole;
    let isRoleAuthorized = false;

    if (requestedRole === 'admin') {
      // Admin portal: STRICTLY admin role only
      isRoleAuthorized = actualRole === 'admin';
    } else if (requestedRole === 'district_officer') {
      // District officer portal: district_officer or admin
      isRoleAuthorized = actualRole === 'district_officer' || actualRole === 'admin';
    } else if (requestedRole === 'panchayat_kiosk') {
      // Panchayat kiosk portal: panchayat_kiosk or admin
      isRoleAuthorized = actualRole === 'panchayat_kiosk' || actualRole === 'admin';
    }

    const ROLE_TITLES: Record<UserRole, string> = {
      admin: 'Central Administrator',
      district_officer: 'District Welfare Officer',
      panchayat_kiosk: 'Gram Panchayat Kiosk Operator',
    };

    if (!isRoleAuthorized) {
      // Revoke the session immediately because of role mismatch
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error: `Access Denied: Your assigned account role is "${ROLE_TITLES[actualRole] || actualRole}". You do not have authorization to access the ${ROLE_TITLES[requestedRole] || requestedRole} portal. Please select your assigned role or contact your administrator.`,
          actualRole,
          requestedRole,
        },
        { status: 403 }
      );
    }

    // 6. Calculate destination redirect URL
    let redirectUrl = '/officer';
    if (requestedRole === 'admin') {
      redirectUrl = '/admin';
    } else if (requestedRole === 'panchayat_kiosk') {
      redirectUrl = '/kiosk';
    } else {
      redirectUrl = '/officer';
    }

    // 7. Stamp fast-access session cookies
    response.cookies.set('ks_role', actualRole, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set(
      'ks_user',
      JSON.stringify({
        id: authData.user.id,
        email: authData.user.email,
        full_name: activeProfile.full_name,
        role: actualRole,
        district: activeProfile.district,
        panchayat: activeProfile.panchayat,
      }),
      {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    // Return final JSON with cookies attached
    return NextResponse.json(
      {
        success: true,
        redirectUrl,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: actualRole,
          full_name: activeProfile.full_name,
          district: activeProfile.district,
          panchayat: activeProfile.panchayat,
        },
      },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Login error:', message);
    return NextResponse.json(
      { error: `Authentication service error: ${message}` },
      { status: 500 }
    );
  }
}
