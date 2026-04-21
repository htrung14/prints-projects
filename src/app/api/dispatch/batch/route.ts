/**
 * POST /api/dispatch/batch - batch tracking submission from the weekly digest.
 *
 * Body: `{ token, updates: [{ orderId, trackingNumber, carrier }] }`
 * Auth: token must verify and carry `kind === "batch"`.
 *
 * For each update we run the same pipeline as the single-order route:
 * write tracking, transition to `shipped`, fire the customer email, write
 * an audit entry. The response aggregates per-order success/failure so
 * the UI can annotate individual rows.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verifyDispatchToken } from "@/lib/dispatch/token";
import { updateOrderTracking } from "@/lib/dispatch/queries";
import { getOrderById, updateOrderStatus } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { sendShippedNotification } from "@/lib/email/send";

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"] as const;

const UpdateSchema = z.object({
  orderId: z.string().min(1),
  trackingNumber: z.string().min(1).max(200),
  carrier: z.enum(CARRIERS),
  notes: z.string().max(2000).optional(),
});

const BodySchema = z.object({
  token: z.string().min(1),
  updates: z.array(UpdateSchema).min(1).max(100),
});

type Failure = { orderId: string; error: string };

export async function POST(req: NextRequest) {
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
  if (payload.kind !== "batch") {
    return NextResponse.json({ error: "Batch token required." }, { status: 403 });
  }

  const succeeded: string[] = [];
  const failed: Failure[] = [];

  for (const upd of parsed.updates) {
    try {
      const order = await getOrderById(upd.orderId);
      if (!order) {
        failed.push({ orderId: upd.orderId, error: "Not found." });
        continue;
      }
      if (order.fulfillmentTokenRevokedAt) {
        failed.push({ orderId: upd.orderId, error: "Link revoked." });
        continue;
      }

      await updateOrderTracking(upd.orderId, {
        trackingNumber: upd.trackingNumber,
        carrier: upd.carrier,
        notes: upd.notes ?? null,
      });
      await updateOrderStatus(upd.orderId, "shipped", {
        trackingNumber: upd.trackingNumber,
        carrier: upd.carrier,
        actor: "dispatch_batch",
      });

      // Best-effort email + audit; don't flip a succeeded item to failed if
      // email or audit hiccups. Customer will still see the shipped status
      // on their thank-you page; ops can replay from the admin UI.
      try {
        const refreshed = await getOrderById(upd.orderId);
        if (refreshed) {
          await sendShippedNotification(refreshed);
        }
      } catch (err) {
        console.error(`dispatch/batch: email failure for ${upd.orderId} (non-blocking):`, err);
      }
      try {
        await audit({
          orderId: upd.orderId,
          actor: "dispatch_batch",
          action: "shipped",
          meta: {
            carrier: upd.carrier,
            trackingNumber: upd.trackingNumber,
          },
        });
      } catch (err) {
        console.error(`dispatch/batch: audit failure for ${upd.orderId} (non-blocking):`, err);
      }

      succeeded.push(upd.orderId);
    } catch (err) {
      console.error(`dispatch/batch: ${upd.orderId} failed:`, err);
      failed.push({
        orderId: upd.orderId,
        error: err instanceof Error ? err.message : "Failed.",
      });
    }
  }

  return NextResponse.json({ succeeded, failed });
}
