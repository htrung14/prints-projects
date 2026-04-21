/**
 * Server-only helpers that resolve the current admin session.
 *
 * The admin area uses Supabase magic-link auth (see `./magic-link.ts` and the
 * `/admin/sign-in` page). A valid Supabase session is not sufficient on its
 * own - the authenticated email must also appear in the `ADMIN_EMAILS`
 * allowlist (see `./allowlist.ts`).
 *
 * Usage:
 *   const session = await requireAdmin();    // redirects if not admin
 *   const session = await getAdminSession(); // returns null if not admin
 */

import "server-only";
import { redirect } from "next/navigation";
import { adminServerClient } from "@/lib/supabase/admin";
import { isAllowlistedEmail } from "@/lib/auth/allowlist";

export type AdminSession = {
  email: string;
};

/**
 * Resolve the current admin session, or `null` if the visitor is not signed in
 * or their email is not on the allowlist.
 *
 * Uses `getUser()` rather than `getSession()` - the docs in
 * node_modules/@supabase/ssr/README.md flag `getSession()` as unsafe for
 * authorization since the session user payload comes straight from the cookie
 * and is not verified against the Auth server.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await adminServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  const email = user.email ?? null;
  if (!isAllowlistedEmail(email)) return null;
  return { email: email as string };
}

/**
 * Assert an admin session, redirecting to `/admin/sign-in?next=...` when not
 * authorized. Intended for page/server-action entry points.
 *
 * `nextPath` should be the current pathname (plus query) so the sign-in page
 * can send the user back after a successful callback.
 */
export async function requireAdmin(nextPath?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    const target = nextPath && nextPath.startsWith("/") ? nextPath : "/admin";
    redirect(`/admin/sign-in?next=${encodeURIComponent(target)}`);
  }
  return session;
}

/** Thin re-export so callers don't have to import from two files. */
export { isAllowlistedEmail } from "@/lib/auth/allowlist";
