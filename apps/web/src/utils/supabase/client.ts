import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// cross-fetch: uses node-fetch on server (bypasses Node v26 native fetch ECONNRESET bug),
// and browser's native fetch on the client. This is safe to import in client components.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const crossFetch =
  typeof window === 'undefined'
    ? (require('cross-fetch') as { fetch: typeof fetch }).fetch
    : undefined; // browser: let supabase-js use native window.fetch

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    ...(crossFetch ? { global: { fetch: crossFetch } } : {}),
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
