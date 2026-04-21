/**
 * Single source of truth for the 8-character customer-facing order reference.
 *
 * The order ref shown on /thank-you, the confirmation email, and /track is
 * the first UUID segment (8 hex chars, displayed uppercase). The same regex
 * is needed in a few places — client form, server page, query helper — so it
 * lives here to keep those spellings from drifting apart.
 */

export const REF_PATTERN = /^[0-9a-f]{8}$/i;

export function isOrderRefPrefix(s: string): boolean {
  return REF_PATTERN.test(s);
}
