/**
 * Dispatch magic-link HMAC tokens.
 *
 * Rob at Brooklyn Archival gets a signed URL per order (or one batch digest
 * URL per week) in the print-job email. The token proves the link came from
 * us, carries the order id (or "batch" scope), and expires after the TTL.
 *
 * Format: `${base64url(payload-json)}.${base64url(hmac)}`
 * HMAC: SHA-256 over the encoded payload bytes, keyed with
 *       `DISPATCH_SIGNING_SECRET` (env).
 *
 * Server-only. Never import from a client component - the secret must never
 * ship to the browser.
 */

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { DispatchTokenPayload } from "@/lib/types";

// ---------------------------------------------------------------------------
// Secret bootstrap
// ---------------------------------------------------------------------------

let warnedShortSecret = false;

function getSecret(): Buffer {
  const secret = process.env.DISPATCH_SIGNING_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error(
      "DISPATCH_SIGNING_SECRET is not set. Set it in env before signing/verifying dispatch tokens."
    );
  }
  // A warning threshold: HMAC-SHA256 wants at least 32 bytes of entropy to
  // resist brute force. We don't throw below 32 because tests/dev can use
  // shorter secrets, but we log once at boot so prod misconfiguration is loud.
  if (secret.length < 32 && !warnedShortSecret) {
    warnedShortSecret = true;
    console.warn(
      "[dispatch/token] DISPATCH_SIGNING_SECRET is shorter than 32 chars. Use `openssl rand -base64 48`."
    );
  }
  return Buffer.from(secret, "utf8");
}

// ---------------------------------------------------------------------------
// base64url helpers (Node's built-in "base64url" encoding handles padding).
// ---------------------------------------------------------------------------

function encodeBase64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input);
  return buf.toString("base64url");
}

function decodeBase64Url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

// ---------------------------------------------------------------------------
// Sign / verify
// ---------------------------------------------------------------------------

/**
 * Produce `"<payload>.<sig>"` where both parts are base64url. The HMAC is
 * computed over the already-encoded payload string so verification doesn't
 * need to re-serialize JSON (avoids canonicalization drift on nested keys).
 */
export function signDispatchToken(payload: DispatchTokenPayload): string {
  const json = JSON.stringify(payload);
  const encodedPayload = encodeBase64Url(json);
  const sig = createHmac("sha256", getSecret()).update(encodedPayload, "utf8").digest();
  const encodedSig = encodeBase64Url(sig);
  return `${encodedPayload}.${encodedSig}`;
}

/**
 * Verify signature + expiry + shape. Returns null on any failure - never
 * throws, never leaks which check failed (to avoid helping an attacker
 * distinguish malformed vs. tampered).
 */
export function verifyDispatchToken(token: string): DispatchTokenPayload | null {
  if (typeof token !== "string" || token.length === 0) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSig] = parts;
  if (!encodedPayload || !encodedSig) return null;

  // Recompute over the raw encoded payload bytes to avoid JSON-canonicalization
  // drift on nested-key ordering.
  const expected = createHmac("sha256", getSecret()).update(encodedPayload, "utf8").digest();

  let provided: Buffer;
  try {
    provided = decodeBase64Url(encodedSig);
  } catch {
    return null;
  }
  if (provided.length !== expected.length) return null;
  // Constant-time compare - plain `===` would be a timing-oracle bug.
  if (!timingSafeEqual(provided, expected)) return null;

  // Signature is authentic; now parse the payload and check expiry + shape.
  let payloadJson: string;
  try {
    payloadJson = decodeBase64Url(encodedPayload).toString("utf8");
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadJson);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const rec = parsed as Record<string, unknown>;
  const orderId = rec.orderId;
  const kind = rec.kind;
  const exp = rec.exp;
  if (typeof orderId !== "string" || orderId.length === 0) return null;
  if (kind !== "single" && kind !== "batch") return null;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (exp <= now) return null;

  return { orderId, kind, exp };
}
