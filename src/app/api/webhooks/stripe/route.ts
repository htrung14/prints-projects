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
import { stripeClient, webhookSecret } from "@/lib/stripe/client";
import { dispatchWebhookEvent, runPostOrderSideEffects } from "@/lib/stripe/webhook";
import type Stripe from "stripe";

// Node runtime only - the Stripe SDK's signature verification uses the
// Node `crypto` module, not the Web Crypto subset available on Edge.
export const runtime = "nodejs";
// Webhooks are always dynamic; never let a build-time cache sit between us
// and Stripe's delivery.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    // No signature header → not a legitimate Stripe delivery. Return 400.
    return new Response("Missing Stripe-Signature header", { status: 400 });
  }

  // `req.text()` returns the raw body as delivered - required for
  // signature verification. Using req.json() would re-serialize with
  // different whitespace and the HMAC would not match.
  const rawBody = await req.text();

  const stripe = stripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret());
  } catch (err) {
    console.warn(`Stripe webhook signature verification failed: ${(err as Error).message}`);
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, {
      status: 400,
    });
  }

  try {
    const result = await dispatchWebhookEvent(event);

    // Side-effects (emails, alerts, audit) run after we return 200 to Stripe.
    if (result && "order" in result) {
      const session = event.data.object as Stripe.Checkout.Session;
      after(() => runPostOrderSideEffects(result.order, result.items, session, result.dispatchUrl));
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error(`Stripe webhook handler failed for event ${event.id} (${event.type}):`, err);
    return new Response("Internal error", { status: 500 });
  }
}
