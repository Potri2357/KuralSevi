import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createNodeFetch } from '@/lib/node-fetch-adapter';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

// Use custom https-based fetch to avoid Node v26 native fetch ECONNRESET on Cloudflare
const serverFetch = createNodeFetch() as typeof fetch;

export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>
) => {
  return createServerClient(supabaseUrl!, supabaseKey!, {
    global: { fetch: serverFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — safe to ignore
        }
      },
    },
  });
};
