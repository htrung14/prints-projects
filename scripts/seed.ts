/**
 * Seed the `photos` table from src/data/photos.fixture.json.
 *
 * Usage (after wiring .env.local with SUPABASE_* vars):
 *   corepack pnpm seed
 *
 * The `seed` npm script runs tsx with `--env-file=.env.local`, which makes the
 * service-role credentials available without adding `dotenv` as a dependency.
 *
 * NOTE: this script constructs its own Supabase service-role client instead of
 * importing `src/lib/supabase/server.ts`. That file starts with
 * `import "server-only"`, which is a Next-bundled marker module. Under Next
 * it's aliased to an empty shim; under plain tsx (a Node ESM runtime) it's
 * not resolvable. The credentials and client options match `server.ts` so
 * behaviour is identical.
 *
 * Idempotent: upserts by `slug`. Safe to re-run; resets `is_published` and
 * `sort_order` to the current fixture ordering, but preserves `edition_sold`
 * if it has diverged upward from the fixture value (a partial sale should
 * not be clobbered by a re-seed).
 *
 * Paper transformation per Hai's 2026-04-16 decision (docs-ai/backend-plan.md):
 *   photo-rag -> "Hahnemühle Photo Rag Baryta"
 *   baryta    -> "Canson Baryta Photographique"
 *   bamboo    -> DROPPED
 *   All surcharges forced to 0 (flat per-photo pricing).
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { PaperOption, PaperType, Photo } from "../src/lib/types";

// ---------------------------------------------------------------------------
// Resolve fixture path relative to this script (ESM-compatible).
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURE_PATH = resolve(__dirname, "../src/data/photos.fixture.json");

// ---------------------------------------------------------------------------
// Supabase client. Mirrors src/lib/supabase/server.ts configuration.
// ---------------------------------------------------------------------------
function buildClient(): ReturnType<typeof createClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "seed: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Did you run with `--env-file=.env.local`?"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Paper collapse rules
// ---------------------------------------------------------------------------
type AllowedPaperId = Exclude<PaperType, "bamboo">;

const PAPER_DISPLAY: Record<AllowedPaperId, string> = {
  "photo-rag": "Hahnemühle Photo Rag Baryta",
  baryta: "Canson Baryta Photographique",
};

function isAllowedPaper(id: PaperType): id is AllowedPaperId {
  return id === "photo-rag" || id === "baryta";
}

function collapsePapers(input: PaperOption[]): PaperOption[] {
  const seen = new Set<AllowedPaperId>();
  const out: PaperOption[] = [];
  for (const paper of input) {
    if (!isAllowedPaper(paper.id)) continue; // drop bamboo
    if (seen.has(paper.id)) continue;
    seen.add(paper.id);
    out.push({
      id: paper.id,
      name: PAPER_DISPLAY[paper.id],
      surchargeCents: 0,
    });
  }
  // Canonical order: photo-rag first, baryta second.
  const order: AllowedPaperId[] = ["photo-rag", "baryta"];
  out.sort((a, b) => order.indexOf(a.id as AllowedPaperId) - order.indexOf(b.id as AllowedPaperId));
  return out;
}

// ---------------------------------------------------------------------------
// Row shape (snake_case) for upsert
// ---------------------------------------------------------------------------
type PhotoSeedRow = {
  slug: string;
  reference_number: string;
  title: string;
  title_italic: string | null;
  subtitle: string | null;
  year: number;
  description: string[];
  image_url: string;
  image_alt: string;
  base_price_cents: number;
  sizes: Photo["sizes"];
  papers: PaperOption[];
  edition_total: number;
  edition_sold: number;
  is_published: boolean;
  sort_order: number;
};

function photoToRow(photo: Photo, index: number): PhotoSeedRow {
  return {
    slug: photo.slug,
    reference_number: photo.referenceNumber,
    title: photo.title,
    title_italic: photo.titleItalic ?? null,
    subtitle: photo.subtitle ?? null,
    year: photo.year,
    description: photo.description,
    image_url: photo.imageUrl,
    image_alt: photo.imageAlt,
    base_price_cents: photo.basePriceCents,
    sizes: photo.sizes,
    papers: collapsePapers(photo.papers),
    edition_total: photo.editionTotal,
    edition_sold: photo.editionSold,
    is_published: true,
    sort_order: index * 10,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const raw = readFileSync(FIXTURE_PATH, "utf8");
  const fixture = JSON.parse(raw) as Photo[];

  if (!Array.isArray(fixture) || fixture.length === 0) {
    throw new Error(`Fixture at ${FIXTURE_PATH} is empty or malformed`);
  }

  const db = buildClient();

  // Preserve a higher existing `edition_sold` so a re-seed can't overwrite
  // real sales with the fixture's hand-edited demo value.
  const { data: existing, error: readErr } = await db.from("photos").select("slug, edition_sold");
  if (readErr) {
    throw new Error(`seed: failed to read existing photos: ${readErr.message}`);
  }
  const existingBySlug = new Map<string, number>();
  for (const row of (existing ?? []) as Array<{
    slug: string;
    edition_sold: number;
  }>) {
    existingBySlug.set(row.slug, row.edition_sold);
  }

  const rows: PhotoSeedRow[] = fixture.map((photo, i) => {
    const row = photoToRow(photo, i);
    const existingSold = existingBySlug.get(row.slug);
    if (typeof existingSold === "number" && existingSold > row.edition_sold) {
      row.edition_sold = existingSold;
    }
    return row;
  });

  // supabase-js narrows the row type to `never` when no generated
  // Database type is wired. We know the shape from PhotoSeedRow, so cast
  // the rows through `unknown` to satisfy the overload.
  const { error: upsertErr, count } = await db.from("photos").upsert(rows as unknown as never[], {
    onConflict: "slug",
    count: "exact",
  });
  if (upsertErr) {
    throw new Error(`seed: upsert failed: ${upsertErr.message}`);
  }

  const canonicalPaperCount = collapsePapers(fixture[0]?.papers ?? []).length;
  console.log(
    `seed: upserted ${count ?? rows.length} photos (fixture has ${fixture.length}; canonical papers per photo: ${canonicalPaperCount}).`
  );
}

main().catch((err: unknown) => {
  console.error("seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
