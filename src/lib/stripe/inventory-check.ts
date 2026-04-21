import "server-only";
import type { CartLine } from "@/lib/types";
import { serverClient } from "@/lib/supabase/server";

/**
 * Non-authoritative check: warns the customer before checkout if an edition
 * is likely exhausted. The RPC's FOR UPDATE lock is the real guard — this
 * just avoids wasting the customer's time.
 *
 * Returns null if stock looks fine, or an error message string if not.
 */
export async function softInventoryCheck(lines: CartLine[]): Promise<string | null> {
  const db = serverClient();

  const slugs = [...new Set(lines.map((l) => l.photoSlug))];
  const { data: photos, error } = await db
    .from("photos")
    .select("slug, edition_sold, edition_total, is_published")
    .in("slug", slugs);

  if (error || !photos) return null;

  const qtyBySlug = new Map<string, number>();
  for (const line of lines) {
    qtyBySlug.set(line.photoSlug, (qtyBySlug.get(line.photoSlug) ?? 0) + line.quantity);
  }

  for (const photo of photos) {
    if (!photo.is_published) {
      return `"${photo.slug}" is no longer available.`;
    }
    const requested = qtyBySlug.get(photo.slug) ?? 0;
    const remaining = (photo.edition_total ?? 10) - (photo.edition_sold ?? 0);
    if (requested > remaining) {
      return remaining <= 0
        ? `"${photo.slug}" is sold out.`
        : `Only ${remaining} edition(s) of "${photo.slug}" remaining.`;
    }
  }

  return null;
}
