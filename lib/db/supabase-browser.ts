/**
 * Supabase Browser Client
 * For client-side auth and data operations
 */

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase browser client disabled: Missing env vars');
    return null;
  }

  client = createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}
