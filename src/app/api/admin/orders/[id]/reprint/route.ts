/**
 * POST /api/admin/orders/[id]/reprint
 *
 * Body: { reason: string }  (trimmed, 1..200 chars)
 *
 * Creates a new `orders` row cloned from the parent, with:
 *   - status='paid' (flows through normal batch dispatch Tue/Fri)
 *   - parent_order_id = parent.id
 *   - stripe_payment_intent_id = NULL (no Stripe — Loupe absorbs cost)
 *   - totals all 0 (free reprint)
 *   - same edition_number on each item (reprint, not a new edition slot)
 *
 * Audit rows are written on BOTH the parent (`reprint_created`) and child
 * (`reprint_of`) inside `createReprintOrder`.
 *
 * Also:
 *   - Sends a "replacement is on the way" ack to the customer so they
 *     don't sit in silence waiting for the next batch.
 *   - Runs a lightweight cluster check: if the same photo has been
 *     reprinted 3+ times in 30 days, OR the same normalized reason has
 *     fired 3+ times in 30 days, the ops alert is elevated to severity
 *     'critical' with an investigate-now action line.
 *
 * Fires an ops alert (severity: warning by default) so Thalia + Loupe
 * coordination channels know a reprint was triggered. Follows the
 * no-silent-failures contract: the alert is dispatched via `alertSafely`
 * on the `after()` hook, DB errors are both logged AND alerted (via
 * `alertSystemError`) before re-raising as a 500.
 */

import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import {
  countRecentReprintsByPhoto,
  countRecentReprintsByReason,
  createReprintOrder,
  getOrderById,
  getOrderPhotoIds,
  normalizeReason,
} from "@/lib/supabase/queries/orders";
import { alertSafely, alertSystemError } from "@/lib/alerting";
import type { Alert } from "@/lib/alerting";
import { sendAndAlert, sendReprintOnTheWay } from "@/lib/email/send";

const Body = z.object({
  reason: z.string().trim().min(1, "reason is required").max(200, "reason max 200 chars"),
});

const CLUSTER_WINDOW_DAYS = 30;
const CLUSTER_THRESHOLD = 3;

type ClusterFinding =
  | { kind: "photo"; photoTitle: string; photoId: string; count: number }
  | { kind: "reason"; normalizedReason: string; count: number };

function reprintAlert(
  parentRef: string,
  childRef: string,
  reason: string,
  actor: string,
  findings: ClusterFinding[]
): Alert {
  const hasCluster = findings.length > 0;
  const clusterSummary = findings
    .map((f) =>
      f.kind === "photo"
        ? `photo "${f.photoTitle || f.photoId}" reprinted ${f.count}× in the last ${CLUSTER_WINDOW_DAYS}d`
        : `reason "${f.normalizedReason}" seen ${f.count}× in the last ${CLUSTER_WINDOW_DAYS}d`
    )
    .join("; ");

  return {
    type: "system_error", // reuse existing AlertType union — keeps triage routing sane
    severity: hasCluster ? "critical" : "warning",
    title: hasCluster
      ? `Reprint cluster on order ${parentRef} — investigate`
      : `Reprint created for order ${parentRef}`,
    whatHappened: hasCluster
      ? `Reprint created for order ${parentRef}. Reason: ${reason}. New order: ${childRef}. Actor: ${actor}. Cluster: ${clusterSummary}.`
      : `Reprint created for order ${parentRef}. Reason: ${reason}. New order: ${childRef}. Actor: ${actor}.`,
    autoHandled:
      "New order row inserted with status=paid; items cloned with same edition numbers; will be swept into the next batch dispatch. Customer was emailed a 'replacement on the way' ack.",
    actionRequired: hasCluster,
    actionInstructions: hasCluster
      ? "Pattern detected — check packaging, paper, or image-prep for the affected photo(s) before the next batch ships."
      : "None unless reprints become frequent for this photo — then investigate paper / packaging / shipping.",
    timestamp: new Date().toISOString(),
    metadata: {
      parentRef,
      childRef,
      reason,
      actor,
      clusterFindings: findings,
    },
  };
}

