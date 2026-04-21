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

import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/session";
import { getOrderById, updateOrderStatus } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { sendShippedNotification } from "@/lib/email/send";
import { updateOrderFields } from "@/app/admin/_data";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";
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

  let order;
  try {
    order = await getOrderById(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`transition(${id}) getOrderById failure (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`transition(${id}) order lookup (actor=${session.email})`, msg))
        .catch((alertErr) => {
          console.error(`transition(${id}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json({ error: "Failed to load order. Please retry." }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  // Persist tracking + carrier before the status change, so downstream
  // consumers (email sender) see the final-form row.
  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`transition(${id} -> ${to}) db failure (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(`transition(${id} -> ${to}) state change (actor=${session.email})`, msg)
        )
        .catch((alertErr) => {
          console.error(`transition(${id}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json(
      { error: "Failed to transition order. Please retry." },
      { status: 500 }
    );
  }

  if (to === "shipped") {
    // Re-read so the email sees the just-written tracking_number + carrier.
    // Wrapped in try/catch (runSafely pattern): an email failure must not
    // roll back a successful status change. On failure we log + write an
    // audit entry so we can resend later.
    try {
      const refreshed = await getOrderById(id);
      if (refreshed) {
        await sendShippedNotification(refreshed);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`transition(${id}): sendShippedNotification failed: ${msg}`);
      await audit({
        orderId: id,
        actor: session.email,
        action: "email_send_failed",
        meta: {
          kind: "shipped_notification",
          error: msg,
        },
      });
      after(() => {
        getDispatcher()
          .send(systemErrorAlert(`transition(${id}) shipped email (actor=${session.email})`, msg))
          .catch((alertErr) => {
            console.error(`transition(${id}): alert dispatch failed:`, alertErr);
          });
      });
    }
  }

  return NextResponse.json({ ok: true, status: to });
}
