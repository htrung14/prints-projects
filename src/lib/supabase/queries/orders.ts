/**
 * Typed query helpers for `orders` and `order_items`.
 *
 * Server-only. Uses the service-role client which bypasses RLS.
 *
 * `insertOrderWithItems` is the critical path (called from the Stripe webhook).
 * It wraps the `create_order_with_items` Postgres RPC, which runs the edition
 * assignment in a single transaction with row-level locks. See:
 *   supabase/migrations/20260416120000_init.sql
 *   docs/system-design.md §7
 */

import "server-only";
import { randomBytes } from "node:crypto";
import type { Address, Order, OrderItem, OrderStatus } from "@/lib/types";
import { serverClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// DB row shapes
// ---------------------------------------------------------------------------
type OrderRow = {
  id: string;
  created_at: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  customer_email: string;
  customer_name: string;
  shipping_address: unknown; // jsonb
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  status: string;
  fulfillment_token: string;
  fulfillment_token_revoked_at: string | null;
  print_job_email_sent_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  notes: string | null;
};

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

const ORDER_COLUMNS =
  "id, created_at, stripe_checkout_session_id, stripe_payment_intent_id, customer_email, customer_name, shipping_address, subtotal_cents, tax_cents, shipping_cents, total_cents, currency, status, fulfillment_token, fulfillment_token_revoked_at, print_job_email_sent_at, tracking_number, carrier, notes";

// ---------------------------------------------------------------------------
// Parsing / mapping
// ---------------------------------------------------------------------------

function parseAddress(raw: unknown): Address {
  // The schema stores shipping_address as jsonb. We validate structurally so
  // a malformed row surfaces a concrete error at read time instead of
  // polluting downstream.
  if (typeof raw !== "object" || raw === null) {
    throw new Error("orders.shipping_address is not an object");
  }
  const rec = raw as Record<string, unknown>;
  const need = (k: string): string => {
    const v = rec[k];
    if (typeof v !== "string") {
      throw new Error(`orders.shipping_address.${k} missing or not a string`);
    }
    return v;
  };
  const opt = (k: string): string | null => {
    const v = rec[k];
    if (v === undefined || v === null) return null;
    if (typeof v !== "string") {
      throw new Error(`orders.shipping_address.${k} not a string`);
    }
    return v;
  };
  return {
    name: need("name"),
    line1: need("line1"),
    line2: opt("line2"),
    city: need("city"),
    state: opt("state"),
    postalCode: need("postalCode"),
    country: need("country"),
  };
}

function narrowStatus(status: string): OrderStatus {
  switch (status) {
    case "paid":
    case "sent_to_print":
    case "printed":
    case "shipped":
    case "delivered":
    case "refunded":
    case "cancelled":
      return status;
    default:
      throw new Error(`orders.status is not a valid OrderStatus: ${status}`);
  }
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    createdAt: row.created_at,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    shippingAddress: parseAddress(row.shipping_address),
    subtotalCents: row.subtotal_cents,
    taxCents: row.tax_cents,
    shippingCents: row.shipping_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    status: narrowStatus(row.status),
    fulfillmentToken: row.fulfillment_token,
    fulfillmentTokenRevokedAt: row.fulfillment_token_revoked_at,
    printJobEmailSentAt: row.print_job_email_sent_at,
    trackingNumber: row.tracking_number,
    carrier: row.carrier,
    notes: row.notes,
  };
}

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

// ---------------------------------------------------------------------------
// insertOrderWithItems
//
// The Stripe webhook passes Stripe's line items plus a denormalized photo
// snapshot (slug, title, size/paper labels) so the `order_items` rows carry
// audit info even if a photo or its sizes/papers are later edited.
// ---------------------------------------------------------------------------

export type InsertOrderItemInput = {
  photoId: string;
  photoSlug: string;
  photoTitle: string;
  sizeId: string;
  sizeLabel: string;
  paperId: string;
  paperName: string;
  quantity: number;
  unitPriceCents: number;
};

export type InsertOrderArgs = {
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: Address;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  items: InsertOrderItemInput[];
};

/**
 * Generate a 64-char URL-safe random token for the fulfillment/dispatch link.
 * 48 raw bytes → 64 base64url chars (no padding).
 */
