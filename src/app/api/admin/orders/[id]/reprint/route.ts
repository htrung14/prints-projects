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
 * Fires an ops alert (severity: warning) so Thalia + Loupe coordination
 * channels know a reprint was triggered. Follows the no-silent-failures
 * contract: the alert is dispatched via `alertSafely` on the `after()`
 * hook, DB errors are both logged AND alerted (via `alertSystemError`)
 * before re-raising as a 500.
 */

import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { createReprintOrder, getOrderById } from "@/lib/supabase/queries/orders";
import { alertSafely, alertSystemError } from "@/lib/alerting";
import type { Alert } from "@/lib/alerting";

const Body = z.object({
  reason: z.string().trim().min(1, "reason is required").max(200, "reason max 200 chars"),
});

function reprintAlert(parentRef: string, childRef: string, reason: string, actor: string): Alert {
  return {
    type: "system_error", // reuse existing AlertType union — keeps triage routing sane
    severity: "warning",
    title: `Reprint created for order ${parentRef}`,
    whatHappened: `Reprint created for order ${parentRef}. Reason: ${reason}. New order: ${childRef}. Actor: ${actor}.`,
    autoHandled:
      "New order row inserted with status=paid; items cloned with same edition numbers; will be swept into the next batch dispatch.",
    actionRequired: false,
    actionInstructions:
      "None unless reprints become frequent for this photo — then investigate paper / packaging / shipping.",
    timestamp: new Date().toISOString(),
    metadata: { parentRef, childRef, reason, actor },
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

  // Fire-and-forget ops alert. `alertSafely` already handles dispatcher
  // failures (log + Sentry), so nothing else to wrap.
  after(() => {
    alertSafely(
      `reprint(${id}) created`,
      reprintAlert(parentRef, childRef, reason, session.email)
    ).catch((alertErr) => console.error(`reprint(${id}): alert dispatch failed:`, alertErr));
  });

  return NextResponse.json({ ok: true, newOrderId: child.id, newOrderRef: childRef });
}
