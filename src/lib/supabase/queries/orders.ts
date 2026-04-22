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
import { REF_PATTERN } from "@/lib/orderRef";
import type { Address, Order, OrderItem, OrderStatus } from "@/lib/types";
import { serverClient } from "@/lib/supabase/server";
import { audit } from "@/lib/supabase/queries/audit";
import { alertSystemError } from "@/lib/alerting/dispatcher";

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
  parent_order_id: string | null;
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
  "id, created_at, stripe_checkout_session_id, stripe_payment_intent_id, customer_email, customer_name, shipping_address, subtotal_cents, tax_cents, shipping_cents, total_cents, currency, status, fulfillment_token, fulfillment_token_revoked_at, print_job_email_sent_at, tracking_number, carrier, notes, parent_order_id";

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
    case "queued_for_print":
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
    parentOrderId: row.parent_order_id ?? null,
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

  // Idempotency: if an order already exists for this session, return it
  const { data: existing } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("stripe_checkout_session_id", args.stripeSessionId)
    .maybeSingle();

  if (existing) {
    const { data: existingItems, error: itemsErr } = await db
      .from("order_items")
      .select("*")
      .eq("order_id", existing.id);
    if (itemsErr)
      throw new Error(`insertOrderWithItems: failed to fetch existing items: ${itemsErr.message}`);
    return {
      order: rowToOrder(existing as OrderRow),
      items: (existingItems ?? []).map((i) => rowToOrderItem(i as OrderItemRow)),
    };
  }

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
// insertRefundedStub
//
// When an edition sells out mid-transaction (EDITION_EXCEEDED after Stripe has
// already captured payment), the webhook auto-refunds the customer but there
// is no edition to assign — so `insertOrderWithItems` cannot persist the row.
// Without a DB row, the event is invisible to /admin/orders and Thalia can
// only reconcile by cross-referencing Stripe dashboard + Notion audit.
//
// This helper writes a stub `orders` row (status='refunded', no items) so the
// event is visible alongside regular orders. The existing unique constraint
// on `stripe_checkout_session_id` guarantees idempotency across webhook
// retries — we catch the duplicate-key error and treat it as a no-op.
//
// Returns the inserted order's id so callers can attach an audit_log entry.
// ---------------------------------------------------------------------------

export type InsertRefundedStubArgs = {
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
  notes: string;
};

export type InsertRefundedStubResult =
  | { order: Order; idempotent: false }
  | { order: Order; idempotent: true };

