import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key.
//
// SECURITY: the service-role key bypasses Row Level Security and grants full
// database access. It must never reach the browser. This module imports
// "server-only" so any accidental import from a Client Component fails the
// build instead of leaking the key.

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client authenticated with the service-role key.
 * Reads configuration lazily so a missing env var throws a clear error at call
 * time (e.g. inside an API route) rather than crashing at module load.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}
