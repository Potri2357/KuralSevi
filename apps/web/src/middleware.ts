import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseJs } from '@supabase/supabase-js';
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

// Route → strictly allowed roles
const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/officer': ['admin', 'district_officer'],
  '/kiosk': ['admin', 'panchayat_kiosk'],
};

function matchProtectedRoute(pathname: string): UserRole[] | null {
  for (const [prefix, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return roles;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // --- Public routes ---
  // Allow landing page '/', /login, /verify, public assets, and api
  const PUBLIC_PATHS = ['/login', '/verify', '/api', '/_next', '/favicon.ico'];
  if (
    pathname === '/' ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return supabaseResponse;
  }

  // --- Protected routes ---
  const allowedRoles = matchProtectedRoute(pathname);
  if (!allowedRoles) {
    return supabaseResponse;
  }

  // 1. Check fast signed role cookie
  const fastRole = request.cookies.get('ks_role')?.value as UserRole | undefined;

  // 2. Create server client with cookie handling
  const serverFetch = createNodeFetch() as typeof fetch;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { fetch: serverFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Check auth user
  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  // If no user found and no fast role cookie
  if (!user && !fastRole) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Determine active role
  let role: UserRole | undefined = fastRole;
  if (user && !role) {
    const profile = await getUserProfile(user.id);
    role = profile?.role as UserRole | undefined;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Redirect unauthorized user to their proper dashboard or login
    const targetDashboard = role ? roleDashboard(role) : '/login';
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  }

  return supabaseResponse;
}

async function getUserProfile(userId: string) {
  try {
    const serverFetch = createNodeFetch() as typeof fetch;
    const client = createSupabaseJs(SUPABASE_URL, SUPABASE_KEY, {
      global: { fetch: serverFetch },
      auth: { persistSession: false },
    });
    const { data } = await client
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', userId)
      .single();
    return data;
  } catch {
    return null;
  }
}

function roleDashboard(role?: string): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'panchayat_kiosk':
      return '/kiosk';
    case 'district_officer':
    default:
      return '/officer';
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
