/**
 * POST /api/admin/orders/[id]/transition
 *
 * Body: { to: OrderStatus, tracking?: string, carrier?: string }
 *
 * Server Functions / Route Handlers can bypass the middleware matcher (see
 * Next 16 proxy.md "Execution order" - a matcher change can silently remove
 * coverage from a route). We re-check the session here before any mutation.
 *
 * Side effects:
 *  - Calls Track A's `updateOrderStatus`, which writes an audit_log entry.
 *  - When transitioning to `shipped`, also persists tracking + carrier and
 *    attempts to send the shipped-notification email via Track C.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { getOrderById, updateOrderStatus } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { updateOrderFields } from "@/app/admin/_data";
import type { OrderStatus } from "@/lib/types";

const Body = z.object({
  to: z.enum(["paid", "sent_to_print", "printed", "shipped", "delivered", "refunded", "cancelled"]),
  tracking: z.string().optional(),
  carrier: z.string().optional(),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/orders/[id]/transition">
) {
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
  const { to, tracking, carrier } = parsed;

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  // Persist tracking + carrier before the status change, so downstream
  // consumers (email sender) see the final-form row.
  if (to === "shipped") {
    if (!tracking || tracking.trim().length === 0) {
      return NextResponse.json(
        { error: "tracking number is required to mark shipped" },
        { status: 400 }
      );
    }
    await updateOrderFields(id, {
      tracking_number: tracking.trim(),
      carrier: carrier?.trim() || null,
    });
  }

  await updateOrderStatus(id, to as OrderStatus, { actor: session.email });

  if (to === "shipped") {
    // Track C exports `sendShippedNotification(order)`. Import lazily so a
    // Track-C outage doesn't block the status change.
    try {
      // Resolved at runtime so type resolution here doesn't break when Track
      // C hasn't shipped yet. TODO: drop the dynamic import once Track C's
      // module is stable and the types are exported.
      const mod = (await import("@/lib/email/send").catch(() => null)) as {
        sendShippedNotification?: (o: unknown) => Promise<void>;
      } | null;
      if (mod?.sendShippedNotification) {
        const refreshed = await getOrderById(id);
        if (refreshed) await mod.sendShippedNotification(refreshed);
      }
    } catch (err) {
      // Don't fail the status change on email errors - log only.
      console.error(
        `transition(${id}): sendShippedNotification failed: ${err instanceof Error ? err.message : String(err)}`
      );
      await audit({
        orderId: id,
        actor: session.email,
        action: "email_send_failed",
        meta: { kind: "shipped_notification" },
      });
    }
  }

  return NextResponse.json({ ok: true, status: to });
}
