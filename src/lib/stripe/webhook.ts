/**
 * Stripe webhook event dispatcher.
 *
 * Server-only. Called from `POST /api/webhooks/stripe/route.ts` after
 * signature verification. This module contains *all* the post-payment logic
 * (persist order, assign editions, dispatch emails, audit). Keeping it out
 * of the route file makes it unit-testable and keeps the route thin.
 *
 * Reliability rules (design doc §7):
 *   - Return 200 fast. Stripe retries up to 3 days on non-2xx.
 *   - Idempotency by the unique `stripe_checkout_session_id` constraint on
 *     `orders`. A duplicate event is a no-op (logged + 200).
 *   - Email/audit failures are swallowed (logged) - NEVER fail the webhook.
 *   - Re-resolve prices from the photo catalog. Don't trust Stripe's echoed
 *     `unit_amount` - defence in depth.
 */

import "server-only";
import type Stripe from "stripe";
import type { Address, CartLine, Order, OrderItem } from "@/lib/types";
import { resolveCartLines } from "./checkout";
import { insertOrderWithItems } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import {
  sendOrderConfirmation,
  sendPrintJobEmail,
  schedulePostPurchaseSequence,
} from "@/lib/email/send";
import { buildDispatchUrl } from "@/lib/dispatch/url";
import { alertAfterOrder } from "@/lib/alerting/webhook-alerts";

// ---------------------------------------------------------------------------
// Metadata shape
// ---------------------------------------------------------------------------

/**
 * Parse the cart that was stashed in session metadata at checkout creation.
 * Throws on malformed payloads so we don't silently succeed with a partial
 * order. (A failed parse surfaces via the webhook's 500 → Stripe retries.)
 */
function parseCartLinesFromMetadata(metadata: Stripe.Metadata | null | undefined): CartLine[] {
  const raw = metadata?.cart_lines_json;
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error("webhook: session.metadata.cart_lines_json missing or empty");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`webhook: cart_lines_json is not valid JSON: ${(err as Error).message}`);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("webhook: cart_lines_json did not decode to a non-empty array");
  }

  return parsed.map((line, idx) => {
    if (typeof line !== "object" || line === null) {
      throw new Error(`webhook: cart_lines_json[${idx}] is not an object`);
    }
    const rec = line as Record<string, unknown>;
    const slug = rec.photoSlug;
    const sizeId = rec.sizeId;
    const paperId = rec.paperId;
    const quantity = rec.quantity;
    if (
      typeof slug !== "string" ||
      typeof sizeId !== "string" ||
      typeof paperId !== "string" ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(`webhook: cart_lines_json[${idx}] shape mismatch`);
    }
    return {
      photoSlug: slug,
      sizeId,
      // The CartLine type widens paperId to PaperType; runtime we trust the
      // slug lookup in resolveCartLines to reject unknown papers.
      paperId: paperId as CartLine["paperId"],
      quantity,
    };
  });
}

// ---------------------------------------------------------------------------
// Address extraction
// ---------------------------------------------------------------------------

/**
 * Pull the canonical shipping address off the completed session.
 *
 * Stripe populates `collected_information.shipping_details` on session
 * completion. Falls back to `customer_details.address` (billing) if the
 * shipping collection ever lands empty (shouldn't with `required`).
 */
function extractShippingAddress(session: Stripe.Checkout.Session): Address {
  const ship = session.collected_information?.shipping_details;
  const cust = session.customer_details;

  const name = ship?.name ?? cust?.name ?? cust?.individual_name ?? "Unknown";
  const addr = ship?.address ?? cust?.address ?? null;

  if (!addr) {
    throw new Error("webhook: session has no shipping or billing address");
  }
  if (typeof addr.line1 !== "string" || addr.line1.length === 0) {
    throw new Error("webhook: shipping address missing line1");
  }
  if (typeof addr.city !== "string" || addr.city.length === 0) {
    throw new Error("webhook: shipping address missing city");
  }
  if (typeof addr.postal_code !== "string" || addr.postal_code.length === 0) {
    throw new Error("webhook: shipping address missing postal_code");
  }
  if (typeof addr.country !== "string" || addr.country.length === 0) {
    throw new Error("webhook: shipping address missing country");
  }

  return {
    name,
    line1: addr.line1,
    line2: addr.line2 ?? null,
    city: addr.city,
    state: addr.state ?? null,
    postalCode: addr.postal_code,
    country: addr.country,
  };
}

