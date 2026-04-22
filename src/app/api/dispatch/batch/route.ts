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

import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verifyDispatchToken } from "@/lib/dispatch/token";
import { updateOrderTracking } from "@/lib/dispatch/queries";
import { getOrderById } from "@/lib/supabase/queries/orders";
import { serverClient } from "@/lib/supabase/server";
import { audit } from "@/lib/supabase/queries/audit";
import { sendShippedNotification } from "@/lib/email/send";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

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
      // Idempotency pass 1 (read side): short-circuit early if we can
      // see the order is already shipped/delivered. Cheap.
      if (order.status === "shipped" || order.status === "delivered") {
        succeeded.push(upd.orderId);
        continue;
      }

      await updateOrderTracking(upd.orderId, {
        trackingNumber: upd.trackingNumber,
        carrier: upd.carrier,
        notes: upd.notes ?? null,
      });

      // Idempotency pass 2 (write side): conditional UPDATE that only
      // transitions to 'shipped' when the row is still in an earlier
      // state. If two concurrent submissions race, the second one's
      // affected-row count will be 0 and we short-circuit as a no-op
      // success — preventing a double shipped-notification email.
      const db = serverClient();
      const { data: flipped, error: flipErr } = await db
        .from("orders")
        .update({ status: "shipped" })
        .eq("id", upd.orderId)
        .in("status", ["paid", "queued_for_print", "sent_to_print", "printed"])
        .select("id");
      if (flipErr) {
        throw new Error(`conditional status flip failed: ${flipErr.message}`);
      }
      if (!flipped || flipped.length === 0) {
        // Another submission beat us to it. Tracking is written, status
        // is already shipped — treat as idempotent success.
        succeeded.push(upd.orderId);
        continue;
      }
      // Mirror the status_change audit row that updateOrderStatus would
      // have written (kept in sync with its semantics).
      try {
        await audit({
          orderId: upd.orderId,
          actor: "system",
          action: "status_change",
          meta: {
            trackingNumber: upd.trackingNumber,
            carrier: upd.carrier,
            actor: "dispatch_batch",
            status: "shipped",
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`dispatch/batch: status_change audit failure for ${upd.orderId}:`, err);
        after(() => {
          getDispatcher()
            .send(
              systemErrorAlert(
                `POST /api/dispatch/batch status_change audit ${upd.orderId} (non-blocking)`,
                msg
              )
            )
            .catch((alertErr) => {
              console.error(
                `dispatch/batch(${upd.orderId}): audit-alert dispatch failed:`,
                alertErr
              );
            });
        });
      }

      // Best-effort email + audit; don't flip a succeeded item to failed if
      // email or audit hiccups. Customer will still see the shipped status
      // on their thank-you page; ops can replay from the admin UI.
      try {
        const refreshed = await getOrderById(upd.orderId);
        if (refreshed) {
          await sendShippedNotification(refreshed);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`dispatch/batch: email failure for ${upd.orderId} (non-blocking):`, err);
        after(() => {
          getDispatcher()
            .send(
              systemErrorAlert(
                `POST /api/dispatch/batch shipped-email ${upd.orderId} (non-blocking)`,
                msg
              )
            )
            .catch((alertErr) => {
              console.error(
                `dispatch/batch(${upd.orderId}): email-alert dispatch failed:`,
                alertErr
              );
            });
        });
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
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`dispatch/batch: audit failure for ${upd.orderId} (non-blocking):`, err);
        after(() => {
          getDispatcher()
            .send(
              systemErrorAlert(
                `POST /api/dispatch/batch audit-write ${upd.orderId} (non-blocking)`,
                msg
              )
            )
            .catch((alertErr) => {
              console.error(
                `dispatch/batch(${upd.orderId}): audit-alert dispatch failed:`,
                alertErr
              );
            });
        });
      }

      succeeded.push(upd.orderId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed.";
      console.error(`dispatch/batch: ${upd.orderId} failed:`, err);
      after(() => {
        getDispatcher()
          .send(
            systemErrorAlert(`POST /api/dispatch/batch tracking/status write ${upd.orderId}`, msg)
          )
          .catch((alertErr) => {
            console.error(`dispatch/batch(${upd.orderId}): alert dispatch failed:`, alertErr);
          });
      });
      failed.push({
        orderId: upd.orderId,
        error: msg,
      });
    }
  }

  return NextResponse.json({ succeeded, failed });
}
