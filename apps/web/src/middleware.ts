import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type UserRole = 'admin' | 'district_officer' | 'panchayat_kiosk';

// Route → allowed roles
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: must call getUser() not getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- Public routes: allow through without auth ---
  const PUBLIC_PATHS = ['/login', '/verify', '/api', '/_next', '/favicon.ico'];
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return supabaseResponse;
  }

  // --- Root page: redirect based on auth state ---
  if (pathname === '/') {
    if (!user) return supabaseResponse; // Show landing
    // Authenticated users go to their dashboard
    const profile = await getUserProfile(supabase, user.id);
    const dest = roleDashboard(profile?.role);
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // --- Protected routes ---
  const allowedRoles = matchProtectedRoute(pathname);
  if (allowedRoles) {
    if (!user) {
      // Not logged in → login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Fetch profile from DB
    const profile = await getUserProfile(supabase, user.id);
    const role = profile?.role as UserRole | undefined;

    if (!role || !allowedRoles.includes(role)) {
      // Wrong role → their own dashboard
      const dashUrl = roleDashboard(role);
      return NextResponse.redirect(new URL(dashUrl, request.url));
    }
  }

  return supabaseResponse;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserProfile(supabase: any, userId: string) {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('role, is_active, full_name')
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
