/**
 * GET /api/cron/watchdog
 *
 * Vercel Cron job — runs daily. Two independent checks:
 *
 *   1. Stale `queued_for_print` orders — anything sitting in the print
 *      queue for more than 7 days (printer batches 1-2x/week).
 *   2. Webhook reconciliation — every successful Stripe
 *      `checkout.session.completed` event in the last ~25h should have a
 *      corresponding row in Supabase `orders`. Missing rows mean the
 *      webhook POST never made it to us OR our handler failed silently.
 *      Catches the class of outage from 2026-04-21 (apex→www 307 redirect
 *      in front of the webhook URL).
 *
 * vercel.json cron config:
 *   { "path": "/api/cron/watchdog", "schedule": "0 9 * * *" }
 *
 * Protected by CRON_SECRET to prevent public access.
 */

import type { NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";
import { stripeClient } from "@/lib/stripe/client";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_THRESHOLD_DAYS = 7;

/**
 * How far back we scan Stripe events. The cron runs daily, so a 25h window
 * gives 1h of overlap between runs — any event missed on one run will be
 * re-checked on the next.
 */
const RECON_WINDOW_HOURS = 25;
/**
 * Stripe's events.list hard-caps per-page at 100. For this shop's volume
 * a single page is comfortably enough; if it ever isn't we log and alert
 * so volume growth is visible instead of silent.
 */
const STRIPE_EVENTS_PAGE_LIMIT = 100;

export async function GET(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const staleResult = await checkStaleQueuedForPrint();
  const reconResult = await checkWebhookReconciliation();

  const status = staleResult.ok && reconResult.ok ? 200 : 500;
  return Response.json(
    {
      stale: staleResult,
      reconciliation: reconResult,
    },
    { status }
  );
}

// ---------------------------------------------------------------------------
// Check 1: stale queued_for_print orders
// ---------------------------------------------------------------------------

type StaleResult = { ok: boolean; count?: number; orderIds?: string[]; error?: string };

async function checkStaleQueuedForPrint(): Promise<StaleResult> {
  const db = serverClient();
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: stale, error } = await db
    .from("orders")
    .select("id, customer_email, created_at")
    .eq("status", "queued_for_print")
    .lt("created_at", cutoff);

  if (error) {
    console.error("[watchdog] Failed to query stale orders:", error.message);
    try {
      await getDispatcher().send(
        systemErrorAlert("GET /api/cron/watchdog (stale-order query)", error.message)
      );
    } catch (alertErr) {
      console.error("[watchdog] stale-query alert dispatch failed:", alertErr);
    }
    return { ok: false, error: error.message };
  }

  if (!stale || stale.length === 0) {
    return { ok: true, count: 0 };
  }

  const dispatcher = getDispatcher();
  try {
    await dispatcher.send({
      type: "system_error",
      severity: "critical",
      title: `${stale.length} order(s) stuck in print queue > ${STALE_THRESHOLD_DAYS} days`,
      whatHappened: `The following orders have been queued_for_print for over ${STALE_THRESHOLD_DAYS} days: ${stale
        .map((o) => o.id)
        .join(", ")}. Customers: ${stale.map((o) => o.customer_email).join(", ")}.`,
      autoHandled: "Nothing — this alert is the only action taken.",
      actionRequired: true,
      actionInstructions:
        "Check with Michael at Loupe on batch status. If printed, update order status to 'printed'. If delayed, communicate ETA to affected customers.",
      timestamp: new Date().toISOString(),
      metadata: { staleCount: stale.length, orderIds: stale.map((o) => o.id) },
    });
  } catch (alertErr) {
    const msg = alertErr instanceof Error ? alertErr.message : String(alertErr);
    console.error("[watchdog] stale-order alert dispatch failed:", alertErr);
    try {
      await dispatcher.send(
        systemErrorAlert("GET /api/cron/watchdog (stale-order alert dispatch)", msg)
      );
    } catch (secondErr) {
      console.error("[watchdog] secondary alert dispatch failed:", secondErr);
    }
    return { ok: false, error: msg };
  }

  return { ok: true, count: stale.length, orderIds: stale.map((o) => o.id) };
}

// ---------------------------------------------------------------------------
// Check 2: webhook reconciliation — every paid Stripe checkout should have
// a matching row in our `orders` table.
// ---------------------------------------------------------------------------

type ReconResult = {
  ok: boolean;
  scanned?: number;
  missing?: number;
  missingSessionIds?: string[];
  error?: string;
};

