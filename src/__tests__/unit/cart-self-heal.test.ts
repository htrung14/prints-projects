/**
 * Unit tests for the shared cart self-heal helper. Imports the real
 * production code so a regression in `healLines` shows up here.
 */
import { describe, it, expect } from "vitest";
import { healLines } from "@/lib/cart-heal";

const VALID = new Set(["bekaa-feb-2025", "north-lebanon-oct-2020"]);

describe("healLines", () => {
  it("drops a line whose slug is not in the catalog", () => {
    const out = healLines(
      [
        { photoSlug: "pl-6604-11", sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
        { photoSlug: "bekaa-feb-2025", sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
      ],
      VALID
    );
    expect(out).toHaveLength(1);
    expect(out[0].photoSlug).toBe("bekaa-feb-2025");
  });

  it("leaves a fully-valid cart untouched", () => {
    const input = [
      { photoSlug: "bekaa-feb-2025", sizeId: "8x10", paperId: "photo-rag", quantity: 2 },
      { photoSlug: "north-lebanon-oct-2020", sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
    ];
    const out = healLines(input, VALID);
    expect(out).toHaveLength(2);
    expect(out).toEqual(input);
  });

  it("empties when no lines survive", () => {
    const out = healLines(
      [
        { photoSlug: "ghost-a", sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
        { photoSlug: "ghost-b", sizeId: "8x10", paperId: "photo-rag", quantity: 1 },
      ],
      VALID
    );
    expect(out).toEqual([]);
  });

  it("drops malformed entries (non-string slug, null, undefined, numbers)", () => {
    const out = healLines(
      [null, undefined, 42, { photoSlug: 42, quantity: 1 }, { noSlug: "yes" }],
      VALID
    );
    expect(out).toHaveLength(0);
  });

  it("returns an empty array when the payload is not an array", () => {
    expect(healLines(null, VALID)).toEqual([]);
    expect(healLines("oops", VALID)).toEqual([]);
    expect(healLines({ photoSlug: "bekaa-feb-2025" }, VALID)).toEqual([]);
  });
});
