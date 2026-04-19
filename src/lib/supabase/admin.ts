/**
 * Cookie-backed Supabase client for the /admin area.
 *
 * Uses @supabase/ssr so server components, route handlers, and middleware can
 * share the same session cookie. Only the allowlisted emails in ADMIN_EMAILS
 * may sign in (enforced in `./auth.ts`, not here).
 */

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function adminServerClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase admin client unavailable: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component - cookie mutation is not allowed
          // there. Safe to ignore when middleware is refreshing the session.
        }
      },
    },
  });
}
