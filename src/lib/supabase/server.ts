/**
 * Supabase client for server-side code (API routes, webhooks, server components).
 *
 * Uses the **service-role key** - bypasses RLS. Only import this file from
 * server-only code. Never expose the service role to the browser.
 *
 * For admin auth (cookie-backed sessions), use `./admin.ts` instead.
 */

import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Fail loud at boot rather than silently returning a broken client.
  // During `next build` this runs; ensure env is wired before building.
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[supabase/server] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing; service-role client will throw on use."
    );
  }
}

export function serverClient() {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service-role client unavailable: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