function generateFulfillmentToken(): string {
  return randomBytes(48).toString("base64url");
}

export async function insertOrderWithItems(
  args: InsertOrderArgs
): Promise<{ order: Order; items: OrderItem[] }> {
  if (args.items.length === 0) {
    throw new Error("insertOrderWithItems: items must be non-empty");
  }

  const db = serverClient();
  const payload = {
    stripeCheckoutSessionId: args.stripeSessionId,
    stripePaymentIntentId: args.stripePaymentIntentId,
    customerEmail: args.customerEmail,
    customerName: args.customerName,
    shippingAddress: args.shippingAddress,
    subtotalCents: args.subtotalCents,
    taxCents: args.taxCents,
    shippingCents: args.shippingCents,
    totalCents: args.totalCents,
    currency: args.currency,
    fulfillmentToken: generateFulfillmentToken(),
    status: "paid",
    items: args.items.map((i) => ({
      photoId: i.photoId,
      photoSlug: i.photoSlug,
      photoTitle: i.photoTitle,
      sizeId: i.sizeId,
      sizeLabel: i.sizeLabel,
      paperId: i.paperId,
      paperName: i.paperName,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
  };

  const { data, error } = await db.rpc("create_order_with_items", { payload });

  if (error) {
    // Rewrap with the raised Postgres error code prefix ("EDITION_EXCEEDED",
    // "PHOTO_NOT_FOUND", "BAD_PAYLOAD") preserved in the message; the webhook
    // maps on substring.
    throw new Error(`create_order_with_items failed: ${error.message}`);
  }
  if (!data || typeof data !== "object") {
    throw new Error("create_order_with_items returned empty payload");
  }

  // rpc returns whatever the function returned - we validate the shape.
  const obj = data as { order?: unknown; items?: unknown };
  if (typeof obj.order !== "object" || obj.order === null) {
    throw new Error("create_order_with_items: missing `order` in result");
  }
  if (!Array.isArray(obj.items)) {
    throw new Error("create_order_with_items: missing `items` array in result");
  }

  const order = rowToOrder(obj.order as OrderRow);
  const items = obj.items.map((i) => rowToOrderItem(i as OrderItemRow));

  return { order, items };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getOrderById(id: string): Promise<Order | null> {
  const db = serverClient();
  const { data, error } = await db.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();

  if (error) {
    throw new Error(`getOrderById(${id}) failed: ${error.message}`);
  }
  if (!data) return null;
  return rowToOrder(data as OrderRow);
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const db = serverClient();
  const { data, error } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("fulfillment_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(`getOrderByToken failed: ${error.message}`);
  }
  if (!data) return null;
  return rowToOrder(data as OrderRow);
}

/**
 * Transition an order to a new status.
 *
 * Writes an audit_log row inline (via `meta`) so callers don't have to
 * remember two calls. If you need side-effects other than status change
 * (tracking number, notes), update `orders` directly with a separate helper.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  meta: Record<string, unknown> = {}
): Promise<void> {
  const db = serverClient();

  const { error: updErr } = await db.from("orders").update({ status }).eq("id", id);
  if (updErr) {
    throw new Error(`updateOrderStatus(${id}) failed: ${updErr.message}`);
  }

  const { error: logErr } = await db.from("audit_log").insert({
    order_id: id,
    actor: "system",
    action: "status_change",
    meta: { ...meta, status },
  });
  if (logErr) {
    // We intentionally don't throw here: the status change already succeeded
    // and the webhook path must remain idempotent-friendly. Surface via log.
    console.error(
      `updateOrderStatus(${id}): audit log insert failed (${logErr.message}); continuing`
    );
  }
}

export type ListOrdersFilter = {
  status?: OrderStatus;
  limit?: number;
};

export async function listOrders(filter: ListOrdersFilter = {}): Promise<Order[]> {
  const db = serverClient();
  let query = db.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false });

  if (filter.status) {
    query = query.eq("status", filter.status);
  }
  if (typeof filter.limit === "number" && filter.limit > 0) {
    query = query.limit(filter.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`listOrders failed: ${error.message}`);
  }
  const rows = (data ?? []) as OrderRow[];
  return rows.map(rowToOrder);
}
