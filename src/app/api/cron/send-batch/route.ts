/**
 * GET /api/cron/send-batch
 *
 * Vercel Cron job — runs every Monday at 13:00 UTC (8 am EST / 9 am EDT).
 *
 * Collects every `paid` order, flips them to `queued_for_print`, and emails
 * Loupe the signed batch dispatch link — the same side-effects triggered by
 * the manual "Review batch" button in the admin dashboard.
 *
 * If there are no `paid` orders the function is a safe no-op: no email is
 * sent and no alert fires (batchOrdersForPrint guards this internally).
 *
 * vercel.json cron config:
 *   { "path": "/api/cron/send-batch", "schedule": "0 13 * * 1" }
 *
 * Protected by CRON_SECRET to prevent public access.
 */

import type { NextRequest } from "next/server";
import { batchOrdersForPrint } from "@/lib/dispatch/batch";
import { systemErrorAlert } from "@/lib/alerting";
import { alertSystemError, getDispatcher } from "@/lib/alerting/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Fail-CLOSED in production: if CRON_SECRET is unset the endpoint would be
  // publicly callable and would hit Supabase + Resend on every request.
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd && !cronSecret) {
    console.error("[send-batch] CRON_SECRET is not set in production — refusing to run");
    try {
      await getDispatcher().send(
        systemErrorAlert(
          "GET /api/cron/send-batch (misconfigured)",
          "CRON_SECRET env var is not set in production. The send-batch cron is refusing to run until it's configured."
        )
      );
    } catch (alertErr) {
      console.error("[send-batch] misconfigured alert dispatch failed:", alertErr);
    }
    return new Response("Misconfigured", { status: 500 });
  }

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await batchOrdersForPrint("cron/send-batch");

    if (result.batched === 0) {
      console.log("[send-batch] No paid orders to batch — skipping printer email.");
      return Response.json({ batched: 0, skipped: true }, { status: 200 });
    }

    console.log(
      `[send-batch] Batched ${result.batched} order(s). printerEmailSent=${result.printerEmailSent}`
    );
    return Response.json(result, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[send-batch] batchOrdersForPrint threw:", msg);
    try {
      await alertSystemError("GET /api/cron/send-batch", msg);
    } catch (alertErr) {
      console.error("[send-batch] alert dispatch failed:", alertErr);
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
