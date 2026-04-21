/**
 * POST /api/dispatch/[orderId]/status - Rob submits tracking for one order.
 *
 * Body: `{ token, trackingNumber, carrier, notes? }`
 * Auth: `token` must verify and its `orderId` must match the URL segment.
 *
 * Side effects, in order:
 *   1. Update `orders` with trackingNumber/carrier/notes
 *   2. Move status → `shipped`
 *   3. Send customer shipped notification (Track C)
 *   4. Write an audit entry (Track A)
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verifyDispatchToken } from "@/lib/dispatch/token";
import { updateOrderTracking } from "@/lib/dispatch/queries";
import { getOrderById, updateOrderStatus } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { sendShippedNotification } from "@/lib/email/send";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"] as const;

const BodySchema = z.object({
  token: z.string().min(1),
  trackingNumber: z.string().min(1).max(200),
  carrier: z.enum(CARRIERS),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;

  let parsed: z.infer<typeof BodySchema>;
  try {
    const raw: unknown = await req.json();
    parsed = BodySchema.parse(raw);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof z.ZodError
            ? err.issues.map((i) => i.message).join("; ")
            : "Invalid JSON body.",
      },
      { status: 400 }
    );
  }

  const payload = verifyDispatchToken(parsed.token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }
  // For single-order status submits the token must be the single-order kind
  // and bound to exactly this order. Batch tokens go through /api/dispatch/batch.
  if (payload.kind !== "single" || payload.orderId !== orderId) {
    return NextResponse.json({ error: "Token does not authorize this order." }, { status: 403 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.fulfillmentTokenRevokedAt) {
    return NextResponse.json({ error: "This link has been revoked." }, { status: 410 });
  }

  try {
    await updateOrderTracking(orderId, {
      trackingNumber: parsed.trackingNumber,
      carrier: parsed.carrier,
      notes: parsed.notes ?? null,
    });
    await updateOrderStatus(orderId, "shipped", {
      trackingNumber: parsed.trackingNumber,
      carrier: parsed.carrier,
      actor: "dispatch_submit",
    });
  } catch (err) {
    console.error(`dispatch/status POST ${orderId} db failure:`, err);
    return NextResponse.json({ error: "Failed to record tracking. Try again." }, { status: 500 });
  }

  // Email + audit - best effort; never block the happy path on email failures.
  try {
    const refreshed = await getOrderById(orderId);
    if (refreshed) {
      await sendShippedNotification(refreshed);
    }
  } catch (err) {
    console.error(`dispatch/status POST ${orderId} email failure (non-blocking):`, err);
  }
  try {
    await audit({
      orderId,
      actor: "dispatch_submit",
      action: "shipped",
      meta: {
        carrier: parsed.carrier,
        trackingNumber: parsed.trackingNumber,
        hasNotes: Boolean(parsed.notes),
      },
    });
  } catch (err) {
    console.error(`dispatch/status POST ${orderId} audit failure (non-blocking):`, err);
  }

  return NextResponse.json({ ok: true });
}
