/**
 * Unit tests for the shared HMAC signature helpers used by
 * /api/alerts/sentry. Imports the real production code so a regression
 * like "someone re-drops the `hex` encoding" will fail here.
 */
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifySignature, timingSafeStringEq } from "@/lib/alerting/sentry-sig";

const SECRET = "57ce67b63d645f654fe7a3e9effa3015f57d5e74631a01ddf2fc5663e4f80bf9";
const BODY = '{"action":"created","data":{"issue":{"id":"1","title":"test"}}}';
const CORRECT_SIG = crypto.createHmac("sha256", SECRET).update(BODY).digest("hex");

describe("verifySignature", () => {
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

  it("rejects an odd-length hex signature without throwing", () => {
    expect(verifySignature(BODY, "abc", SECRET)).toBe(false);
  });

  it("rejects a signature made of non-hex characters (decodes to 0 bytes)", () => {
    expect(verifySignature(BODY, "zzzzzzzz", SECRET)).toBe(false);
  });

  it("rejects a signature computed with a different secret", () => {
    const otherSig = crypto.createHmac("sha256", "other-secret").update(BODY).digest("hex");
    expect(verifySignature(BODY, otherSig, SECRET)).toBe(false);
  });

  it("rejects when the body has been tampered with", () => {
    expect(verifySignature(BODY + " ", CORRECT_SIG, SECRET)).toBe(false);
  });
});

describe("timingSafeStringEq", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeStringEq("abc", "abc")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(timingSafeStringEq("abc", "abd")).toBe(false);
  });

  it("returns false for different lengths without throwing", () => {
    expect(timingSafeStringEq("abc", "abcd")).toBe(false);
  });

  it("returns false for empty vs non-empty", () => {
    expect(timingSafeStringEq("", "a")).toBe(false);
  });

  it("handles multi-byte characters by comparing UTF-8 byte length", () => {
    // 'é' encodes to 2 bytes in UTF-8, so "éa" has 3 bytes and "ab" has 2.
    expect(timingSafeStringEq("éa", "ab")).toBe(false);
  });
});
