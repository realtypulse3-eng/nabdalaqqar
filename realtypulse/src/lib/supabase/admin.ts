import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client. Bypasses Row Level Security entirely.
 *
 * ONLY import this file from server-only code (route handlers, server
 * actions) that has already verified the caller's identity and
 * authorization itself — e.g. inviting a teammate by email.
 *
 * Never import this into a Client Component, and never send the
 * service-role key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Admin operations (e.g. team invites) are disabled until it is set in your environment.'
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
