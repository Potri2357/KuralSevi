import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  try {
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

    await supabase.auth.signOut();
  } catch (e) {
    console.error('Error during signOut:', e);
  }

  // Clear application cookies
  response.cookies.delete('ks_role');
  response.cookies.delete('ks_user');

  return response;
}