// ---------------------------------------------------------------------------
// Payment intent extraction
// ---------------------------------------------------------------------------

function extractPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (!pi) return null;
  if (typeof pi === "string") return pi;
  return pi.id ?? null;
}

// ---------------------------------------------------------------------------
// Core: handle `checkout.session.completed`
// ---------------------------------------------------------------------------

/**
 * Persist the order, notify Rob + the customer, schedule the post-purchase
 * drip sequence, and audit-log. Idempotent on
 * `stripe_checkout_session_id`.
 *
 * All email/audit failures are logged and swallowed. The only hard-failure
 * branches are:
 *   - Malformed session metadata (webhook lacks the cart - can't rebuild)
 *   - Missing shipping address (Stripe misconfiguration)
 *   - Unknown photo/size/paper (catalog drift between checkout and fulfil)
 *   - Supabase RPC raising (e.g. edition sold out). Track A's RPC raises
 *     with a prefixed code; upstream logs and returns 500 → Stripe retries.
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<
  { order: Order; items: OrderItem[]; dispatchUrl: string | null } | { idempotent: true }
> {
  // ---- 0. Gate on payment_status === "paid" ----
  // For async payment methods (bank transfers, SEPA), checkout.session.completed
  // fires BEFORE payment settles. Only proceed when funds are confirmed.
  if (session.payment_status !== "paid") {
    console.info(
      `webhook: session ${session.id} has payment_status="${session.payment_status}" — skipping until paid`
    );
    return { idempotent: true };
  }

  // ---- 1. Rebuild cart + re-price defensively ----
  const cartLines = parseCartLinesFromMetadata(session.metadata);
  const resolved = await resolveCartLines(cartLines);

  // ---- 2. Gather session-level fields ----
  const address = extractShippingAddress(session);
  const email =
    session.customer_details?.email ?? session.customer_email ?? "unknown@example.invalid";
  const name =
    session.customer_details?.name ?? session.customer_details?.individual_name ?? address.name;

  const subtotalCents = resolved.reduce((n, r) => n + r.unitPriceCents * r.line.quantity, 0);
  const taxCents = session.total_details?.amount_tax ?? 0;
  const shippingCents = session.total_details?.amount_shipping ?? 0;
  const totalCents = session.amount_total ?? subtotalCents + taxCents + shippingCents;
  const currency = session.currency ?? "usd";

  // ---- 3. Insert order + items (atomic edition assignment) ----
  let inserted: { order: Order; items: OrderItem[] };
  try {
    inserted = await insertOrderWithItems({
      stripeSessionId: session.id,
      stripePaymentIntentId: extractPaymentIntentId(session),
      customerEmail: email,
      customerName: name,
      shippingAddress: address,
      subtotalCents,
      taxCents,
      shippingCents,
      totalCents,
      currency,
      items: resolved.map((r) => ({
        // Track A's InsertOrderArgs requires photoId + denormalized snapshot
        // fields so order_items rows survive catalog edits.
        photoId: r.photo.id ?? "",
        photoSlug: r.photo.slug,
        photoTitle: r.photo.title,
        sizeId: r.line.sizeId,
        sizeLabel: r.sizeLabel,
        paperId: r.line.paperId,
        paperName: r.paperName,
        quantity: r.line.quantity,
        unitPriceCents: r.unitPriceCents,
      })),
    });
  } catch (err) {
    const msg = (err as Error).message ?? String(err);

    // Idempotency: the unique constraint on stripe_checkout_session_id will
    // surface as a Postgres "duplicate key" error. Stripe retries (e.g. if
    // our 200 was lost) should return 200 cleanly.
    if (/duplicate key|unique constraint|already exists/i.test(msg)) {
      console.info(
        `webhook: duplicate checkout.session.completed for ${session.id} - idempotent no-op`
      );
      return { idempotent: true };
    }

    // Edition exhausted after payment: auto-refund the customer.
    if (/EDITION_EXCEEDED/i.test(msg)) {
      await handleEditionExceeded(session, msg);
      return { idempotent: true };
    }

    // Anything else (bad payload, RPC error) bubbles up so the route
    // returns 500 and Stripe retries.
    throw err;
  }

  const { order, items } = inserted;

  // ---- 4. Build the dispatch URL once; Track C's template embeds it. ----
  //
  // We compute it here so the URL lifetime starts at paid time, and so we
  // don't re-sign on every retry. The email sender accepts `order` and
  // `items` per the Track C interface; the dispatch URL is derivable from
  // `order.id`, which Track C will re-derive. We also attach it to the
  // audit trail so ops can recover the exact URL later.
  let dispatchUrl: string | null = null;
  try {
    dispatchUrl = buildDispatchUrl(order.id, { kind: "single" });
  } catch (err) {
    // buildDispatchUrl may throw if DISPATCH_SIGNING_SECRET is unset. Don't
    // block the webhook on it - Rob can reissue from admin later.
    console.error(`webhook(${order.id}): buildDispatchUrl failed: ${(err as Error).message}`);
  }

  return { order, items, dispatchUrl };
}

/**
 * Non-critical side-effects to run AFTER the webhook returns 200.
 * Called via waitUntil in the route handler so Stripe gets a fast response.
 */
