/**
 * Admin email allowlist.
 *
 * `ADMIN_EMAILS` is a comma-separated env value (e.g.
 * `hai@example.com,rob@brooklynarchival.com`). A valid Supabase session is
 * **not** sufficient to grant admin access - the authenticated email must also
 * appear in this list. See docs-ai/backend-plan.md §"Locked decisions".
 *
 * Kept as a tiny standalone module so it can be imported from middleware
 * (which runs in the Edge-by-default Proxy runtime) without pulling in any
 * Supabase cookie machinery.
 */

import "server-only";

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

/** Lower-cased, trimmed list of admin emails from the env. */
export function adminEmails(): string[] {
  return parseAllowlist(process.env.ADMIN_EMAILS);
}

/** True when `email` is on the `ADMIN_EMAILS` allowlist (case-insensitive). */
export function isAllowlistedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const target = email.trim().toLowerCase();
  if (target.length === 0) return false;
  return adminEmails().includes(target);
}
