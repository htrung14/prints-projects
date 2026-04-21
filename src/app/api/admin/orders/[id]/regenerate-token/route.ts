/**
 * POST /api/admin/orders/[id]/regenerate-token
 *
 * Issues a fresh 64-char url-safe fulfillment token, clears any prior
 * revocation, and re-sends the print-job email (Track C) with the new link.
 *
 * The route is defensive about Track C availability: if the email module
 * isn't wired yet we still succeed at the DB change and record the failure
 * in the audit log so the admin UI sees something actionable.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getAdminSession } from "@/lib/auth/session";
import { getOrderById } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { updateOrderFields, listOrderItems } from "@/app/admin/_data";

function newToken(): string {
  // 48 bytes of randomness → 64-char base64url string.
  return randomBytes(48)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/orders/[id]/regenerate-token">
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  const token = newToken();
  await updateOrderFields(id, {
    fulfillment_token: token,
    fulfillment_token_revoked_at: null,
  });
  await audit({
    orderId: id,
    actor: session.email,
    action: "fulfillment_token_regenerated",
    meta: {},
  });

  // Track C: send print-job email with the fresh link. Dynamic import so a
  // missing/half-built Track C module doesn't break the regenerate flow.
  try {
    const mod = (await import("@/lib/email/send").catch(() => null)) as {
      sendPrintJobEmail?: (o: unknown, items: unknown[]) => Promise<void>;
    } | null;
    if (mod?.sendPrintJobEmail) {
      const refreshed = await getOrderById(id);
      if (refreshed) {
        const items = await listOrderItems(id);
        await mod.sendPrintJobEmail(refreshed, items);
        await updateOrderFields(id, {
          print_job_email_sent_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error(
      `regenerate-token(${id}): sendPrintJobEmail failed: ${err instanceof Error ? err.message : String(err)}`
    );
    await audit({
      orderId: id,
      actor: session.email,
      action: "email_send_failed",
      meta: { kind: "print_job", after: "token_regenerate" },
    });
  }

  return NextResponse.json({ ok: true });
}
