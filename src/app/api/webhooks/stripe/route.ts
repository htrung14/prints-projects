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
import { alertSystemError, getDispatcher } from "@/lib/alerting/dispatcher";
import { serverClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Threshold + window for the signature-failure rate alert. ≥3 fails in
// 5 min is the signature of a real incident (secret rotated, corrupted
// deploy) vs. sporadic attacker probes (which are < 1/min).
const SIG_FAIL_THRESHOLD = 3;
const SIG_FAIL_WINDOW_MINUTES = 5;
// Dedupe window: once we've fired the surge alert, don't re-fire for
// another hour even if failures keep coming. Prevents an incident from
// spamming ops channels with identical alerts every minute.
const SIG_FAIL_ALERT_COOLDOWN_MINUTES = 60;

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
    // Every sig-verify failure fires an immediate warning alert so ops
    // always knows something bounced — even a single one. The surge
    // detector (recordAndMaybeAlertOnSignatureFailure) then escalates to
    // critical if ≥3 pile up in 5 min, which is the "secret rotated"
    // signal. We don't suppress the per-event warning because the
    // 2026-04-22 post-mortem showed a single silent failure is enough to
    // miss a real delivery problem.
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`Stripe webhook signature verification failed: ${msg}`);
    Sentry.captureException(err, { tags: { pipeline: "stripe-webhook:signature" } });

    after(() => {
      alertSystemError(
        "Stripe webhook: signature verification failed",
        `A webhook delivery was rejected (400) because signature verification failed: ${msg}. ` +
          `If this is a one-off, it may be an attacker probe — no action needed. ` +
          `If you see multiple of these, check that STRIPE_WEBHOOK_SECRET in Vercel matches the signing secret in Stripe Dashboard.`
      );
      void recordAndMaybeAlertOnSignatureFailure(msg);
    });
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

/**
 * Record a signature-verification failure and, if the rate in a recent
 * window crosses the threshold, fire a critical ops alert. Dedupes via
 * a "webhook_sig_fail_surge_alert" audit row so an ongoing incident
 * (secret rotated in Stripe without our env update) doesn't spam the
 * alert channels on every failure.
 *
 * The function swallows its own errors — this runs inside `after()`
 * and must never interfere with the webhook's 400 response.
 */
async function recordAndMaybeAlertOnSignatureFailure(failureMsg: string): Promise<void> {
  try {
    const db = serverClient();
    const nowIso = new Date().toISOString();

    // Log the failure itself.
    const { error: insertErr } = await db.from("audit_log").insert({
      order_id: null,
      actor: "stripe_webhook",
      action: "webhook_sig_fail",
      meta: { failureMsg, at: nowIso },
    });
    if (insertErr) {
      console.warn(`sig-fail audit insert failed: ${insertErr.message}`);
      Sentry.captureException(insertErr, {
        tags: { pipeline: "stripe-webhook:sig-fail-audit" },
      });
      return;
    }

    // Count failures in the rolling window.
    const windowStart = new Date(Date.now() - SIG_FAIL_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count, error: countErr } = await db
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "webhook_sig_fail")
      .gte("created_at", windowStart);
    if (countErr) {
      console.warn(`sig-fail count failed: ${countErr.message}`);
      Sentry.captureException(countErr, {
        tags: { pipeline: "stripe-webhook:sig-fail-count" },
      });
      return;
    }
    if ((count ?? 0) < SIG_FAIL_THRESHOLD) return;

    // Dedupe: have we already alerted in the cooldown window?
    const cooldownStart = new Date(
      Date.now() - SIG_FAIL_ALERT_COOLDOWN_MINUTES * 60 * 1000
    ).toISOString();
    const { data: priorAlert } = await db
      .from("audit_log")
      .select("id")
      .eq("action", "webhook_sig_fail_surge_alert")
      .gte("created_at", cooldownStart)
      .limit(1)
      .maybeSingle();
    if (priorAlert) return;

    // Fire + record the dedupe breadcrumb together so a second surge
    // arrives don't both fire.
    await db.from("audit_log").insert({
      order_id: null,
      actor: "system",
      action: "webhook_sig_fail_surge_alert",
      meta: {
        count: count ?? 0,
        windowMinutes: SIG_FAIL_WINDOW_MINUTES,
        threshold: SIG_FAIL_THRESHOLD,
      },
    });
    try {
      await getDispatcher().send({
        type: "system_error",
        severity: "critical",
        title: `Stripe webhook signature surge: ${count} failures in ${SIG_FAIL_WINDOW_MINUTES} min`,
        whatHappened:
          `Stripe webhook signature verification failed ${count} times in the last ${SIG_FAIL_WINDOW_MINUTES} minutes. ` +
          `This is the signature of a rotated STRIPE_WEBHOOK_SECRET (in Stripe) without a matching update to the Vercel env, ` +
          `OR a corrupted deploy / reverse-proxy mangling the request body. Every Stripe delivery during this window is being rejected as 400 ` +
          `and will retry for up to 3 days — after that, events are permanently dropped.`,
        autoHandled:
          "Ongoing failures continue to be logged (webhook_sig_fail); no further surge alerts for the next hour.",
        actionRequired: true,
        actionInstructions:
          "1) Open Stripe Dashboard → Developers → Webhooks → click the endpoint → copy the current Signing secret. " +
          "2) Compare to the STRIPE_WEBHOOK_SECRET env var in Vercel. If they differ, update Vercel and redeploy. " +
          "3) Resend recent failed deliveries from Stripe.",
        timestamp: new Date().toISOString(),
        metadata: {
          recentFailures: count ?? 0,
          windowMinutes: SIG_FAIL_WINDOW_MINUTES,
          sampleMessage: failureMsg,
        },
      });
    } catch (dispatchErr) {
      const dMsg = dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr);
      console.error(`sig-fail surge alert dispatch failed: ${dMsg}`);
      Sentry.captureException(dispatchErr, {
        tags: { pipeline: "stripe-webhook:sig-fail-dispatch" },
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`recordAndMaybeAlertOnSignatureFailure threw: ${msg}`);
    Sentry.captureException(err, {
      tags: { pipeline: "stripe-webhook:sig-fail-outer" },
    });
  }
}