export async function insertRefundedStub(
  args: InsertRefundedStubArgs
): Promise<InsertRefundedStubResult> {
  const db = serverClient();

  // Idempotency: if a stub (or real) row already exists for this session,
  // return it without re-inserting. The unique constraint on
  // stripe_checkout_session_id would also catch this on insert, but checking
  // first avoids a noisy error in Supabase logs on every webhook retry.
  const { data: existing, error: selErr } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("stripe_checkout_session_id", args.stripeSessionId)
    .maybeSingle();
  if (selErr) {
    throw new Error(`insertRefundedStub: pre-check failed: ${selErr.message}`);
  }
  if (existing) {
    // Guard against shadowing a real paid order. If the webhook already
    // persisted a paid order for this session and a retry lands in the
    // EDITION_EXCEEDED path (or vice versa), returning the existing row
    // silently would hide a real customer order behind the "refunded"
    // idempotent label. Only treat as idempotent when the prior row is
    // itself a refunded stub; anything else is a consistency error and
    // must surface via admin alert.
    const existingRow = existing as OrderRow;
    if (existingRow.status === "refunded") {
      return { order: rowToOrder(existingRow), idempotent: true };
    }
    throw new Error(
      `insertRefundedStub: existing order for session ${args.stripeSessionId} is status=${existingRow.status}, not refunded. refusing to shadow a real order.`
    );
  }

  const row = {
    stripe_checkout_session_id: args.stripeSessionId,
    stripe_payment_intent_id: args.stripePaymentIntentId,
    customer_email: args.customerEmail,
    customer_name: args.customerName,
    shipping_address: args.shippingAddress,
    subtotal_cents: args.subtotalCents,
    tax_cents: args.taxCents,
    shipping_cents: args.shippingCents,
    total_cents: args.totalCents,
    currency: args.currency,
    status: "refunded",
    fulfillment_token: generateFulfillmentToken(),
    fulfillment_token_revoked_at: new Date().toISOString(),
    notes: args.notes,
  };

  const { data, error } = await db.from("orders").insert(row).select(ORDER_COLUMNS).single();
  if (error) {
    // Race with a concurrent webhook retry → unique constraint fires. Treat
    // as idempotent: re-read the winning row and return it.
    if (/duplicate key|unique constraint|already exists/i.test(error.message)) {
      const { data: raced, error: raceErr } = await db
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("stripe_checkout_session_id", args.stripeSessionId)
        .maybeSingle();
      if (raceErr) {
        throw new Error(
          `insertRefundedStub: duplicate key, then re-read failed: ${raceErr.message}`
        );
      }
      if (raced) {
        const racedRow = raced as OrderRow;
        if (racedRow.status !== "refunded") {
          throw new Error(
            `insertRefundedStub: existing order for session ${args.stripeSessionId} is status=${racedRow.status}, not refunded. refusing to shadow a real order.`
          );
        }
        return { order: rowToOrder(racedRow), idempotent: true };
      }
      // Extremely unlikely: duplicate key but no row visible. Fall through.
    }
    throw new Error(`insertRefundedStub failed: ${error.message}`);
  }
  if (!data) {
    throw new Error("insertRefundedStub: insert returned no row");
  }

  return { order: rowToOrder(data as OrderRow), idempotent: false };
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

/**
 * Look up an order by the 8-character reference shown to customers
 * (first 8 chars of the UUID, displayed uppercase) on /thank-you and
 * the confirmation email.
 *
 * Implementation: the 8-char ref is the first UUID segment, so we build
 * a UUID range [prefix-0000-…, next-0000-…) and compare directly on the
 * UUID column. This avoids PostgREST casting quirks around LIKE on uuid.
 * Validates the input as 8 hex chars up front to prevent unbounded
 * queries from a bad prefix.
 *
 * Throws on DB error (mirrors `getOrderById`). Returns null if no match, and
 * also returns null if two orders share the same 8-hex prefix — showing the
 * most recent to a stranger would leak another customer's order.
 */
export async function getOrderByRefPrefix(prefix: string): Promise<Order | null> {
  if (!REF_PATTERN.test(prefix)) {
    // Invalid shape — treat as "no match" without hitting the DB. Callers
    // should validate at the edge, but this belt-and-braces guard keeps an
    // accidental bad prefix from leaking a wildcard query.
    return null;
  }
  const lowered = prefix.toLowerCase();
  const lowerBound = `${lowered}-0000-0000-0000-000000000000`;
  // Increment the 32-bit prefix to get the exclusive upper bound. If the
  // prefix is ffffffff there is no larger UUID, so we skip the upper bound
  // (the lower bound alone still narrows to <= one possible first-segment).
  const prefixInt = parseInt(lowered, 16);
  const hasUpper = prefixInt < 0xffffffff;
  const upperBound = hasUpper
    ? `${(prefixInt + 1).toString(16).padStart(8, "0")}-0000-0000-0000-000000000000`
    : null;

  const db = serverClient();
  // limit(2): if two orders share the same 8-hex prefix (~1 in 4B per pair),
  // the ref is ambiguous and we refuse to guess — returning the most recent
  // would expose a stranger's order to the wrong customer.
  let query = db
    .from("orders")
    .select(ORDER_COLUMNS)
    .gte("id", lowerBound)
    .order("created_at", { ascending: false })
    .limit(2);
  if (upperBound) {
    query = query.lt("id", upperBound);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`getOrderByRefPrefix failed: ${error.message}`);
  }
  const rows = (data ?? []) as OrderRow[];
  if (rows.length === 0) return null;
  if (rows.length > 1) return null; // ambiguous prefix — privacy-safe fallback
  return rowToOrder(rows[0]);
}

export async function getOrderBySessionId(sessionId: string): Promise<Order | null> {
  const db = serverClient();
  const { data, error } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`getOrderBySessionId failed: ${error.message}`);
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

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .ilike("customer_email", email.trim())
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`getOrdersByEmail failed: ${error.message}`);
  }
  const rows = (data ?? []) as OrderRow[];
  return rows.map(rowToOrder);
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

// ---------------------------------------------------------------------------
// Reprint / reship
//
// A reprint is modelled as a *new* orders row with status='paid' and
// parent_order_id pointing at the original. This lets it flow through the
// normal batch-dispatch pipeline (Thalia clicks "Send batch" Tue/Fri) without
// any special-case code in the printer queue.
//
// Invariants:
//   * stripe_payment_intent_id is NULL — no Stripe involvement, Loupe absorbs
//     the cost for damage claims
//   * totals are all 0 — free reprint, so admin reports don't double-count
//   * edition_number is copied from the parent items — this is a reprint of
//     the *same* print, not a new edition slot (edition_sold must NOT bump)
//   * a fresh fulfillment_token is generated — parent's dispatch link stays
//     intact, child gets its own printer link when the batch sends
// ---------------------------------------------------------------------------

export async function getChildOrders(parentId: string): Promise<Order[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("parent_order_id", parentId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`getChildOrders(${parentId}) failed: ${error.message}`);
  }
  const rows = (data ?? []) as OrderRow[];
  return rows.map(rowToOrder);
}

