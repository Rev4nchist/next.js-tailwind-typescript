import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure environment variables are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}
if (!supabaseServiceKey) {
  // Service key is only needed on the server, so this check might be context-dependent
  // console.warn('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. Required for server-side operations.');
}

// Client for browser context (uses Anon key)
let browserClientInstance: SupabaseClient | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (!browserClientInstance) {
    browserClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClientInstance;
};

// Client for server context (uses Service Role key for elevated privileges)
let serverClientInstance: SupabaseClient | null = null;

export const getSupabaseServerClient = (): SupabaseClient => {
  // Ensure this is only called server-side where the service key is available
  if (typeof window !== 'undefined') {
    throw new Error('Attempted to get server client on the browser.');
  }
  if (!supabaseServiceKey) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. Required for server client.');
  }
  if (!serverClientInstance) {
    serverClientInstance = createClient(supabaseUrl, supabaseServiceKey, {
       auth: {
         // Prevent client from trying to use browser storage for auth
         persistSession: false,
         autoRefreshToken: false,
       },
    });
  }
  return serverClientInstance;
};

// Generic client (useful if context is unknown or handled elsewhere, defaults to browser)
// Deprecated in favor of explicit clients, but kept for potential reference
// export const supabase = createClient(supabaseUrl, supabaseAnonKey); 