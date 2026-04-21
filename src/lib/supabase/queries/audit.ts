/**
 * Typed query helper for the `audit_log` table.
 *
 * Server-only. Append-only: there is no `update` or `delete` helper on
 * purpose. If you need to redact, do it directly in Supabase with a
 * documented one-off migration.
 */

import "server-only";
import * as Sentry from "@sentry/nextjs";
import type { AuditLogEntry } from "@/lib/types";
import { serverClient } from "@/lib/supabase/server";

export async function audit(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<void> {
  const db = serverClient();
  const { error } = await db.from("audit_log").insert({
    order_id: entry.orderId,
    actor: entry.actor,
    action: entry.action,
    meta: entry.meta,
  });
  if (error) {
    // Audit failures should never break the caller's hot path (webhook,
    // admin). Surface to stderr; ops should alert on these via log pipelines.
    console.error(
      `audit() insert failed for action=${entry.action} order=${entry.orderId ?? "<none>"}: ${error.message}`
    );
    // Non-throwing: also forward to Sentry so silent insert failures are
    // visible in observability. Don't introduce a dispatcher dep here —
    // that would create a circular-dep risk (alerting uses audit).
    Sentry.captureException(error, {
      tags: { pipeline: "audit-log", action: entry.action },
      extra: entry.orderId ? { orderId: entry.orderId } : undefined,
    });
  }
}
