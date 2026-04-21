/**
 * GET /api/dispatch/print-file/[orderItemId]
 *
 * Rob clicks "Download print file" on the dispatch page. We:
 *   1. Verify `?token=...` (HMAC)
 *   2. Load the item via its parent order and confirm the token is bound
 *      to that order (single-kind) or is a valid batch token
 *   3. Read the parent photo's `print_file_key`
 *   4. Generate an R2 presigned GET URL (7-day TTL)
 *   5. Record the signed URL on `order_items.print_file_url_snapshot`
 *      for audit (snapshot of what Rob received)
 *   6. 302 redirect to the URL
 */

import { after, NextResponse, type NextRequest } from "next/server";
import { verifyDispatchToken } from "@/lib/dispatch/token";
import { getDispatchItemById, recordPrintFileUrlSnapshot } from "@/lib/dispatch/queries";
import { getOrderById } from "@/lib/supabase/queries/orders";
import { audit } from "@/lib/supabase/queries/audit";
import { getPrintFileSignedUrl } from "@/lib/r2/signed-url";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

export async function GET(req: NextRequest, ctx: { params: Promise<{ orderItemId: string }> }) {
  const { orderItemId } = await ctx.params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 401 });
  }

  const payload = verifyDispatchToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  let item;
  try {
    item = await getDispatchItemById(orderItemId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`dispatch/print-file(${orderItemId}) getDispatchItemById failure:`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`GET /api/dispatch/print-file/${orderItemId} item lookup`, msg))
        .catch((alertErr) => {
          console.error(`dispatch/print-file(${orderItemId}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json({ error: "Failed to load item. Please retry." }, { status: 500 });
  }
  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  // Single-kind tokens must match this item's order. Batch tokens may
  // download any item that belongs to an order visible to the batch page.
  if (payload.kind === "single" && payload.orderId !== item.orderId) {
    return NextResponse.json({ error: "Token does not authorize this item." }, { status: 403 });
  }

  let order;
  try {
    order = await getOrderById(item.orderId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`dispatch/print-file(${orderItemId}) getOrderById failure:`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`GET /api/dispatch/print-file/${orderItemId} order lookup`, msg))
        .catch((alertErr) => {
          console.error(`dispatch/print-file(${orderItemId}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json({ error: "Failed to load order. Please retry." }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.fulfillmentTokenRevokedAt) {
    return NextResponse.json({ error: "This link has been revoked." }, { status: 410 });
  }

  if (!item.photoPrintFileKey) {
    return NextResponse.json({ error: "Print file not uploaded for this photo." }, { status: 404 });
  }

  let signed: string;
  try {
    signed = await getPrintFileSignedUrl(item.photoPrintFileKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`dispatch/print-file: failed to sign ${item.photoPrintFileKey}:`, err);
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(
            `GET /api/dispatch/print-file/${orderItemId} r2-sign (key=${item.photoPrintFileKey})`,
            msg
          )
        )
        .catch((alertErr) => {
          console.error(`dispatch/print-file(${orderItemId}): alert dispatch failed:`, alertErr);
        });
    });
    return NextResponse.json({ error: "Could not generate download link." }, { status: 500 });
  }

  // Record the snapshot + audit, both non-blocking for the redirect.
  try {
    await recordPrintFileUrlSnapshot(orderItemId, signed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`dispatch/print-file: snapshot write failed for ${orderItemId}:`, err);
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(
            `GET /api/dispatch/print-file/${orderItemId} snapshot-write (non-blocking)`,
            msg
          )
        )
        .catch((alertErr) => {
          console.error(
            `dispatch/print-file(${orderItemId}): snapshot-alert dispatch failed:`,
            alertErr
          );
        });
    });
  }
  try {
    await audit({
      orderId: item.orderId,
      actor: "dispatch_download",
      action: "print_file_signed",
      meta: { orderItemId, r2Key: item.photoPrintFileKey },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`dispatch/print-file: audit write failed for ${orderItemId}:`, err);
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(
            `GET /api/dispatch/print-file/${orderItemId} audit-write (non-blocking)`,
            msg
          )
        )
        .catch((alertErr) => {
          console.error(
            `dispatch/print-file(${orderItemId}): audit-alert dispatch failed:`,
            alertErr
          );
        });
    });
  }

  return NextResponse.redirect(signed, { status: 302 });
}
