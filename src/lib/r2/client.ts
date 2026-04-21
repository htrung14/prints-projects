/**
 * Cloudflare R2 client (S3-compatible).
 *
 * R2 uses `auto` as the AWS region and a custom endpoint derived from the
 * account id: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`.
 *
 * We expose a lazy singleton - constructing an S3Client eagerly at module
 * load would throw during `next build` on machines without the R2 env set,
 * and also holds open a keep-alive agent we don't need in static phases.
 *
 * Server-only.
 */

import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

let cached: S3Client | null = null;

/** Returns the shared S3Client singleton, constructing it on first call. */
export function r2Client(): S3Client {
  if (cached) return cached;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 env is not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY."
    );
  }

  cached = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // R2 responds to virtual-hosted style for custom-domain buckets, but the
    // API-token endpoint above requires path-style addressing.
    forcePathStyle: true,
  });
  return cached;
}

/** Resolve the bucket name from env. Isolated so callers don't duplicate it. */
export function r2Bucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not set.");
  }
  return bucket;
}