async function checkWebhookReconciliation(): Promise<ReconResult> {
  const cutoffUnix = Math.floor((Date.now() - RECON_WINDOW_HOURS * 60 * 60 * 1000) / 1000);
  let events: Stripe.Event[] = [];
  let hasMore = false;

  try {
    const stripe = stripeClient();
    const listed = await stripe.events.list({
      type: "checkout.session.completed",
      created: { gte: cutoffUnix },
      limit: STRIPE_EVENTS_PAGE_LIMIT,
    });
    events = listed.data;
    hasMore = listed.has_more;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[watchdog] Stripe events.list failed:", msg);
    try {
      await getDispatcher().send(
        systemErrorAlert("GET /api/cron/watchdog (stripe events list)", msg)
      );
    } catch (alertErr) {
      console.error("[watchdog] stripe-list alert dispatch failed:", alertErr);
    }
    return { ok: false, error: msg };
  }

  // Only care about paid sessions — async_payment_pending / unpaid sessions
  // are expected to flow through separate events and shouldn't trigger a
  // "missing" alert.
  const paidSessions = events
    .map((e) => e.data.object as Stripe.Checkout.Session)
    .filter((s) => s && s.payment_status === "paid" && typeof s.id === "string");

  if (paidSessions.length === 0) {
    return { ok: true, scanned: 0, missing: 0 };
  }

  const sessionIds = paidSessions.map((s) => s.id);
  const db = serverClient();
  const { data: rows, error } = await db
    .from("orders")
    .select("stripe_checkout_session_id")
    .in("stripe_checkout_session_id", sessionIds);

  if (error) {
    console.error("[watchdog] orders reconciliation query failed:", error.message);
    try {
      await getDispatcher().send(
        systemErrorAlert("GET /api/cron/watchdog (recon query)", error.message)
      );
    } catch (alertErr) {
      console.error("[watchdog] recon-query alert dispatch failed:", alertErr);
    }
    return { ok: false, error: error.message };
  }

  const knownIds = new Set(
    ((rows ?? []) as Array<{ stripe_checkout_session_id: string }>).map(
      (r) => r.stripe_checkout_session_id
    )
  );
  const missing = paidSessions.filter((s) => !knownIds.has(s.id));

  // Paginator overflow warning — fires separately from the missing-rows
  // alert so a high-volume day that's fully reconciled doesn't look broken.
  if (hasMore) {
    try {
      await getDispatcher().send({
        type: "system_error",
        severity: "warning",
        title: "Watchdog: Stripe event window > 100 — recon page truncated",
        whatHappened: `Stripe returned 100 checkout.session.completed events within the last ${RECON_WINDOW_HOURS}h and reports has_more=true. Only the most recent 100 were reconciled against Supabase.`,
        autoHandled: "Reconciliation completed for the 100 most recent events.",
        actionRequired: false,
        actionInstructions:
          "Consider reducing RECON_WINDOW_HOURS, running the watchdog more often, or paginating here if this happens regularly.",
        timestamp: new Date().toISOString(),
        metadata: { scanned: paidSessions.length },
      });
    } catch (alertErr) {
      console.error("[watchdog] overflow alert dispatch failed:", alertErr);
    }
  }

  if (missing.length === 0) {
    return { ok: true, scanned: paidSessions.length, missing: 0 };
  }

  // Found missing orders — fire a single critical alert listing them.
  const summary = missing
    .map((s) => {
      const ref = typeof s.id === "string" ? s.id : "?";
      const email = s.customer_details?.email ?? "?";
      const cents = typeof s.amount_total === "number" ? s.amount_total : 0;
      return `${ref} (${email}, $${(cents / 100).toFixed(2)})`;
    })
    .join("; ");

  const dispatcher = getDispatcher();
  try {
    await dispatcher.send({
      type: "system_error",
      severity: "critical",
      title: `Watchdog: ${missing.length} Stripe payment(s) missing from Supabase`,
      whatHappened: `Stripe has ${missing.length} paid checkout.session.completed event(s) in the last ${RECON_WINDOW_HOURS}h that never created an order row in Supabase. Sessions: ${summary}.`,
      autoHandled:
        "Nothing — this is a detection-only alert. No DB writes were performed; edition counters are unaffected.",
      actionRequired: true,
      actionInstructions:
        "Check the Stripe webhook endpoint URL + signing secret + Vercel Function logs. Once the cause is fixed, replay the missing events from Stripe's dashboard (Developers → Events → per-event 'Resend').",
      timestamp: new Date().toISOString(),
      metadata: {
        missingSessionIds: missing.map((s) => s.id),
        scanned: paidSessions.length,
      },
    });
  } catch (alertErr) {
    const msg = alertErr instanceof Error ? alertErr.message : String(alertErr);
    console.error("[watchdog] recon alert dispatch failed:", alertErr);
    try {
      await dispatcher.send(systemErrorAlert("GET /api/cron/watchdog (recon alert dispatch)", msg));
    } catch (secondErr) {
      console.error("[watchdog] secondary recon-alert dispatch failed:", secondErr);
    }
    return { ok: false, error: msg };
  }

  return {
    ok: true,
    scanned: paidSessions.length,
    missing: missing.length,
    missingSessionIds: missing.map((s) => s.id),
  };
}
