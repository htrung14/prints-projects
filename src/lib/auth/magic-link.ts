/**
 * Magic-link helpers.
 *
 * The request side is tiny: the sign-in form calls
 * `supabase.auth.signInWithOtp` from the browser so Supabase can email the
 * user directly. We keep a thin helper for the callback route that exchanges
 * the `?code=` query param for a session, per the
 * @supabase/ssr "PKCE" flow (the default for signInWithOtp + emailRedirectTo).
 */

import "server-only";
import { adminServerClient } from "@/lib/supabase/admin";

/**
 * Build the URL we hand to Supabase as `emailRedirectTo`. The magic-link email
 * lands on this URL with a `?code=...` (PKCE) param; the callback route then
 * exchanges it for a session.
 *
 * Uses `NEXT_PUBLIC_APP_URL` so the value is identical in the sign-in page
 * (browser) and the callback route (server). Falls back to a sensible dev
 * value when the env is missing so the build doesn't fail locally.
 */
export function magicLinkRedirectUrl(_nextPath?: string): string {
  // Intentionally no query string. Supabase's redirect-URL allowlist matcher
  // is strict: a URL with `?next=…` does not match an allowlist entry of
  // `/admin/auth/callback`, so Supabase silently falls back to Site URL and
  // the magic link lands on `/` instead of the callback. Callback route
  // defaults to `/admin` when `next` is absent.
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/admin/auth/callback`;
}

/**
 * Exchange a magic-link PKCE code for a Supabase session. Cookies are set on
 * the response by the SSR client's `setAll` hook (see
 * `src/lib/supabase/admin.ts`) as part of the route's response lifecycle.
 *
 * Returns the authenticated email or `null` when the exchange fails (bad
 * code, expired link, etc.).
 */
export async function exchangeCodeForSession(
  code: string
): Promise<{ email: string | null } | null> {
  const supabase = await adminServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) return null;
  return { email: data.session.user.email ?? null };
}
