/**
 * GET /api/coa/[orderId]?token=...&itemId=...
 *
 * Streams a Certificate of Authenticity PDF for a given order. Gated by the
 * dispatch token so only the printer (or anyone with the signed link) can
 * fetch it. The COA is never publicly listed; losing the token is equivalent
 * to losing access.
 *
 * - With `itemId`: returns a single-page PDF for that item.
 * - Without `itemId`: returns a multi-page PDF bundling every item in the
 *   order (one COA per page). Used by the batch dispatch page so the printer
 *   can grab all COAs for an order in one click.
 *
 * Node runtime - @react-pdf needs Node primitives, not the edge runtime.
 */

import { after, NextResponse, type NextRequest } from "next/server";
import { verifyDispatchToken } from "@/lib/dispatch/token";
import { getOrderById } from "@/lib/supabase/queries/orders";
import { generateCoaPdf, generateOrderCoasPdf } from "@/lib/coa/generate";
import { serverClient } from "@/lib/supabase/server";
import { getDispatcher } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";
import type { OrderItem } from "@/lib/types";
import { formatOrderReference } from "@/lib/email/templates/_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderItemRow = {
  id: string;
  created_at: string;
  order_id: string;
  photo_id: string;
  photo_slug: string;
  photo_title: string;
  size_id: string;
  size_label: string;
  paper_id: string;
  paper_name: string;
  quantity: number;
  unit_price_cents: number;
  edition_number: number;
  edition_total: number;
  print_file_url_snapshot: string | null;
};

const ORDER_ITEM_COLUMNS =
  "id, created_at, order_id, photo_id, photo_slug, photo_title, size_id, size_label, paper_id, paper_name, quantity, unit_price_cents, edition_number, edition_total, print_file_url_snapshot";

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    photoId: row.photo_id,
    photoSlug: row.photo_slug,
    photoTitle: row.photo_title,
    sizeId: row.size_id,
    sizeLabel: row.size_label,
    paperId: row.paper_id,
    paperName: row.paper_name,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    editionNumber: row.edition_number,
    editionTotal: row.edition_total,
    printFileUrlSnapshot: row.print_file_url_snapshot,
  };
}

async function getOrderItem(orderId: string, itemId: string): Promise<OrderItem | null> {
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select(ORDER_ITEM_COLUMNS)
    .eq("order_id", orderId)
    .eq("id", itemId)
    .maybeSingle();
  if (error) {
    throw new Error(`getOrderItem failed: ${error.message}`);
  }
  if (!data) return null;
  return rowToOrderItem(data as OrderItemRow);
}

async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select(ORDER_ITEM_COLUMNS)
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`getOrderItems failed: ${error.message}`);
  }
  return ((data as OrderItemRow[] | null) ?? []).map(rowToOrderItem);
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const itemId = searchParams.get("itemId");

  if (!token) {
    return new NextResponse("Missing token", { status: 401 });
  }

  const payload = verifyDispatchToken(token);
  if (!payload) {
    return new NextResponse("Invalid or expired token", { status: 401 });
  }
  // Accept either a single-order token matching this order, or a batch token
  // (the batch dispatch page uses one shared token to download COAs for every
  // order in the batch). Batch tokens are scoped to dispatch-only pages.
  const tokenValid =
    (payload.kind === "single" && payload.orderId === orderId) || payload.kind === "batch";
  if (!tokenValid) {
    return new NextResponse("Token not valid for this order", { status: 403 });
  }

  let order;
  try {
    order = await getOrderById(orderId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`coa(${orderId}) getOrderById failure:`, err);
    after(() => {
      getDispatcher()
        .send(
          systemErrorAlert(`GET /api/coa/${orderId} order lookup (item=${itemId ?? "all"})`, msg)
        )
        .catch((alertErr) => {
          console.error(`coa(${orderId}): alert dispatch failed:`, alertErr);
        });
    });
    return new NextResponse("Failed to load order.", { status: 500 });
  }
  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }
  if (order.fulfillmentTokenRevokedAt) {
    return new NextResponse("Token revoked", { status: 403 });
  }

  const reference = formatOrderReference(order);

  // --- Multi-item bundle --------------------------------------------------
  if (!itemId) {
    let items: OrderItem[];
    try {
      items = await getOrderItems(orderId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`coa(${orderId}) getOrderItems failure:`, err);
      after(() => {
        getDispatcher()
          .send(systemErrorAlert(`GET /api/coa/${orderId} items lookup`, msg))
          .catch((alertErr) => {
            console.error(`coa(${orderId}): alert dispatch failed:`, alertErr);
          });
      });
      return new NextResponse("Failed to load order items.", { status: 500 });
    }
    if (items.length === 0) {
      return new NextResponse("Order has no items", { status: 404 });
    }

    let pdf: Buffer;
    try {
      pdf = await generateOrderCoasPdf(order, items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "COA render failed";
      console.error(`COA bundle render failed for order=${orderId}:`, err);
      after(() => {
        getDispatcher()
          .send(systemErrorAlert(`GET /api/coa/${orderId} bundle`, msg))
          .catch((alertErr) => {
            console.error(`coa(${orderId}): alert dispatch failed:`, alertErr);
          });
      });
      return new NextResponse(msg, { status: 500 });
    }

    const filename = items.length > 1 ? `COAs-${reference}.pdf` : `COA-${reference}.pdf`;
    const body = new Uint8Array(pdf);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  }

  // --- Single-item path ---------------------------------------------------
  let item;
  try {
    item = await getOrderItem(orderId, itemId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`coa(${orderId}) getOrderItem failure (item=${itemId}):`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`GET /api/coa/${orderId} item lookup (item=${itemId})`, msg))
        .catch((alertErr) => {
          console.error(`coa(${orderId}): alert dispatch failed:`, alertErr);
        });
    });
    return new NextResponse("Failed to load order item.", { status: 500 });
  }
  if (!item) {
    return new NextResponse("Order item not found", { status: 404 });
  }

  let pdf: Buffer;
  try {
    pdf = await generateCoaPdf(order, item);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "COA render failed";
    console.error(`COA render failed for order=${orderId} item=${itemId}:`, err);
    after(() => {
      getDispatcher()
        .send(systemErrorAlert(`GET /api/coa/${orderId} (item=${itemId})`, msg))
        .catch((alertErr) => {
          console.error(`coa(${orderId}): alert dispatch failed:`, alertErr);
        });
    });
    return new NextResponse(msg, { status: 500 });
  }

  const filename = `COA-${reference}.pdf`;
  const body = new Uint8Array(pdf);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
