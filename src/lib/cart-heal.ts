/**
 * Pure self-heal helper for the cart loader.
 *
 * Extracted from `src/lib/cart.tsx#readLines` so unit tests can exercise
 * the actual production algorithm rather than re-implementing it.
 *
 * Given a parsed cart payload and the set of slugs currently present in
 * the catalog, returns a cleaned CartLine[] with any line whose photoSlug
 * is missing, malformed, or non-string dropped.
 */

import type { CartLine } from "./types";

export function healLines(parsed: unknown, validSlugs: Set<string>): CartLine[] {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (l): l is CartLine =>
      !!l &&
      typeof (l as CartLine).photoSlug === "string" &&
      validSlugs.has((l as CartLine).photoSlug)
  );
}
