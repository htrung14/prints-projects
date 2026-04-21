/**
 * GET /api/cron/watchdog
 *
 * Vercel Cron job — runs daily. Alerts if any order has been stuck in
 * "queued_for_print" for more than 7 days (printer batches 1-2x/week).
 *
 * vercel.json cron config:
 *   { "path": "/api/cron/watchdog", "schedule": "0 9 * * *" }
 *
 * Protected by CRON_SECRET to prevent public access.
 */

import type { NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { getDispatcher } from "@/lib/alerting/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_THRESHOLD_DAYS = 7;

export async function GET(req: NextRequest): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = serverClient();
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: stale, error } = await db
    .from("orders")
    .select("id, customer_email, created_at")
    .eq("status", "queued_for_print")
    .lt("created_at", cutoff);

  if (error) {
    console.error("[watchdog] Failed to query stale orders:", error.message);
    return new Response("Query failed", { status: 500 });
  }

  if (!stale || stale.length === 0) {
    return Response.json({ stale: 0 });
  }

  const dispatcher = getDispatcher();
  await dispatcher.send({
    type: "system_error",
    severity: "critical",
    title: `${stale.length} order(s) stuck in print queue > ${STALE_THRESHOLD_DAYS} days`,
    whatHappened: `The following orders have been queued_for_print for over ${STALE_THRESHOLD_DAYS} days: ${stale.map((o) => o.id).join(", ")}. Customers: ${stale.map((o) => o.customer_email).join(", ")}.`,
    autoHandled: "Nothing — this alert is the only action taken.",
    actionRequired: true,
    actionInstructions:
      "Check with the printer (Brooklyn Archival) on batch status. If printed, update order status to 'printed'. If delayed, communicate ETA to affected customers.",
    timestamp: new Date().toISOString(),
    metadata: { staleCount: stale.length, orderIds: stale.map((o) => o.id) },
  });

  return Response.json({ stale: stale.length, orderIds: stale.map((o) => o.id) });
}