/**
 * Cheap helper: return just the photo_ids on an order. Used by the reprint
 * cluster detector without paying for the full item projection.
 */
export async function getOrderPhotoIds(orderId: string): Promise<string[]> {
  const db = serverClient();
  const { data, error } = await db.from("order_items").select("photo_id").eq("order_id", orderId);
  if (error) {
    throw new Error(`getOrderPhotoIds(${orderId}) failed: ${error.message}`);
  }
  return ((data ?? []) as Array<{ photo_id: string }>).map((r) => r.photo_id);
}

/**
 * Count how many distinct reprint orders (parent_order_id IS NOT NULL) have
 * been created within the last `withinDays` days that share any of the given
 * photo_ids. Returns one entry per input photo_id with its observed title
 * (empty string if the photo has no matching reprints).
 *
 * Used to surface cluster alerts when a single photo is being reprinted over
 * and over — usually a packaging, paper, or image-prep issue.
 */
export async function countRecentReprintsByPhoto(
  photoIds: string[],
  withinDays: number
): Promise<Array<{ photoId: string; photoTitle: string; reprintCount: number }>> {
  if (photoIds.length === 0) return [];
  const db = serverClient();
  const cutoff = new Date(Date.now() - withinDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: orderRows, error: ordersErr } = await db
    .from("orders")
    .select("id")
    .not("parent_order_id", "is", null)
    .gte("created_at", cutoff);
  if (ordersErr) {
    throw new Error(`countRecentReprintsByPhoto orders step failed: ${ordersErr.message}`);
  }
  const orderIds = ((orderRows ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (orderIds.length === 0) {
    return photoIds.map((photoId) => ({ photoId, photoTitle: "", reprintCount: 0 }));
  }

  const { data: itemRows, error: itemsErr } = await db
    .from("order_items")
    .select("order_id, photo_id, photo_title")
    .in("order_id", orderIds)
    .in("photo_id", photoIds);
  if (itemsErr) {
    throw new Error(`countRecentReprintsByPhoto items step failed: ${itemsErr.message}`);
  }
  const byPhoto = new Map<string, Set<string>>();
  const titles = new Map<string, string>();
  for (const row of (itemRows ?? []) as Array<{
    order_id: string;
    photo_id: string;
    photo_title: string;
  }>) {
    if (!byPhoto.has(row.photo_id)) byPhoto.set(row.photo_id, new Set());
    byPhoto.get(row.photo_id)!.add(row.order_id);
    titles.set(row.photo_id, row.photo_title);
  }
  return photoIds.map((photoId) => ({
    photoId,
    photoTitle: titles.get(photoId) ?? "",
    reprintCount: byPhoto.get(photoId)?.size ?? 0,
  }));
}

/**
 * Count how many reprints in the last `withinDays` days had the same
 * normalized reason phrase. "Normalized" = lowercased + stripped of
 * non-alphanumerics + collapsed whitespace. Good enough for exact-ish
 * matches ("damaged in transit", "Damaged in transit.") without pulling in
 * a fuzzy-match library.
 *
 * Reads from the audit log (`reprint_created` rows) since the reason isn't
 * persisted on the orders table itself.
 */
export async function countRecentReprintsByReason(
  normalizedReason: string,
  withinDays: number
): Promise<number> {
  if (!normalizedReason) return 0;
  const db = serverClient();
  const cutoff = new Date(Date.now() - withinDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("audit_log")
    .select("meta")
    .eq("action", "reprint_created")
    .gte("created_at", cutoff);
  if (error) {
    throw new Error(`countRecentReprintsByReason failed: ${error.message}`);
  }
  let count = 0;
  for (const row of (data ?? []) as Array<{ meta: unknown }>) {
    const meta = (row.meta ?? null) as { reason?: unknown } | null;
    const raw = typeof meta?.reason === "string" ? meta.reason : "";
    if (normalizeReason(raw) === normalizedReason) count += 1;
  }
  return count;
}

/** Strip punctuation + collapse whitespace so "Damaged!" === "damaged". */
export function normalizeReason(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type ReprintItemRow = {
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
};

export async function createReprintOrder(
  parentOrderId: string,
  actor: string,
  reason: string
): Promise<Order> {
  const db = serverClient();

  // --- 1. Load parent + items ----------------------------------------------
  // We still load the parent/items client-side to (a) derive a stable
  // session_id suffix for the child and (b) build the items_jsonb payload
  // for the RPC. The RPC re-reads the parent FOR SHARE for atomicity; this
  // client-side read is for payload construction, not for consistency.
  const { data: parentRow, error: parentErr } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", parentOrderId)
    .maybeSingle();
  if (parentErr) {
    throw new Error(`createReprintOrder: parent lookup failed: ${parentErr.message}`);
  }
  if (!parentRow) {
    throw new Error(`createReprintOrder: parent order ${parentOrderId} not found`);
  }
  const parent = rowToOrder(parentRow as OrderRow);

  const { data: itemRows, error: itemsErr } = await db
    .from("order_items")
    .select(
      "photo_id, photo_slug, photo_title, size_id, size_label, paper_id, paper_name, quantity, unit_price_cents, edition_number, edition_total, print_file_url_snapshot"
    )
    .eq("order_id", parentOrderId);
  if (itemsErr) {
    throw new Error(`createReprintOrder: items lookup failed: ${itemsErr.message}`);
  }
  const items = (itemRows ?? []) as (ReprintItemRow & {
    print_file_url_snapshot: string | null;
  })[];
  if (items.length === 0) {
    throw new Error(
      `createReprintOrder: parent order ${parentOrderId} has no items — cannot reprint a refunded stub`
    );
  }

  // --- 2. Build RPC payload -----------------------------------------------
  // The stripe_checkout_session_id column is UNIQUE; we suffix the parent's
  // session id with a timestamp so reprints collide neither with the parent
  // nor with each other. No Stripe side-effect — this value is internal only.
  const nowIso = new Date().toISOString();
  const timestampTag = Date.now().toString(36);
  const childSessionId = `${parent.stripeCheckoutSessionId}-reprint-${timestampTag}`;
  const reasonTrimmed = reason.trim();
  const childNotes = `reprint: ${reasonTrimmed}. parent order: ${parentOrderId.slice(0, 8)}`;
  const fulfillmentToken = generateFulfillmentToken();

  // Edition numbers reuse the parent's values — this is a reprint of the
  // same piece, not a new edition slot. The RPC does NOT touch
  // photos.edition_sold and does NOT call create_order_with_items.
  const itemsPayload = items.map((it) => ({
    photo_id: it.photo_id,
    photo_slug: it.photo_slug,
    photo_title: it.photo_title,
    size_id: it.size_id,
    size_label: it.size_label,
    paper_id: it.paper_id,
    paper_name: it.paper_name,
    quantity: it.quantity,
    unit_price_cents: it.unit_price_cents,
    edition_number: it.edition_number,
    edition_total: it.edition_total,
    print_file_url_snapshot: it.print_file_url_snapshot,
  }));

  // --- 3. Atomic RPC: insert child order + clone items in one transaction --
  // Prior implementation did the two inserts sequentially with a best-effort
  // rollback; a mid-flight failure could leave a childless paid order that
  // would be swept into the next printer batch with zero line items. The
  // RPC runs both inserts in a single transaction — either both land or
  // neither does.
  const { data: rpcData, error: rpcErr } = await db.rpc("create_reprint_order", {
    p_parent_order_id: parentOrderId,
    p_items: itemsPayload,
    p_session_id: childSessionId,
    p_fulfillment_token: fulfillmentToken,
    p_notes: childNotes,
  });
  if (rpcErr) {
    throw new Error(`createReprintOrder: create_reprint_order RPC failed: ${rpcErr.message}`);
  }
  if (typeof rpcData !== "string" || rpcData.length === 0) {
    throw new Error("createReprintOrder: create_reprint_order RPC returned empty id");
  }
  const childId = rpcData;

  // Re-fetch the row for the return shape (avoids relying on sparse RPC
  // output shape if we ever add columns).
  const { data: childRow, error: childErr } = await db
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", childId)
    .maybeSingle();
  if (childErr) {
    throw new Error(`createReprintOrder: child re-read failed: ${childErr.message}`);
  }
  if (!childRow) {
    throw new Error(`createReprintOrder: child order ${childId} not visible after RPC`);
  }
  const child = rowToOrder(childRow as OrderRow);

  // --- 4. Audit both orders ------------------------------------------------
  // Outside the RPC because `audit()` is a separate write that swallows its
  // own errors (Sentry + stderr). If either fails, we alert but don't
  // rethrow — the RPC already persisted the reprint and the caller expects
  // success. `audit()` itself is non-throwing, so in practice this try/catch
  // only fires on unexpected runtime errors; keep it to satisfy the
  // no-silent-failures rule (every catch routes through alertSystemError).
  try {
    await audit({
      orderId: parentOrderId,
      actor,
      action: "reprint_created",
      meta: { childOrderId: child.id, reason: reasonTrimmed, createdAt: nowIso },
    });
    await audit({
      orderId: child.id,
      actor,
      action: "reprint_of",
      meta: { parentOrderId, reason: reasonTrimmed, createdAt: nowIso },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await alertSystemError("createReprintOrder audit", msg);
  }

  return child;
}
