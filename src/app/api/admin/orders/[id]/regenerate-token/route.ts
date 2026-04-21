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

import { after, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getAdminSession } from "@/lib/auth/session";
import { getOrderById } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { updateOrderFields, listOrderItems } from "@/app/admin/_data";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

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

  let order;
  try {
    order = await getOrderById(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`regenerate-token(${id}) getOrderById failure (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(`regenerate-token(${id}) order lookup (actor=${session.email})`, msg)
        )
        .catch((alertErr) => {
          console.error(`regenerate-token(${id}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json({ error: "Failed to load order. Please retry." }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  const token = newToken();
  try {
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`regenerate-token(${id}) token-write failure (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`regenerate-token(${id}) token write (actor=${session.email})`, msg))
        .catch((alertErr) => {
          console.error(`regenerate-token(${id}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json(
      { error: "Failed to regenerate token. Please retry." },
      { status: 500 }
    );
  }

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
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`regenerate-token(${id}): sendPrintJobEmail failed: ${msg}`);
    await audit({
      orderId: id,
      actor: session.email,
      action: "email_send_failed",
      meta: { kind: "print_job", after: "token_regenerate", error: msg },
    });
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(`regenerate-token(${id}) print-job email (actor=${session.email})`, msg)
        )
        .catch((alertErr) => {
          console.error(`regenerate-token(${id}): alert dispatch failed:`, alertErr);
        });
    });
  }

  return NextResponse.json({ ok: true });
}
