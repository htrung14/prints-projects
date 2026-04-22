/**
 * Public email-sending API - stable interface consumed by Tracks B, D, E.
 *
 * Signatures frozen per docs-ai/backend-plan.md §"Track C exports".
 * `sendPrintJobEmail` additionally takes `dispatchUrl` - Track B generates
 * the URL via `buildDispatchUrl` (Track D) and passes it in here so this
 * module stays decoupled from the dispatch token implementation.
 *
 * All functions bubble errors up. The Stripe webhook caller decides its own
 * retry policy; per docs/system-design.md §7 "Webhook reliability rules" it
 * should log-and-continue so an SMTP hiccup doesn't fail the webhook.
 */

import "server-only";
import * as Sentry from "@sentry/nextjs";
import { render } from "@react-email/render";
import * as React from "react";
import type { Order, OrderItem } from "@/lib/types";
import { fromAddress, getResend } from "./client";
import { getPrinterEmail } from "@/lib/supabase/queries/settings";
import OrderConfirmation from "./templates/OrderConfirmation";
import PrintJob from "./templates/PrintJob";
import Refunded from "./templates/Refunded";
import ReprintOnTheWay from "./templates/ReprintOnTheWay";
import Shipped from "./templates/Shipped";
import PostPurchase, {
  type PostPurchaseTouchNumber,
  subjectForTouch,
} from "./templates/PostPurchase";
import { formatOrderReference } from "./templates/_shared";
import { schedulePostPurchaseInserts } from "./scheduled";
import { alertSystemError } from "@/lib/alerting/dispatcher";

/**
 * Thin wrapper around Resend's emails.send that renders a React Email
 * template to HTML first. We pre-render on the Node server rather than pass
 * the React node to Resend's `react` option - the `react` path re-bundles
 * the renderer on the worker runtime, which we don't want.
 */
