/**
 * Typed query helper for the `audit_log` table.
 *
 * Server-only. Append-only: there is no `update` or `delete` helper on
 * purpose. If you need to redact, do it directly in Supabase with a
 * documented one-off migration.
 */

import "server-only";
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
  }
}