export async function runPostOrderSideEffects(
  order: Order,
  items: OrderItem[],
  session: { id: string },
  dispatchUrl: string | null
): Promise<void> {
  const totalCents = order.totalCents;
  const taxCents = order.taxCents;
  const shippingCents = order.shippingCents;
  const currency = order.currency;

  await runSafely("sendOrderConfirmation", () => sendOrderConfirmation(order, items), order.id);
  // Print-lab notification is opt-in: only run when PRINT_SHOP_EMAIL is
  // explicitly configured. Otherwise orders are batched manually.
  if (dispatchUrl && process.env.PRINT_SHOP_EMAIL) {
    const url = dispatchUrl;
    await runSafely("sendPrintJobEmail", () => sendPrintJobEmail(order, items, url), order.id);
  }
  await runSafely(
    "schedulePostPurchaseSequence",
    () => schedulePostPurchaseSequence(order),
    order.id
  );
  await runSafely("alertAfterOrder", () => alertAfterOrder(order, items), order.id);
  await runSafely(
    "audit(paid)",
    () =>
      audit({
        orderId: order.id,
        actor: "stripe_webhook",
        action: "paid",
        meta: {
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: order.stripePaymentIntentId,
          totalCents,
          taxCents,
          shippingCents,
          currency,
          dispatchUrl,
        },
      }),
    order.id
  );
}

/**
 * Run a side-effect that must not fail the webhook. Logs + swallows.
 */
