import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseJs } from '@supabase/supabase-js';
import { createNodeFetch } from '@/lib/node-fetch-adapter';

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

export async function GET(request: NextRequest) {
  // First check fast cookie
  const roleCookie = request.cookies.get('ks_role')?.value;
  const userCookie = request.cookies.get('ks_user')?.value;

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: serverFetch },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // not setting cookies here
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null, role: null });
    }

    const directClient = createSupabaseJs(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: serverFetch },
      auth: { persistSession: false },
    });

    const { data: profile } = await directClient
      .from('user_profiles')
      .select('id, full_name, role, district, panchayat, is_active')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.email?.split('@')[0],
        role: profile?.role || roleCookie || 'district_officer',
        district: profile?.district,
        panchayat: profile?.panchayat,
        is_active: profile?.is_active ?? true,
      },
    });
  } catch {
    if (userCookie && roleCookie) {
      try {
        const parsed = JSON.parse(userCookie);
        return NextResponse.json({
          authenticated: true,
          user: parsed,
        });
      } catch {
        // ignore
      }
    }
    return NextResponse.json({ authenticated: false, user: null, role: null });
  }
}