async function sendRenderedEmail(args: {
  to: string;
  subject: string;
  replyTo?: string;
  node: React.ReactElement;
  tags?: { name: string; value: string }[];
}): Promise<void> {
  const html = await render(args.node);
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: args.to,
    subject: args.subject,
    html,
    ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    ...(args.tags ? { tags: args.tags } : {}),
  });
  if (error) {
    // Normalize to a thrown Error so callers can try/catch uniformly.
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : JSON.stringify(error);
    throw new Error(`Resend send failed: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Order confirmation (to customer)
// ---------------------------------------------------------------------------

export async function sendOrderConfirmation(order: Order, items: OrderItem[]): Promise<void> {
  const ref = formatOrderReference(order);
  await sendRenderedEmail({
    to: order.customerEmail,
    subject: `Order ${ref} received`,
    node: React.createElement(OrderConfirmation, { order, items }),
    tags: [
      { name: "email_kind", value: "order_confirmation" },
      { name: "order_ref", value: ref },
    ],
  });
}

// ---------------------------------------------------------------------------
// Print-job email (to the printer at Loupe)
// ---------------------------------------------------------------------------

export async function sendPrintJobEmail(
  order: Order,
  items: OrderItem[],
  dispatchUrl: string,
  /**
   * Optional override. When omitted, we fetch from settings (DB → env fallback).
   * Callers in hot paths (webhook) pre-resolve it to avoid an extra DB call.
   */
  recipient?: string
): Promise<void> {
  const ref = formatOrderReference(order);
  const to = recipient ?? (await getPrinterEmail());
  if (!to) {
    throw new Error("sendPrintJobEmail: no printer email configured (check /admin/settings).");
  }
  await sendRenderedEmail({
    to,
    // Reply threads back to Thalia's inbox, not a noreply.
    replyTo: fromAddress(),
    subject: `[Order ${ref}] New print job, ready to fulfill`,
    node: React.createElement(PrintJob, { order, items, dispatchUrl }),
    tags: [
      { name: "email_kind", value: "print_job" },
      { name: "order_ref", value: ref },
    ],
  });
}

// ---------------------------------------------------------------------------
// Shipped notification (to customer)
// ---------------------------------------------------------------------------

export async function sendShippedNotification(order: Order): Promise<void> {
  const ref = formatOrderReference(order);
  await sendRenderedEmail({
    to: order.customerEmail,
    subject: `Order ${ref} shipped`,
    node: React.createElement(Shipped, { order }),
    tags: [
      { name: "email_kind", value: "shipped" },
      { name: "order_ref", value: ref },
    ],
  });
}

// ---------------------------------------------------------------------------
// Refund notification (to customer)
// ---------------------------------------------------------------------------

/**
 * Sent when a charge is refunded (Stripe `charge.refunded` or admin-issued).
 * Called from the webhook's `handleChargeRefunded` after the order status
 * has been flipped to `refunded`.
 */
export async function sendRefundedNotification(order: Order): Promise<void> {
  const ref = formatOrderReference(order);
  await sendRenderedEmail({
    to: order.customerEmail,
    subject: `Order ${ref} refunded`,
    node: React.createElement(Refunded, { order }),
    tags: [
      { name: "email_kind", value: "refunded" },
      { name: "order_ref", value: ref },
    ],
  });
}

// ---------------------------------------------------------------------------
// Reprint acknowledgement (to customer)
// ---------------------------------------------------------------------------

/**
 * Sent when an admin creates a reprint for a customer's order. Closes the
 * silent gap between "damage reported" and "tracking arrives". Addressed to
 * the ORIGINAL order's customer; `originalOrder` must be the parent row, not
 * the freshly created reprint clone.
 */
export async function sendReprintOnTheWay(originalOrder: Order): Promise<void> {
  const ref = formatOrderReference(originalOrder);
  await sendRenderedEmail({
    to: originalOrder.customerEmail,
    subject: `A replacement for order ${ref} is on the way`,
    node: React.createElement(ReprintOnTheWay, { originalOrder }),
    tags: [
      { name: "email_kind", value: "reprint_ack" },
      { name: "order_ref", value: ref },
    ],
  });
}

// ---------------------------------------------------------------------------
// Post-purchase sequence - schedule + send
// ---------------------------------------------------------------------------

/**
 * Insert the seven scheduled-send rows into `scheduled_emails`. A future cron
 * (out of scope for this track) walks the table and calls
 * `sendPostPurchaseTouch` for each row whose `send_at` is due.
 *
 * See supabase/migrations/20260416121000_scheduled_emails.sql for schema.
 */
export async function schedulePostPurchaseSequence(order: Order): Promise<void> {
  await schedulePostPurchaseInserts(order);
}

export async function sendPostPurchaseTouch(
  order: Order,
  touchNumber: PostPurchaseTouchNumber
): Promise<void> {
  const subject = subjectForTouch(order, touchNumber);
  const ref = formatOrderReference(order);
  await sendRenderedEmail({
    to: order.customerEmail,
    subject,
    node: React.createElement(PostPurchase, { order, touchNumber }),
    tags: [
      { name: "email_kind", value: "post_purchase" },
      { name: "touch", value: String(touchNumber) },
      { name: "order_ref", value: ref },
    ],
  });
}

// ---------------------------------------------------------------------------
// sendAndAlert — thin observability wrapper.
//
// Wraps any of the send* functions so a failure is:
//   1. logged (console.error)
//   2. captured to Sentry with `pipeline: "email:<label>"`
//   3. fanned to the ops alert channels via alertSystemError
// and then rethrown — callers still decide whether to swallow the throw
// (webhook runSafely pattern) or let it bubble (admin resend route returns
// 502). Use in new code instead of ad-hoc try/catch around the send
// functions, and REQUIRED for any future post-purchase cron so the missing
// `RESEND_API_KEY` / render errors / Resend 5xx all surface to operators.
// ---------------------------------------------------------------------------

export async function sendAndAlert<T>(
  label: string,
  orderId: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`email:${label} (order ${orderId}) failed: ${msg}`);
    Sentry.captureException(err, {
      tags: { pipeline: `email:${label}`, orderId },
    });
    await alertSystemError(`email ${label} (order ${orderId})`, msg);
    throw err;
  }
}
