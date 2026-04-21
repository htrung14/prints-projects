/**
 * Pure signature-verification helpers for the Sentry webhook endpoint.
 *
 * Extracted from the route file so unit tests can import and exercise the
 * *actual* production code instead of re-implementing it — this matters
 * because the class of bugs these functions guard against (wrong buffer
 * encoding, timing leaks) would pass a re-implemented test while failing
 * in production.
 */

import crypto from "node:crypto";

/**
 * Verify an HMAC-SHA256 signature over `body` using `secret`. `signature`
 * must be the hex-encoded digest Sentry sends in the `sentry-hook-signature`
 * header. Invalid hex / wrong length / wrong bytes all return `false`.
 */
export function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expectedHex = crypto.createHmac("sha256", secret).update(body).digest("hex");
  // Decode hex → bytes on both sides so timingSafeEqual compares real HMAC
  // bytes, not UTF-8 codepoints of hex chars. Node's `Buffer.from(s, "hex")`
  // silently drops invalid chars rather than throwing, so we rely on the
  // length check below to reject malformed input (including odd-length
  // strings, which produce a truncated buffer).
  const sig = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedHex, "hex");
  if (sig.length !== expected.length || sig.length === 0) return false;
  return crypto.timingSafeEqual(sig, expected);
}

/**
 * Constant-time string equality for secrets. Short-circuit on length
 * mismatch is safe here because the server's secret length is not itself
 * secret — the attacker already knows this is a 64-char hex token.
 */
export function timingSafeStringEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
