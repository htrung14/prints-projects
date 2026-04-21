import "server-only";
import * as Sentry from "@sentry/nextjs";
import { render } from "@react-email/render";
import * as React from "react";
import { serverClient } from "@/lib/supabase/server";
import { batchReadyAlert } from "@/lib/alerting";
import { alertSystemError, getDispatcher } from "@/lib/alerting/dispatcher";
import { getResend, fromAddress } from "@/lib/email/client";
import { buildDispatchUrl } from "@/lib/dispatch/url";
import { getPrinterEmail } from "@/lib/supabase/queries/settings";
import PrintBatch from "@/lib/email/templates/PrintBatch";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

/**
 * Run a batch-dispatch side-effect that must not break the caller. Logs,
 * captures to Sentry, AND fires a systemErrorAlert so ops see the failure.
 * We never rethrow — the admin already got a "batched N orders" response
 * and Stripe retries are not in play here.
 */
async function runSafely(fn: () => Promise<unknown>, label: string): Promise<void> {
  try {
    await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[batch-dispatch] ${label}: ${msg}`);
    Sentry.captureException(err, { tags: { pipeline: `batch-dispatch:${label}` } });
    await alertSystemError(`batch-dispatch ${label}`, msg);
  }
}

// ---------------------------------------------------------------------------
// Supabase → domain object shaping. We keep this module-local so batch.ts
// doesn't depend on query helpers that live elsewhere.
// ---------------------------------------------------------------------------

type OrderRow = {
  id: string;
  created_at: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address: Order["shippingAddress"] | null;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  fulfillment_token: string;
  fulfillment_token_revoked_at: string | null;
  print_job_email_sent_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  notes: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  photo_id: string;
  photo_slug: string;
  photo_title: string;
  size_id: string;
  size_label: string;
  paper_id: string;
  paper_name: string;
  quantity: number;
  unit_price_cents: number;
  edition_number: number;
  edition_total: number;
  print_file_url_snapshot: string | null;
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? "",
    customerEmail: row.customer_email ?? "",
    customerName: row.customer_name ?? "",
    shippingAddress: row.shipping_address ?? {
      name: "",
      line1: "",
      line2: null,
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    subtotalCents: row.subtotal_cents,
    taxCents: row.tax_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    status: row.status,
    fulfillmentToken: row.fulfillment_token,
    fulfillmentTokenRevokedAt: row.fulfillment_token_revoked_at,
    printJobEmailSentAt: row.print_job_email_sent_at,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    notes: row.notes,
  };
}

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    photoId: row.photo_id,
    photoSlug: row.photo_slug,
    photoTitle: row.photo_title,
    sizeId: row.size_id,
    sizeLabel: row.size_label,
    paperId: row.paper_id,
    paperName: row.paper_name,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    editionNumber: row.edition_number,
    editionTotal: row.edition_total,
    printFileUrlSnapshot: row.print_file_url_snapshot,
  };
}

// ---------------------------------------------------------------------------

type PrinterEmailResult = {
  /** True iff a printer email was configured (DB setting OR env fallback). */
  resolved: boolean;
  /** True iff Resend accepted the send. */
  sent: boolean;
  /** Human-readable reason when !resolved or !sent. */
  error?: string;
};

async function sendPrinterBatchEmail(
  orders: Array<{ order: Order; items: OrderItem[]; dispatchUrl: string }>
): Promise<PrinterEmailResult> {
  const printerEmail = await getPrinterEmail();
  if (!printerEmail) {
    // Misconfiguration — we have a batch to dispatch but nowhere to send it.
    // Throw so `runSafely` captures + alerts. This is not transient, and we
    // still want Sentry + alert visibility even though we now also surface
    // the reason to the UI via PrinterEmailResult.
    throw new Error(
      "No printer email configured (admin settings + PRINT_SHOP_EMAIL env fallback both empty). " +
        `Batch of ${orders.length} order(s) marked queued_for_print in DB but printer email NOT sent. ` +
        "Configure the printer email at /admin/settings, then re-run batch dispatch or hand off to printer manually."
    );
  }

  const count = orders.length;
  const html = await render(React.createElement(PrintBatch, { orders }));
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: printerEmail,
    subject: `Print batch ready — ${count} order${count === 1 ? "" : "s"}`,
    html,
  });
  if (error) {
    // Resend returns API rejections via `{ error }`, not via throw.
    const m =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : JSON.stringify(error);
    throw new Error(`Resend send failed: ${m}`);
  }

  return { resolved: true, sent: true };
}

export async function batchOrdersForPrint(actorEmail: string): Promise<{
  batched: number;
  orderIds: string[];
  /** True iff a printer email was configured (DB or env fallback). */
  printerEmailResolved: boolean;
  /** True iff the printer email step accepted the send from Resend. */
  printerEmailSent: boolean;
  /** Reason surfaced when the email could not be resolved or sent. */
  printerEmailError?: string;
}> {
  const db = serverClient();

  const newStatus: OrderStatus = "queued_for_print";

  // Atomic: only update rows still in "paid" status (guards against concurrent dispatch)
  const { data: updated, error } = await db
    .from("orders")
    .update({ status: newStatus })
    .eq("status", "paid")
    .select("*");

  if (error) {
    throw new Error(`Failed to batch orders: ${error.message}`);
  }

  const rows = (updated ?? []) as OrderRow[];
  const orderIds = rows.map((r) => r.id);
  if (orderIds.length === 0) {
    // Nothing was batched, so nothing to email. Report resolved+sent as true
    // so the UI doesn't render a misleading "email not sent" warning for an
    // empty batch.
    return {
      batched: 0,
      orderIds: [],
      printerEmailResolved: true,
      printerEmailSent: true,
    };
  }

  // Pull items for every batched order in one round-trip.
  const { data: itemRowsData } = await db.from("order_items").select("*").in("order_id", orderIds);
  const itemRows = (itemRowsData ?? []) as OrderItemRow[];
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const r of itemRows) {
    const list = itemsByOrder.get(r.order_id) ?? [];
    list.push(rowToOrderItem(r));
    itemsByOrder.set(r.order_id, list);
  }

  const ordersForEmail = rows.map((row) => {
    const order = rowToOrder(row);
    return {
      order,
      items: itemsByOrder.get(order.id) ?? [],
      dispatchUrl: buildDispatchUrl(order.id, { kind: "single" }),
    };
  });

  await runSafely(async () => {
    const { error: auditErr } = await db.from("audit_log").insert(
      orderIds.map((id) => ({
        order_id: id,
        actor: actorEmail,
        action: "status_change",
        meta: { status: newStatus, trigger: "batch_dispatch" },
      }))
    );
    if (auditErr) {
      throw new Error(`audit_log insert failed: ${auditErr.message}`);
    }
  }, "audit log insert");

  const dispatcher = getDispatcher();
  await runSafely(
    () => dispatcher.send(batchReadyAlert(orderIds.length, orderIds)),
    "batch ready alert"
  );

  // Printer email: we want both (a) the existing Sentry/alert trail on
  // failure AND (b) a truthful outcome surfaced to the UI. Inline the
  // try/catch instead of using runSafely so we can capture the result.
  let printerEmailResolved = false;
  let printerEmailSent = false;
  let printerEmailError: string | undefined;
  try {
    const result = await sendPrinterBatchEmail(ordersForEmail);
    printerEmailResolved = result.resolved;
    printerEmailSent = result.sent;
    printerEmailError = result.error;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[batch-dispatch] printer batch email: ${msg}`);
    Sentry.captureException(err, {
      tags: { pipeline: "batch-dispatch:printer batch email" },
    });
    await alertSystemError("batch-dispatch printer batch email", msg);
    // A thrown error means either no printer email was configured (resolved
    // stays false) or Resend rejected (resolved=true, sent=false). We can
    // tell them apart by the message prefix, but the UI only needs the two
    // booleans + a reason — which the thrown message already carries.
    printerEmailResolved = !msg.startsWith("No printer email configured");
    printerEmailSent = false;
    printerEmailError = msg;
  }

  return {
    batched: orderIds.length,
    orderIds,
    printerEmailResolved,
    printerEmailSent,
    printerEmailError,
  };
}
