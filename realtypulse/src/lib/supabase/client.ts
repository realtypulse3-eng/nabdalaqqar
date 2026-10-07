'use client';

import { createBrowserClient } from '@supabase/ssr';

// Note: not parameterized with a generated `Database` type. The types in
// `./types.ts` are hand-written to match schema.sql for use in app code.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
