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
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import type { Address, CartLine, Order, OrderItem } from "@/lib/types";
import { resolveCartLines, expectedShippingCentsFor } from "./checkout";
import { stripeClient } from "./client";
import { insertOrderWithItems, insertRefundedStub } from "@/lib/supabase/queries/orders";
import { getPhotoIdMapBySlugs } from "@/lib/supabase/queries/photos";
import { audit } from "@/lib/supabase/queries/audit";
import { sendOrderConfirmation, sendRefundedNotification } from "@/lib/email/send";
import { buildDispatchUrl } from "@/lib/dispatch/url";
import { alertAfterOrder } from "@/lib/alerting/webhook-alerts";
import { alertSafely, alertSystemError } from "@/lib/alerting/dispatcher";

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
 * Persist the order, notify the printer + the customer, schedule the post-purchase
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

  // ---- 0b. Refund gate ----
  // If the underlying PaymentIntent has already been refunded (full or
  // partial) by the time we process this event, do NOT create a live
  // paid order. This happens when a checkout.session.completed delivery
  // fails (e.g. 2026-04-21 apex→www 307), ops refunds the charge
  // manually, then the original event is replayed. Without this guard
  // the replay creates an order in state "paid" that doesn't match
  // Stripe — the exact drift that required the manual reconciliation of
  // order 6a8c61e0 on 2026-04-22.
  const piId = extractPaymentIntentId(session);
  if (piId) {
    try {
      const stripe = stripeClient();
      const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
      const latestCharge =
        typeof pi.latest_charge === "object" && pi.latest_charge !== null ? pi.latest_charge : null;
      const refunded =
        pi.status === "canceled" ||
        (latestCharge as Stripe.Charge | null)?.refunded === true ||
        ((latestCharge as Stripe.Charge | null)?.amount_refunded ?? 0) > 0;
      if (refunded) {
        console.info(
          `webhook: session ${session.id} (PI ${piId}) is already refunded — skipping order creation`
        );
        Sentry.captureMessage("checkout.session.completed arrived post-refund", {
          level: "warning",
          tags: { pipeline: "stripe-webhook:post-refund-skip" },
          extra: { sessionId: session.id, paymentIntentId: piId },
        });
        await alertSystemError(
          `post-refund webhook skip (session ${session.id})`,
          `checkout.session.completed for ${session.id} arrived after PI ${piId} was already refunded. ` +
            `No order created (would have been drift). If this session was meant to be fulfilled, ` +
            `reconcile manually: re-charge the customer and run the webhook again.`
        );
        return { idempotent: true };
      }
    } catch (err) {
      // Don't fail the webhook if the PI lookup errors — log + alert and
      // continue with order creation. Stripe's retry safety-net will
      // re-trigger us if we actually 500, and an extra "paid" order is
      // recoverable manually, whereas a hard failure here would block
      // the entire webhook path.
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`webhook: PI refund lookup failed for ${piId}: ${msg}`);
      Sentry.captureException(err, {
        tags: { pipeline: "stripe-webhook:pi-refund-check" },
        extra: { sessionId: session.id, paymentIntentId: piId },
      });
    }
  }

  // ---- 1. Rebuild cart + re-price defensively ----
  const cartLines = parseCartLinesFromMetadata(session.metadata);
  const resolved = await resolveCartLines(cartLines);

  // ---- 1b. Skip test carts ----
  // The hidden `test-1-dollar` item is used to validate the checkout flow
  // without creating real order rows. Return idempotent so Stripe gets a
  // 200 and stops retrying, but nothing persists in the DB.
  const isTestCart = resolved.length > 0 && resolved.every((r) => r.photo.slug === "test-1-dollar");
  if (isTestCart) {
    console.info(`webhook: session ${session.id} is a test cart — skipping order creation`);
    return { idempotent: true };
  }

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

  // Guard: we narrow `allowed_countries` to the selected tier at session
  // creation time, but Stripe still lets the buyer edit the shipping country
  // on the hosted page in some edge cases. Re-derive the expected rate from
  // the *actual* shipping country and alert if the buyer under-paid
  // (e.g. picked "United States — $10" then shipped to Canada, or picked
  // "EU — $50" then shipped to Australia). Advisory only — the order still
  // persists; ops holds the shipment and collects the difference.
  //
  // Test carts are already short-circuited above (step 1b), so any cart
  // reaching this point is a real order. No need for a second isTestCart
  // check — the shipping-mismatch guard applies unconditionally.
  const expected = expectedShippingCentsFor(address.country);
  if (shippingCents < expected) {
    const shortfall = expected - shippingCents;
    const msg =
      `Order ${session.id}: shipping country ${address.country} expects ${expected}¢ ` +
      `(US=1000, CA=3500, EU/UK=5000, AU/ROW=6500) but buyer paid only ${shippingCents}¢. ` +
      `Likely picked a cheaper tier at checkout. Hold shipment and collect the ` +
      `$${(shortfall / 100).toFixed(2)} shortfall before dispatch.`;
    Sentry.captureMessage("shipping/country mismatch at checkout", {
      level: "warning",
      tags: { pipeline: "stripe-webhook:shipping-mismatch" },
      extra: {
        sessionId: session.id,
        country: address.country,
        shippingCents,
        expectedCents: expected,
      },
    });
    await alertSystemError("shipping/country mismatch", msg);
  }

  // ---- 3. Insert order + items (atomic edition assignment) ----
  //
  // `resolveCartLines` reads from the static fixture (src/data/photos.fixture.json),
  // which does NOT carry DB UUIDs. The create_order_with_items RPC's
  // photo_id column is `uuid`, so we must enrich each line with the real
  // Supabase id before calling. Doing this in one batched select avoids
  // an N+1 against the photos table.
  const photoIdMap = await getPhotoIdMapBySlugs(resolved.map((r) => r.photo.slug));
  for (const r of resolved) {
    if (!photoIdMap.has(r.photo.slug)) {
      // Rare: fixture has a slug that the DB doesn't. Throwing here makes
      // the webhook 500 → Stripe retries → ops sees the alert via
      // alertSystemError in the route's outer catch. Better than inserting
      // a bad row.
      throw new Error(
        `webhook: photo slug "${r.photo.slug}" present in fixture but missing from photos table`
      );
    }
  }

  let inserted: { order: Order; items: OrderItem[]; wasExisting: boolean };
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
        photoId: photoIdMap.get(r.photo.slug)!,
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

  // If `insertOrderWithItems` returned an already-existing order, the
  // caller is processing a Stripe replay for an event we've already
  // fully handled. Skip side-effects (emails, post-purchase, audit)
  // to avoid double-sending the customer confirmation. Observed in
  // the 2026-04-22 incident: order a16a5611 got 2 "paid" audit rows
  // and Mizar received 2 confirmation emails.
  if (inserted.wasExisting) {
    console.info(
      `webhook: session ${session.id} replayed — order ${inserted.order.id} already persisted; skipping side-effects`
    );
    return { idempotent: true };
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
    // block the webhook on it - Printer can reissue from admin later.
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`webhook(${order.id}): buildDispatchUrl failed: ${msg}`);
    Sentry.captureException(err, { tags: { pipeline: "stripe-webhook:buildDispatchUrl" } });
    await alertSystemError(`buildDispatchUrl (order ${order.id})`, msg);
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
  // Print-lab notification is NOT sent per-order. Loupe batches weekly:
  // Thalia runs `/admin/orders → Send batch` manually, which flips every
  // `paid` row to `queued_for_print` and sends ONE batch email to the
  // printer (see `src/lib/dispatch/batch.ts`). Per-order emails here
  // would spam the printer with 5-10 messages/week for no workflow gain.
  // The dispatchUrl is still built above so it's audit-logged and
  // available for manual resend if ever needed.
  //
  // Post-purchase drip (PostPurchase.tsx × 7 touches) is intentionally
  // NOT scheduled here. The scheduled_emails table + template code stay
  // in the repo but no new rows are inserted and no cron sends them —
  // the studio preferred to keep customer communication to the three
  // transactional emails (order confirmation, shipped, delivered).
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
 * Run a side-effect that must not fail the webhook. Logs + alerts + swallows.
 *
 * We never rethrow here — Stripe would retry forever on side-effect errors.
 * Instead we fan the error out to three places so it cannot disappear:
 *   1. console.error (Vercel logs)
 *   2. Sentry.captureException (last-resort signal if dispatcher is down)
 *   3. alertSystemError(...) → dispatcher (email + Telegram + Notion)
 */
