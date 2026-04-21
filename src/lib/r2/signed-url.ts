/**
 * Presigned GET URL for R2 objects (master print TIFFs).
 *
 * Printer's fulfillment page never receives the object key or a direct URL in
 * email - he clicks "Download print file" on the dispatch page, which hits
 * an API route that calls this helper and 302-redirects to the resulting URL.
 *
 * Default TTL: 7 days (per design doc §1a - covers the printer's printing window).
 *
 * Server-only.
 */

import "server-only";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Bucket, r2Client } from "./client";

export const DEFAULT_PRINT_FILE_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function getPrintFileSignedUrl(
  key: string,
  ttlSeconds: number = DEFAULT_PRINT_FILE_TTL_SECONDS
): Promise<string> {
  if (!key) {
    throw new Error("getPrintFileSignedUrl: key is empty");
  }
  const cmd = new GetObjectCommand({ Bucket: r2Bucket(), Key: key });
  return getSignedUrl(r2Client(), cmd, { expiresIn: ttlSeconds });
}
