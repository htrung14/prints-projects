/**
 * Typed query helpers for the `photos` table.
 *
 * Server-only - never import from a client component. The service-role
 * client in `../server.ts` bypasses RLS; the browser has no Supabase access
 * in v1 (see docs-ai/backend-plan.md §RLS).
 */

import "server-only";
import type { Photo, PaperOption, PaperType, SizeOption } from "@/lib/types";
import { serverClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Row shape returned by Supabase (snake_case). Kept local so we don't leak
// DB-column names into the rest of the app.
// ---------------------------------------------------------------------------
type PhotoRow = {
  id: string;
  slug: string;
  reference_number: string;
  title: string;
  title_italic: string | null;
  subtitle: string | null;
  year: number;
  description: unknown; // jsonb; narrowed in mapper
  image_url: string;
  image_alt: string;
  base_price_cents: number;
  sizes: unknown; // jsonb
  papers: unknown; // jsonb
  edition_total: number;
  edition_sold: number;
  is_published: boolean;
  sort_order: number;
  print_file_key: string | null;
};

const PHOTO_COLUMNS =
  "id, slug, reference_number, title, title_italic, subtitle, year, description, image_url, image_alt, base_price_cents, sizes, papers, edition_total, edition_sold, is_published, sort_order, print_file_key";

function parseDescription(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((p): p is string => typeof p === "string");
  }
  return [];
}

function parseSizes(raw: unknown): SizeOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((s): SizeOption[] => {
    if (typeof s !== "object" || s === null) return [];
    const rec = s as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id : null;
    const label = typeof rec.label === "string" ? rec.label : null;
    const multiplier = typeof rec.multiplier === "number" ? rec.multiplier : null;
    if (id === null || label === null || multiplier === null) return [];
    return [{ id, label, multiplier }];
  });
}

function parsePapers(raw: unknown): PaperOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((p): PaperOption[] => {
    if (typeof p !== "object" || p === null) return [];
    const rec = p as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id : null;
    const name = typeof rec.name === "string" ? rec.name : null;
    const surcharge = typeof rec.surchargeCents === "number" ? rec.surchargeCents : null;
    if (id === null || name === null || surcharge === null) return [];
    // PaperType is a closed union; we narrow but don't validate here because
    // the seed and the fixture both feed from the same PaperType set.
    return [{ id: id as PaperType, name, surchargeCents: surcharge }];
  });
}

function rowToPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    slug: row.slug,
    referenceNumber: row.reference_number,
    title: row.title,
    titleItalic: row.title_italic ?? undefined,
    subtitle: row.subtitle ?? undefined,
    year: row.year,
    description: parseDescription(row.description),
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    basePriceCents: row.base_price_cents,
    sizes: parseSizes(row.sizes),
    papers: parsePapers(row.papers),
    editionTotal: row.edition_total,
    editionSold: row.edition_sold,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    printFileKey: row.print_file_key ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export async function listPublishedPhotos(): Promise<Photo[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`listPublishedPhotos failed: ${error.message}`);
  }
  // `data` is typed as `unknown[] | null` when no generated types are wired.
  const rows = (data ?? []) as PhotoRow[];
  return rows.map(rowToPhoto);
}

export async function getPhotoBySlug(slug: string): Promise<Photo | null> {
  const db = serverClient();
  const { data, error } = await db
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`getPhotoBySlug(${slug}) failed: ${error.message}`);
  }
  if (!data) return null;
  return rowToPhoto(data as PhotoRow);
}

export async function getPhotoById(id: string): Promise<Photo | null> {
  const db = serverClient();
  const { data, error } = await db.from("photos").select(PHOTO_COLUMNS).eq("id", id).maybeSingle();

  if (error) {
    throw new Error(`getPhotoById(${id}) failed: ${error.message}`);
  }
  if (!data) return null;
  return rowToPhoto(data as PhotoRow);
}