async function runSafely(label: string, fn: () => Promise<void>, orderId: string): Promise<void> {
  try {
    await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`webhook(${orderId}): ${label} failed: ${msg}`);
    Sentry.captureException(err, { tags: { pipeline: `stripe-webhook:${label}`, orderId } });
    await alertSystemError(`${label} (order ${orderId})`, msg);
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
    Sentry.captureMessage("charge.refunded with no payment_intent", {
      level: "warning",
      tags: { pipeline: "stripe-webhook:charge.refunded" },
      extra: { chargeId: charge.id },
    });
    await alertSystemError(
      `charge.refunded (charge ${charge.id})`,
      "Refund event arrived with no payment_intent — cannot map to order. Check Stripe Dashboard manually."
    );
    return;
  }

  const db = await import("@/lib/supabase/server").then((m) => m.serverClient());
  const { data, error: lookupErr } = await db
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  // A Supabase-side error here (timeout, 5xx, schema problem) previously
  // left `data` undefined and fell through to the "no matching order"
  // branch — a misleading alert. Surface the real error and re-throw so
  // Stripe retries the delivery.
  if (lookupErr) {
    const msg = `charge.refunded DB lookup failed for PI ${piId}: ${lookupErr.message}`;
    console.error(`webhook: ${msg}`);
    Sentry.captureException(lookupErr, {
      tags: { pipeline: "stripe-webhook:charge.refunded:db-lookup" },
      extra: { paymentIntentId: piId, chargeId: charge.id },
    });
    await alertSystemError(`charge.refunded (PI ${piId}) DB lookup`, msg);
    throw new Error(msg);
  }

  if (!data) {
    // Refund-before-session race: charge.refunded can arrive before the
    // corresponding checkout.session.completed has been processed. Try
    // to persist a refunded stub so /admin/orders has visibility — ops
    // doesn't end up in "Stripe has it, our DB doesn't" drift.
    await handleRefundWithoutMatchingOrder(charge, piId);
    return;
  }

  const ordersModule = await import("@/lib/supabase/queries/orders");

  // IMPORTANT: do NOT early-return on `data.status === "refunded"`. That
  // used to be a retry trap — if the Resend call failed on the first
  // attempt (throw from sendAndAlert → 500 → Stripe retries), the retry
  // would see status='refunded' and skip email forever.
  //
  // Instead: only skip the status flip when it's already refunded, but
  // always attempt the email if we haven't successfully sent one yet.
  // Idempotency for the email itself is handled by checking the audit
  // log for a prior "refund_email_sent" row below.
  if (data.status !== "refunded") {
    await ordersModule.updateOrderStatus(data.id, "refunded", {
      trigger: "stripe_charge.refunded",
      chargeId: charge.id,
    });
  }

  // Don't double-send the refund email on Stripe retries. Check the
  // audit log for a prior send.
  const auditMod = await import("@/lib/supabase/queries/audit");
  const alreadySent = await hasPriorRefundEmail(data.id);
  if (alreadySent) {
    console.info(
      `webhook(${data.id}): refund email already sent previously — skipping re-send on retry.`
    );
  } else {
    const fullOrder = await ordersModule.getOrderById(data.id);
    if (fullOrder) {
      // Wrap in try/catch so a Resend hiccup does NOT throw back into
      // Stripe's retry loop (that was the old retry trap). On failure
      // we alert ops and move on — the `refund_email_sent` audit row is
      // only written on success, so a future retry will try again.
      try {
        await sendRefundedNotification(fullOrder);
        await auditMod.audit({
          orderId: fullOrder.id,
          actor: "stripe_webhook",
          action: "refund_email_sent",
          meta: { chargeId: charge.id, paymentIntentId: piId },
        });
      } catch (sendErr) {
        const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        console.error(`webhook(${fullOrder.id}): refund email send failed: ${msg}`);
        Sentry.captureException(sendErr, {
          tags: { pipeline: "stripe-webhook:refund-email" },
          extra: { orderId: fullOrder.id, chargeId: charge.id },
        });
        await alertSystemError(
          `refund email send failed (order ${fullOrder.id})`,
          `Order status is 'refunded' but the customer email failed to send: ${msg}. Resend manually from /admin/orders or via Stripe's "Send receipt" button. A future Stripe retry will also reattempt this send (no audit row written yet).`
        );
      }
    } else {
      console.warn(
        `webhook(${data.id}): order lookup returned null after status flip; refund email NOT sent.`
      );
      await alertSystemError(
        `refund email skipped (order ${data.id})`,
        `Order ${data.id} flipped to 'refunded' but a follow-up getOrderById returned null. Refund email was not sent. Reconcile manually.`
      );
    }
  }

  // Don't rethrow — we already updated the order status above, so a dispatcher
  // failure here shouldn't cause Stripe to retry and duplicate the update.
  await alertSafely(`charge.refunded (order ${data.id})`, {
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

/**
 * Check whether a `refund_email_sent` audit row exists for the given order.
 * Used to avoid re-sending the refund email when Stripe replays a
 * charge.refunded event we've already fully handled.
 */
async function hasPriorRefundEmail(orderId: string): Promise<boolean> {
  try {
    const db = await import("@/lib/supabase/server").then((m) => m.serverClient());
    const { data, error } = await db
      .from("audit_log")
      .select("id")
      .eq("order_id", orderId)
      .eq("action", "refund_email_sent")
      .limit(1)
      .maybeSingle();
    if (error) {
      // Fail-open: if the audit check errors, we'd rather risk a duplicate
      // email than no email at all. Surface the issue so ops sees it
      // even though we don't block the caller.
      console.warn(`hasPriorRefundEmail(${orderId}) query failed: ${error.message}`);
      Sentry.captureException(error, {
        tags: { pipeline: "stripe-webhook:hasPriorRefundEmail" },
        extra: { orderId },
      });
      return false;
    }
    return Boolean(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`hasPriorRefundEmail(${orderId}) threw: ${msg}`);
    Sentry.captureException(err, {
      tags: { pipeline: "stripe-webhook:hasPriorRefundEmail" },
      extra: { orderId },
    });
    return false;
  }
}

/**
 * charge.refunded arrived but no matching order exists in our DB yet —
 * either the session.completed event is still in flight or was lost.
 * Try to fetch the Stripe Checkout Session via the PaymentIntent and
 * persist a refunded stub so ops has admin-UI visibility; fall back to
 * a detailed alert if the session can't be retrieved.
 */
async function handleRefundWithoutMatchingOrder(
  charge: Stripe.Charge,
  piId: string
): Promise<void> {
  const stripe = stripeClient();
  let sessionList;
  try {
    sessionList = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`webhook: charge.refunded session lookup failed for PI ${piId}: ${msg}`);
    Sentry.captureException(err, {
      tags: { pipeline: "stripe-webhook:charge.refunded:session-lookup" },
      extra: { paymentIntentId: piId, chargeId: charge.id },
    });
    await alertSystemError(
      `charge.refunded (PI ${piId})`,
      `Refund issued in Stripe for PI ${piId} but no matching order in DB, and the session lookup to create a refunded stub also failed: ${msg}. Reconcile via Stripe Dashboard.`
    );
    return;
  }
  const session = sessionList.data[0] ?? null;
  if (!session) {
    await alertSystemError(
      `charge.refunded (PI ${piId})`,
      `Refund issued in Stripe for PI ${piId} but no matching order in DB and no Checkout Session associated with this PaymentIntent. Reconcile manually.`
    );
    return;
  }

  // Best-effort derive the stub row fields. Fall back to charge/billing
  // data when the session is missing pieces (guest checkouts sometimes
  // have partial customer details).
  let address: Address;
  try {
    address = extractShippingAddress(session);
  } catch {
    // Fall back to the charge's shipping or billing address when the
    // session didn't carry one (shouldn't happen for US-only checkouts
    // with shipping_address_collection, but guard anyway).
    const fallback = charge.shipping?.address ?? charge.billing_details?.address ?? null;
    if (!fallback || !fallback.line1) {
      await alertSystemError(
        `charge.refunded (PI ${piId})`,
        `Refund for PI ${piId} has no matching order and no usable shipping address. A refunded stub cannot be created. Reconcile manually.`
      );
      return;
    }
    address = {
      name: charge.shipping?.name ?? charge.billing_details?.name ?? "Unknown",
      line1: fallback.line1,
      line2: fallback.line2 ?? null,
      city: fallback.city ?? "",
      state: fallback.state ?? null,
      postalCode: fallback.postal_code ?? "",
      country: fallback.country ?? "",
    };
  }

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    charge.billing_details?.email ??
    "unknown@example.invalid";
  const name = session.customer_details?.name ?? charge.billing_details?.name ?? address.name;
  const notes = `charge.refunded arrived before checkout.session.completed (or session was never processed). stub inserted so ops has visibility. chargeId=${charge.id}.`;

  try {
    const ordersModule = await import("@/lib/supabase/queries/orders");
    const { order: stub } = await ordersModule.insertRefundedStub({
      stripeSessionId: session.id,
      stripePaymentIntentId: piId,
      customerEmail: email,
      customerName: name,
      shippingAddress: address,
      subtotalCents: Math.max(0, session.amount_subtotal ?? 0),
      taxCents: session.total_details?.amount_tax ?? 0,
      shippingCents: session.total_details?.amount_shipping ?? 0,
      totalCents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      notes,
    });
    await alertSystemError(
      `charge.refunded stub (order ${stub.id})`,
      `Stripe refund for PI ${piId} arrived before the corresponding order existed in our DB. Inserted a refunded stub (order ${stub.id}) with status=refunded. No customer email sent from this path — if one was expected, send manually.`
    );
  } catch (stubErr) {
    const msg = stubErr instanceof Error ? stubErr.message : String(stubErr);
    console.error(`webhook: refunded-stub insert failed for session ${session.id}: ${msg}`);
    Sentry.captureException(stubErr, {
      tags: { pipeline: "stripe-webhook:charge.refunded:stub" },
      extra: { sessionId: session.id, paymentIntentId: piId, chargeId: charge.id },
    });
    await alertSystemError(
      `charge.refunded stub insert (session ${session.id})`,
      `Refund for PI ${piId} has no matching order and a stub insert ALSO failed: ${msg}. Reconcile manually.`
    );
  }
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
    Sentry.captureMessage("charge.dispute.created with no payment_intent", {
      level: "error",
      tags: { pipeline: "stripe-webhook:charge.dispute.created" },
      extra: { disputeId: dispute.id },
    });
    await alertSystemError(
      `charge.dispute.created (dispute ${dispute.id})`,
      `Dispute opened but no payment_intent on the event — cannot map to order. Respond manually in Stripe Dashboard within 7 days.`
    );
    return;
  }

  const db = await import("@/lib/supabase/server").then((m) => m.serverClient());
  const { data } = await db
    .from("orders")
    .select("id, customer_email, total_cents")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  // Don't rethrow: disputes need human response regardless of whether our
  // alerting pipeline is healthy. Log + Sentry via alertSafely is enough.
  await alertSafely(`charge.dispute.created (dispute ${dispute.id})`, {
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
    // Customer paid, edition is gone, and we have no PI to refund. This is
    // worst-case — they need manual intervention NOW.
    const msg = `EDITION_EXCEEDED but no payment_intent to refund. Session: ${session.id}. Original error: ${errorMessage}`;
    console.error(`webhook: ${msg}`);
    Sentry.captureMessage("EDITION_EXCEEDED with no payment_intent", {
      level: "fatal",
      tags: { pipeline: "stripe-webhook:edition-exceeded" },
      extra: { sessionId: session.id, errorMessage },
    });
    await alertSystemError(
      `edition-exceeded (session ${session.id})`,
      `CRITICAL: Customer paid, edition sold out, and no payment_intent on session to auto-refund. Manual refund required immediately in Stripe Dashboard. ${msg}`
    );
    return;
  }

  const stripe = (await import("./client")).stripeClient();
  let refundSucceeded = false;
  try {
    await stripe.refunds.create({ payment_intent: piId });
    refundSucceeded = true;
  } catch (refundErr) {
    const msg = refundErr instanceof Error ? refundErr.message : String(refundErr);
    console.error(`webhook: auto-refund failed for PI ${piId}: ${msg}`);
    Sentry.captureException(refundErr, {
      tags: { pipeline: "stripe-webhook:auto-refund" },
      extra: { paymentIntentId: piId, sessionId: session.id },
    });
    await alertSystemError(
      `auto-refund (PI ${piId})`,
      `CRITICAL: Edition exceeded for session ${session.id} but auto-refund to PI ${piId} FAILED (${msg}). Refund the customer manually in Stripe Dashboard.`
    );
  }

  const email = session.customer_details?.email ?? session.customer_email;
  if (email) {
    try {
      const { getResend, fromAddress } = await import("@/lib/email/client");
      const resend = getResend();
      const { error: sendError } = await resend.emails.send({
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
      if (sendError) {
        // Resend's SDK reports API rejections via `{ error }`, not a throw.
        const m =
          typeof sendError === "object" && sendError !== null && "message" in sendError
            ? String((sendError as { message?: unknown }).message)
            : JSON.stringify(sendError);
        throw new Error(`Resend send failed: ${m}`);
      }
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error(`webhook: apology email failed for ${email}: ${msg}`);
      Sentry.captureException(emailErr, {
        tags: { pipeline: "stripe-webhook:apology-email" },
        extra: { email, sessionId: session.id },
      });
      await alertSystemError(
        `apology email (${email})`,
        `Edition-exceeded apology email to ${email} failed: ${msg}. Refund ${refundSucceeded ? "was" : "was NOT"} issued. Contact customer manually.`
      );
    }
  }

  // Persist a stub order so /admin/orders surfaces this event. Without a row
  // Thalia has to cross-reference Stripe dashboard + Notion audit to find it.
  // Wrapped so a DB failure does NOT break the refund flow — but it DOES
  // alert (no silent failures). Derive the address defensively: Stripe may
  // not have collected one on an async-payment flow, but on EDITION_EXCEEDED
  // the shipping address is always present (checkout requires it).
  let stubOrderId: string | null = null;
  try {
    const address = extractShippingAddress(session);
    const customerEmail =
      session.customer_details?.email ?? session.customer_email ?? "unknown@example.invalid";
    const customerName =
      session.customer_details?.name ?? session.customer_details?.individual_name ?? address.name;
    // Stripe's `amount_subtotal` is already pre-tax + pre-shipping, so we
    // use it directly. Max(0, …) guards against any future Stripe quirk.
    const subtotalCents = Math.max(0, session.amount_subtotal ?? 0);
    const notes = `auto-refunded: edition exceeded at fulfill (refund: ${
      refundSucceeded ? "ok" : "failed - manual action required"
    })`;
    const { order: stub } = await insertRefundedStub({
      stripeSessionId: session.id,
      stripePaymentIntentId: piId,
      customerEmail,
      customerName,
      shippingAddress: address,
      subtotalCents,
      taxCents: session.total_details?.amount_tax ?? 0,
      shippingCents: session.total_details?.amount_shipping ?? 0,
      totalCents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      notes,
    });
    stubOrderId = stub.id;

    // Audit the stub so the order detail page shows the event in its log.
    // audit() swallows errors internally (non-throwing) per its contract.
    await audit({
      orderId: stub.id,
      actor: "system",
      action: "order_refunded_edition_exceeded",
      meta: {
        sessionId: session.id,
        paymentIntentId: piId,
        refundSucceeded,
        errorMessage,
      },
    });
  } catch (stubErr) {
    const msg = stubErr instanceof Error ? stubErr.message : String(stubErr);
    console.error(`webhook: refunded-stub insert failed for session ${session.id}: ${msg}`);
    Sentry.captureException(stubErr, {
      tags: { pipeline: "stripe-webhook:refunded-stub" },
      extra: { sessionId: session.id, paymentIntentId: piId, refundSucceeded },
    });
    // Alert but DON'T rethrow — the refund already succeeded (or already
    // alerted on its own failure). Losing admin visibility is bad, but
    // re-throwing here would trigger Stripe to retry and potentially refund
    // twice via the outer handler.
    await alertSystemError(
      `refunded-stub insert (session ${session.id})`,
      `Edition-exceeded stub order could NOT be persisted to the DB (${msg}). Refund ${refundSucceeded ? "was" : "was NOT"} issued to PI ${piId}. This order will NOT appear in /admin/orders — reconcile manually via Stripe dashboard.`
    );
  }

  // alertSafely handles console.error + Sentry.captureException on dispatcher
  // failure so we don't silently lose this alert even if Telegram + email
  // channels are both down.
  await alertSafely(`edition-exceeded (session ${session.id})`, {
    type: "system_error",
    severity: "critical",
    title: "Edition exceeded — auto-refund issued",
    whatHappened: `Session ${session.id} paid but edition was exhausted. Auto-refund ${refundSucceeded ? "issued" : "FAILED"} to PI ${piId}. Customer: ${email ?? "unknown"}. Error: ${errorMessage}`,
    autoHandled: refundSucceeded
      ? "Full refund issued automatically. Apology email sent to customer."
      : "Refund FAILED — manual action required.",
    actionRequired: !refundSucceeded,
    actionInstructions: refundSucceeded
      ? "None — handled automatically. Verify refund appeared in Stripe Dashboard if concerned."
      : "Issue refund manually in Stripe Dashboard immediately.",
    timestamp: new Date().toISOString(),
    metadata: {
      sessionId: session.id,
      paymentIntentId: piId,
      email,
      error: errorMessage,
      refundSucceeded,
      stubOrderId,
    },
  });
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
