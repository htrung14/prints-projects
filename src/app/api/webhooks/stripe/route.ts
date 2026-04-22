/**
 * POST /api/webhooks/stripe
 *
 * Receives Stripe webhook events, verifies the signature, and dispatches
 * to the handler in `@/lib/stripe/webhook`. Returns 200 fast.
 *
 * Verification MUST be done against the raw request body - we use
 * `await req.text()` (App Router equivalent of disabling the Pages-router
 * `bodyParser`) and hand the string straight to `stripe.webhooks.constructEvent`.
 *
 * Status codes:
 *   200 - event received (success OR intentional no-op)
 *   400 - signature verification failed (bad secret, mangled body,
 *         replay attempt). Stripe will mark the delivery as failed.
 *   500 - our handler threw; Stripe retries up to 3 days.
 */

import type { NextRequest } from "next/server";
import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { stripeClient, webhookSecret } from "@/lib/stripe/client";
import { dispatchWebhookEvent, runPostOrderSideEffects } from "@/lib/stripe/webhook";
import { alertSystemError } from "@/lib/alerting/dispatcher";
import type Stripe from "stripe";

// Node runtime only - the Stripe SDK's signature verification uses the
// Node `crypto` module, not the Web Crypto subset available on Edge.
export const runtime = "nodejs";
// Webhooks are always dynamic; never let a build-time cache sit between us
// and Stripe's delivery.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  // --- Proof-of-life breadcrumb ---------------------------------------------
  // Fires BEFORE any validation so that a broken signing secret, a wrong-URL
  // redirect, or any other early failure still leaves a trail. Stripe adds
  // a `Stripe-Signature` header with a `t=` timestamp; capture it and the
  // event-id header for fast correlation with the Stripe dashboard.
  //
  // Why: a real live-prod outage (2026-04-21, the apex→www 307 redirect) was
  // invisible to all ops channels because Vercel answered the redirect
  // before this handler ever ran. The handler running at all is itself a
  // signal worth recording; Sentry.addBreadcrumb is cheap and non-alerting.
  const receivedAtIso = new Date().toISOString();
  const sigHeader = req.headers.get("stripe-signature");
  // Stripe does not expose the event ID in an HTTP header — it lives in
  // the JSON body (`evt_...`). The old read of `stripe-signature-event-id`
  // was nonstandard and always returned null. Leave the field in the
  // breadcrumb so future correlation-header support (if any) slots in
  // cleanly, but expect null today.
  const stripeEventId = req.headers.get("stripe-event-id") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  console.log(
    `[stripe-webhook] received at=${receivedAtIso} ua=${userAgent ?? "?"} ` +
      `event-id=${stripeEventId ?? "?"} signed=${sigHeader ? "yes" : "no"}`
  );
  Sentry.addBreadcrumb({
    category: "stripe-webhook",
    level: "info",
    message: "webhook POST received",
    data: {
      receivedAtIso,
      signed: Boolean(sigHeader),
      stripeEventId,
      userAgent,
    },
  });

  const signature = sigHeader;
  if (!signature) {
    // No signature header → not a legitimate Stripe delivery. Return 400.
    return new Response("Missing Stripe-Signature header", { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Stripe webhook: failed to read request body: ${msg}`);
    Sentry.captureException(err, { tags: { pipeline: "stripe-webhook:body-read" } });
    // Best-effort alert; body-read failures are rare and worth surfacing.
    after(() => {
      alertSystemError("Stripe webhook: body read", msg);
    });
    return new Response("Failed to read request body", { status: 400 });
  }

  const stripe = stripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret());
  } catch (err) {
    // Signature verification failures are either attacker probes (noise) or
    // a rotated webhook secret (real ops issue). We send to Sentry so it's
    // captured without spamming Telegram/email for every probe. If the
    // attacker rate-limits or a real failure trend emerges, Sentry will
    // show the pattern.
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Stripe webhook signature verification failed: ${msg}`);
    Sentry.captureException(err, { tags: { pipeline: "stripe-webhook:signature" } });
    return new Response(`Webhook signature verification failed: ${msg}`, {
      status: 400,
    });
  }

  try {
    const result = await dispatchWebhookEvent(event);

    // Side-effects (emails, alerts, audit) run after we return 200 to Stripe.
    if (result && "order" in result) {
      const session = event.data.object as Stripe.Checkout.Session;
      after(async () => {
        try {
          await runPostOrderSideEffects(result.order, result.items, session, result.dispatchUrl);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          Sentry.captureException(err, {
            tags: { pipeline: "stripe-webhook:after-side-effects", eventType: event.type },
            extra: { orderId: result.order.id, eventId: event.id },
          });
          await alertSystemError(
            `Stripe webhook side-effects failed (order ${result.order.id})`,
            msg
          );
        }
      });
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Stripe webhook handler failed for event ${event.id} (${event.type}):`, err);
    Sentry.captureException(err, {
      tags: { pipeline: "stripe-webhook:handler", eventType: event.type },
      extra: { eventId: event.id },
    });
    after(() => {
      alertSystemError(`Stripe webhook: ${event.type} (${event.id})`, msg);
    });
    return new Response("Internal error", { status: 500 });
  }
}
