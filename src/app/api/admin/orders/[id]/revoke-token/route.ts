/**
 * POST /api/admin/orders/[id]/revoke-token
 *
 * Marks the current fulfillment token as revoked. Track D's dispatch page
 * must honor `fulfillment_token_revoked_at` and reject the link.
 *
 * Note: per the Track E spec the "revoke" control is a companion to
 * "regenerate" (not separately listed under YOUR OWNERSHIP). We implement it
 * as a dedicated endpoint so the UI can distinguish revoke-without-regenerate
 * (rare) from regenerate-and-resend (common).
 */

import { after, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { getOrderById } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { updateOrderFields } from "@/app/admin/_data";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/admin/orders/[id]/revoke-token">
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
    console.error(`revoke-token(${id}) getOrderById failure (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`revoke-token(${id}) order lookup (actor=${session.email})`, msg))
        .catch((alertErr) => {
          console.error(`revoke-token(${id}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json({ error: "Failed to load order. Please retry." }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  try {
    await updateOrderFields(id, {
      fulfillment_token_revoked_at: new Date().toISOString(),
    });
    await audit({
      orderId: id,
      actor: session.email,
      action: "fulfillment_token_revoked",
      meta: {},
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`revoke-token(${id}) db failure (actor=${session.email}):`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`revoke-token(${id}) (actor=${session.email})`, msg))
        .catch((alertErr) => {
          console.error(`revoke-token(${id}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json({ error: "Failed to revoke token. Please retry." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
