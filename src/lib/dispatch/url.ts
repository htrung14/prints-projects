/**
 * Dispatch URL builder.
 *
 * Track B (Stripe webhook) imports `buildDispatchUrl` from `@/lib/dispatch/url`
 * and puts the returned URL in the print-job email. Track D owns this file.
 *
 * Server-only - the URL builder signs with the HMAC secret.
 */

import "server-only";
import { signDispatchToken } from "./token";

export type BuildDispatchUrlOptions = {
  /** `"single"` → `/dispatch/[orderId]`; `"batch"` → `/dispatch/batch`. */
  kind?: "single" | "batch";
  /** Token TTL in days from now. Default 30. */
  ttlDays?: number;
};

/**
 * Assemble `${NEXT_PUBLIC_APP_URL}${path}?token=${signed}` where `path` is
 * `/dispatch/[orderId]` (single) or `/dispatch/batch` (batch). For batch
 * links, the orderId is encoded into the token payload but the URL path is
 * fixed - the batch page lists every active order, so the id just labels the
 * token's origin (typically the id of the most recent unshipped order, but
 * semantically not meaningful; the batch page ignores it).
 */
export function buildDispatchUrl(orderId: string, opts: BuildDispatchUrlOptions = {}): string {
  const kind = opts.kind ?? "single";
  const ttlDays = opts.ttlDays ?? 30;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;
  const token = signDispatchToken({ orderId, kind, exp });
  const path = kind === "batch" ? "/dispatch/batch" : `/dispatch/${orderId}`;
  // `token` uses only URL-safe base64url chars + `.`, so no encodeURIComponent
  // is needed and would actually corrupt the `.` separator on some servers.
  return `${base}${path}?token=${token}`;
}
