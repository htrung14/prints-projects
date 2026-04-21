/**
 * Resend SDK singleton.
 *
 * We deliberately do NOT instantiate at import time so a missing
 * `RESEND_API_KEY` doesn't break typecheck/build. Any caller that actually
 * needs to send an email calls `getResend()` which throws if the key is unset.
 *
 * See docs-ai/backend-plan.md §"Track C" - Resend is the locked provider.
 */

import "server-only";
import { Resend } from "resend";

let _client: Resend | null = null;

export function getResend(): Resend {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Resend client unavailable: set RESEND_API_KEY in the environment.");
  }
  _client = new Resend(key);
  return _client;
}

/**
 * The configured "From" address for all transactional mail.
 * Defaults to `orders@thaliabassim.com` per backend-plan.md. Override via
 * `RESEND_FROM_EMAIL` when the real domain is verified.
 */
export function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "orders@thaliabassim.com";
}

/**
 * Legacy helper retained for anything still reading the env var directly.
 * Prefer `getPrinterEmail()` from `@/lib/supabase/queries/settings`, which
 * reads from the admin-editable settings table with env fallback.
 *
 * Throws if unset — we refuse to silently send the print job to the wrong
 * address.
 */
export function printShopAddress(): string {
  const addr = process.env.PRINT_SHOP_EMAIL;
  if (!addr) {
    throw new Error(
      "PRINT_SHOP_EMAIL env not set and no admin setting configured. Set it at /admin/settings."
    );
  }
  return addr;
}