async function runSafely(label: string, fn: () => Promise<void>, orderId: string): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`webhook(${orderId}): ${label} failed: ${(err as Error).message ?? String(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Handle charge.refunded
// ---------------------------------------------------------------------------

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);

  if (!piId) {
    console.warn("webhook: charge.refunded has no payment_intent — cannot map to order");
    return;
  }

  const db = await import("@/lib/supabase/server").then((m) => m.serverClient());
  const { data } = await db
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  if (!data) {
    console.info(`webhook: charge.refunded for PI ${piId} — no matching order found`);
    return;
  }

  if (data.status === "refunded") return;

  await import("@/lib/supabase/queries/orders").then((m) =>
    m.updateOrderStatus(data.id, "refunded", {
      trigger: "stripe_charge.refunded",
      chargeId: charge.id,
    })
  );

  const { getDispatcher } = await import("@/lib/alerting/dispatcher");
  const dispatcher = getDispatcher();
  await dispatcher.send({
    type: "system_error",
    severity: "warning",
    title: "Order refunded via Stripe",
    whatHappened: `Order ${data.id} was refunded (charge ${charge.id}). Payment intent: ${piId}.`,
    autoHandled: "Order status updated to 'refunded' in database.",
    actionRequired: false,
    actionInstructions:
      "None — refund processed. Check if edition needs to be released back to inventory.",
    timestamp: new Date().toISOString(),
    metadata: { orderId: data.id, chargeId: charge.id, paymentIntentId: piId },
  });
}

// ---------------------------------------------------------------------------
// Handle charge.dispute.created
// ---------------------------------------------------------------------------

async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const piId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : (dispute.payment_intent?.id ?? null);

  if (!piId) {
    console.warn("webhook: charge.dispute.created has no payment_intent");
    return;
  }

  const db = await import("@/lib/supabase/server").then((m) => m.serverClient());
  const { data } = await db
    .from("orders")
    .select("id, customer_email, total_cents")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  const { getDispatcher } = await import("@/lib/alerting/dispatcher");
  const dispatcher = getDispatcher();

  await dispatcher.send({
    type: "system_error",
    severity: "critical",
    title: "Payment dispute opened",
    whatHappened: `Dispute ${dispute.id} opened for payment intent ${piId}. Reason: ${dispute.reason}. ${data ? `Order: ${data.id}, customer: ${data.customer_email}, amount: $${((data.total_cents as number) / 100).toFixed(2)}.` : "No matching order found."}`,
    autoHandled: "Nothing — disputes require manual response in Stripe Dashboard.",
    actionRequired: true,
    actionInstructions:
      "Respond to the dispute in Stripe Dashboard within 7 days. Gather shipping proof, COA photo, and delivery confirmation.",
    timestamp: new Date().toISOString(),
    metadata: {
      disputeId: dispute.id,
      paymentIntentId: piId,
      orderId: data?.id,
      reason: dispute.reason,
    },
  });
}

// ---------------------------------------------------------------------------
// Auto-refund on EDITION_EXCEEDED
// ---------------------------------------------------------------------------

export async function handleEditionExceeded(
  session: Stripe.Checkout.Session,
  errorMessage: string
): Promise<void> {
  const piId = extractPaymentIntentId(session);
  if (!piId) {
    console.error("webhook: EDITION_EXCEEDED but no payment_intent to refund");
    return;
  }

  const stripe = (await import("./client")).stripeClient();
  try {
    await stripe.refunds.create({ payment_intent: piId });
  } catch (refundErr) {
    console.error(`webhook: auto-refund failed for PI ${piId}: ${(refundErr as Error).message}`);
  }

  const email = session.customer_details?.email ?? session.customer_email;
  if (email) {
    try {
      const { getResend, fromAddress } = await import("@/lib/email/client");
      const resend = getResend();
      await resend.emails.send({
        from: fromAddress(),
        to: email,
        subject: "We're sorry — your order could not be fulfilled",
        text: [
          `Hi ${session.customer_details?.name ?? "there"},`,
          ``,
          `We sincerely apologize — one or more prints in your order sold out between checkout and payment confirmation.`,
          ``,
          `A full refund has been issued to your original payment method. You should see it within 5-10 business days.`,
          ``,
          `If you'd like to select a different print, we'd love to have you back:`,
          `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.thaliabassim.com"}`,
          ``,
          `Thank you for your understanding.`,
          `— Thalia Bassim Studio`,
        ].join("\n"),
      });
    } catch (emailErr) {
      console.error(`webhook: apology email failed for ${email}: ${(emailErr as Error).message}`);
    }
  }

  try {
    const { getDispatcher } = await import("@/lib/alerting/dispatcher");
    const dispatcher = getDispatcher();
    await dispatcher.send({
      type: "system_error",
      severity: "critical",
      title: "Edition exceeded — auto-refund issued",
      whatHappened: `Session ${session.id} paid but edition was exhausted. Auto-refund issued to PI ${piId}. Customer: ${email ?? "unknown"}. Error: ${errorMessage}`,
      autoHandled: "Full refund issued automatically. Apology email sent to customer.",
      actionRequired: false,
      actionInstructions:
        "None — handled automatically. Verify refund appeared in Stripe Dashboard if concerned.",
      timestamp: new Date().toISOString(),
      metadata: { sessionId: session.id, paymentIntentId: piId, email, error: errorMessage },
    });
  } catch (alertErr) {
    console.error(`webhook: edition-exceeded alert failed: ${(alertErr as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// Top-level dispatcher - route calls this after signature verification.
// ---------------------------------------------------------------------------

type DispatchResult =
  | { order: Order; items: OrderItem[]; dispatchUrl: string | null }
  | { idempotent: true }
  | null;

export async function dispatchWebhookEvent(event: Stripe.Event): Promise<DispatchResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      return await handleCheckoutSessionCompleted(session);
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      return await handleCheckoutSessionCompleted(session);
    }
    case "charge.refunded": {
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      return null;
    }
    case "charge.dispute.created": {
      await handleDisputeCreated(event.data.object as Stripe.Dispute);
      return null;
    }
    default:
      console.info(`webhook: ignoring event type ${event.type}`);
      return null;
  }
}
