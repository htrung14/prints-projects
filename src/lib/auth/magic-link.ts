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
export function magicLinkRedirectUrl(nextPath?: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const safeNext = nextPath && nextPath.startsWith("/") ? nextPath : "/admin";
  const query = `?next=${encodeURIComponent(safeNext)}`;
  return `${base}/admin/auth/callback${query}`;
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
