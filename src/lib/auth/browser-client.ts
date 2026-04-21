/**
 * Browser Supabase client, used only by the admin sign-in form.
 *
 * Uses `@supabase/ssr`'s `createBrowserClient` so the cookie format matches
 * the server-side client in `src/lib/supabase/admin.ts`. Without this
 * alignment the session set by the callback route would be invisible to the
 * browser (and vice versa).
 *
 * This file is intentionally tiny and has no "server-only" guard; it is
 * imported by a client component.
 */

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function adminBrowserClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser client unavailable: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  cached = createBrowserClient(url, anonKey);
  return cached;
}
