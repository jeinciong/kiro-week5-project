import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role Supabase client for trusted server-only operations that need
 * to bypass RLS (e.g. looking up attendee emails to send cancellation
 * notices). NEVER import this in client components or expose it to the
 * browser. Requires SUPABASE_SERVICE_ROLE_KEY to be set.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } }
  );
}
