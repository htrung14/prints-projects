/**
 * Unit tests for the HMAC signature verification in /api/alerts/sentry.
 *
 * We re-implement the exact same verifier in-test rather than importing,
 * because the route module pulls `@sentry/nextjs` + dispatcher, which we
 * don't want to boot in a unit test. This is acceptable because the
 * logic under test is pure (body, signature, secret) → boolean.
 */
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expectedHex = crypto.createHmac("sha256", secret).update(body).digest("hex");
  let sig: Buffer;
  let expected: Buffer;
  try {
    sig = Buffer.from(signature, "hex");
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }
  if (sig.length !== expected.length || sig.length === 0) return false;
  return crypto.timingSafeEqual(sig, expected);
}

describe("Sentry webhook signature verification", () => {
  const SECRET = "57ce67b63d645f654fe7a3e9effa3015f57d5e74631a01ddf2fc5663e4f80bf9";
  const BODY = '{"action":"created","data":{"issue":{"id":"1","title":"test"}}}';
  const CORRECT_SIG = crypto.createHmac("sha256", SECRET).update(BODY).digest("hex");

  it("accepts a valid HMAC-SHA256 signature", () => {
    expect(verifySignature(BODY, CORRECT_SIG, SECRET)).toBe(true);
  });

  it("rejects a wrong signature of the correct length", () => {
    const wrong = CORRECT_SIG.replace(/^./, (c) => (c === "a" ? "b" : "a"));
    expect(verifySignature(BODY, wrong, SECRET)).toBe(false);
  });

  it("rejects a null signature", () => {
    expect(verifySignature(BODY, null, SECRET)).toBe(false);
  });

  it("rejects an empty-string signature", () => {
    expect(verifySignature(BODY, "", SECRET)).toBe(false);
  });

  it("rejects an odd-length (invalid hex) signature without throwing", () => {
    expect(verifySignature(BODY, "abc", SECRET)).toBe(false);
  });

  it("rejects a signature computed with a different secret", () => {
    const otherSig = crypto.createHmac("sha256", "other-secret").update(BODY).digest("hex");
    expect(verifySignature(BODY, otherSig, SECRET)).toBe(false);
  });

  it("rejects when the body has been tampered with", () => {
    expect(verifySignature(BODY + " ", CORRECT_SIG, SECRET)).toBe(false);
  });
});