export async function POST(request: Request, ctx: RouteContext<"/api/admin/orders/[id]/reprint">) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "invalid body" },
      { status: 400 }
    );
  }
  const reason = parsed.reason;
  const normalizedReasonStr = normalizeReason(reason);

  // Verify parent exists up-front so we can return a clean 404 instead of
  // letting createReprintOrder throw a generic 500. (It will also throw on
  // missing parent, but that surfaces as "Failed to create reprint".)
  let parent;
  try {
    parent = await getOrderById(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`reprint(${id}) getOrderById failure (actor=${session.email}):`, err);
    after(() => {
      alertSystemError(`reprint(${id}) order lookup (actor=${session.email})`, msg).catch(
        (alertErr) => console.error(`reprint(${id}): alert dispatch failed:`, alertErr)
      );
    });
    return NextResponse.json({ error: "Failed to load order. Please retry." }, { status: 500 });
  }
  if (!parent) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  let child;
  try {
    child = await createReprintOrder(id, session.email, reason);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`reprint(${id}) createReprintOrder failure (actor=${session.email}):`, err);
    after(() => {
      alertSystemError(`reprint(${id}) create reprint (actor=${session.email})`, msg).catch(
        (alertErr) => console.error(`reprint(${id}): alert dispatch failed:`, alertErr)
      );
    });
    return NextResponse.json({ error: "Failed to create reprint. Please retry." }, { status: 500 });
  }

  const parentRef = id.slice(0, 8).toUpperCase();
  const childRef = child.id.slice(0, 8).toUpperCase();

  // --- Cluster detection (post-success, non-blocking) --------------------
  // The reprint itself is authoritative; if this check throws we still want
  // the route to succeed so the admin UI doesn't show a false failure.
  const findings: ClusterFinding[] = [];
  try {
    const photoIds = await getOrderPhotoIds(id);
    if (photoIds.length > 0) {
      const byPhoto = await countRecentReprintsByPhoto(photoIds, CLUSTER_WINDOW_DAYS);
      for (const row of byPhoto) {
        if (row.reprintCount >= CLUSTER_THRESHOLD) {
          findings.push({
            kind: "photo",
            photoId: row.photoId,
            photoTitle: row.photoTitle,
            count: row.reprintCount,
          });
        }
      }
    }
    const byReason = await countRecentReprintsByReason(normalizedReasonStr, CLUSTER_WINDOW_DAYS);
    if (byReason >= CLUSTER_THRESHOLD) {
      findings.push({
        kind: "reason",
        normalizedReason: normalizedReasonStr,
        count: byReason,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`reprint(${id}) cluster-check failure (non-fatal):`, err);
    after(() => {
      alertSystemError(`reprint(${id}) cluster check (actor=${session.email})`, msg).catch(
        (alertErr) => console.error(`reprint(${id}): alert dispatch failed:`, alertErr)
      );
    });
  }

  // --- Customer "replacement on the way" email ---------------------------
  // Non-blocking: sendAndAlert already logs + alerts + Sentry-captures any
  // failure, and it's fine for the admin UI to report success even if the
  // email step errored — the DB is the source of truth. We schedule in
  // after() so the response returns promptly.
  after(() => {
    sendAndAlert("reprint_ack", id, () => sendReprintOnTheWay(parent)).catch(() => {
      // sendAndAlert already alerts + throws; swallow here so after()
      // doesn't complain about an unhandled rejection.
    });
  });

  // Fire-and-forget ops alert. `alertSafely` already handles dispatcher
  // failures (log + Sentry), so nothing else to wrap.
  after(() => {
    alertSafely(
      `reprint(${id}) created`,
      reprintAlert(parentRef, childRef, reason, session.email, findings)
    ).catch((alertErr) => console.error(`reprint(${id}): alert dispatch failed:`, alertErr));
  });

  return NextResponse.json({
    ok: true,
    newOrderId: child.id,
    newOrderRef: childRef,
    // Surface cluster findings so the admin UI can show an inline warning
    // without waiting for the alert to hit the ops channels.
    clusterFindings: findings,
  });
}
