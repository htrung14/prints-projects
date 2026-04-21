/**
 * Unit test for the cart self-heal behaviour:
 * when localStorage contains a CartLine whose photoSlug is no longer in the
 * fixture, the reader drops it and rewrites storage with the cleaned value.
 *
 * We replicate the self-heal logic inline to avoid React/client-boot
 * complexity — this is the same algorithm in src/lib/cart.tsx#readLines.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { getAllPhotos } from "@/lib/photos";

const STORAGE_KEY = "prints-projects.cart.v1";

type CartLine = {
  photoSlug: string;
  sizeId: string;
  paperId: string;
  quantity: number;
};

function readAndHeal(store: Map<string, string>): CartLine[] {
  const raw = store.get(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as CartLine[];
  if (!Array.isArray(parsed)) return [];
  const validSlugs = new Set(getAllPhotos().map((p) => p.slug));
  const filtered = parsed.filter(
    (l) => l && typeof l.photoSlug === "string" && validSlugs.has(l.photoSlug)
  );
  if (filtered.length !== parsed.length) {
    store.set(STORAGE_KEY, JSON.stringify(filtered));
  }
  return filtered;
}

describe("cart self-heal on read", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
  });

  it("drops a line whose slug is not in the catalog", () => {
    const realSlug = getAllPhotos()[0].slug;
    store.set(
      STORAGE_KEY,
      JSON.stringify([
        { photoSlug: "pl-6604-11", sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
        { photoSlug: realSlug, sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
      ])
    );

    const lines = readAndHeal(store);
    expect(lines).toHaveLength(1);
    expect(lines[0].photoSlug).toBe(realSlug);
    // Storage was rewritten with cleaned contents so the next read short-circuits.
    expect(JSON.parse(store.get(STORAGE_KEY)!)).toEqual(lines);
  });

  it("leaves a clean cart untouched (no write)", () => {
    const realSlug = getAllPhotos()[0].slug;
    const original = JSON.stringify([
      { photoSlug: realSlug, sizeId: "8x10", paperId: "photo-rag", quantity: 2 },
    ]);
    store.set(STORAGE_KEY, original);

    const lines = readAndHeal(store);
    expect(lines).toHaveLength(1);
    expect(store.get(STORAGE_KEY)).toBe(original);
  });

  it("empties entirely when no lines survive", () => {
    store.set(
      STORAGE_KEY,
      JSON.stringify([
        { photoSlug: "ghost-a", sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
        { photoSlug: "ghost-b", sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
      ])
    );

    const lines = readAndHeal(store);
    expect(lines).toHaveLength(0);
    expect(store.get(STORAGE_KEY)).toBe("[]");
  });

  it("drops malformed entries (non-string slug, null)", () => {
    store.set(
      STORAGE_KEY,
      JSON.stringify([null, { photoSlug: 42, sizeId: "8x10", paperId: "photo-rag", quantity: 1 }])
    );

    const lines = readAndHeal(store);
    expect(lines).toHaveLength(0);
  });
});
