/**
 * Dispatch-scoped DB reads/writes.
 *
 * Track A owns the `supabase/queries/*` helpers but hasn't exposed an order
 * + items + joined-photo read, nor a writer for `print_file_url_snapshot`.
 * Rather than stubbing in Track A's namespace, we keep these queries local
 * to Track D so the dispatch flow is self-contained. When Track A lands a
 * `getOrderWithItemsForDispatch`, this file can re-export instead.
 *
 * Server-only.
 */

import "server-only";
import type { Order, OrderItem } from "@/lib/types";
import { serverClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Row shapes (local copies; Track A's `orders.ts` keeps these internal).
// ---------------------------------------------------------------------------

type OrderItemJoinRow = {
  id: string;
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
  photos: {
    id: string;
    reference_number: string;
    image_url: string;
    image_alt: string;
    print_file_key: string | null;
  } | null;
};

// ---------------------------------------------------------------------------
// Dispatch item (order item + enough photo metadata to render)
// ---------------------------------------------------------------------------

export type DispatchItem = OrderItem & {
  photoReferenceNumber: string;
  photoImageUrl: string;
  photoImageAlt: string;
  photoPrintFileKey: string | null;
};

function rowToDispatchItem(row: OrderItemJoinRow): DispatchItem {
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
    photoReferenceNumber: row.photos?.reference_number ?? "",
    photoImageUrl: row.photos?.image_url ?? "",
    photoImageAlt: row.photos?.image_alt ?? row.photo_title,
    photoPrintFileKey: row.photos?.print_file_key ?? null,
  };
}

const ITEM_SELECT =
  "id, order_id, photo_id, photo_slug, photo_title, size_id, size_label, paper_id, paper_name, quantity, unit_price_cents, edition_number, edition_total, print_file_url_snapshot, photos ( id, reference_number, image_url, image_alt, print_file_key )";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Fetch an order's items with enough joined-photo metadata to render the
 * dispatch page. Ordered by creation so the UI is stable across reloads.
 */
export async function getDispatchItemsForOrder(orderId: string): Promise<DispatchItem[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select(ITEM_SELECT)
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`getDispatchItemsForOrder(${orderId}) failed: ${error.message}`);
  }
  const rows = (data ?? []) as unknown as OrderItemJoinRow[];
  return rows.map(rowToDispatchItem);
}

/**
 * Resolve `{orderId, printFileKey, orderItem}` from an order_item id - used
 * by the print-file redirect route to verify the token's order matches the
 * item and to know which R2 key to sign.
 */
export async function getDispatchItemById(orderItemId: string): Promise<DispatchItem | null> {
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select(ITEM_SELECT)
    .eq("id", orderItemId)
    .maybeSingle();
  if (error) {
    throw new Error(`getDispatchItemById(${orderItemId}) failed: ${error.message}`);
  }
  if (!data) return null;
  return rowToDispatchItem(data as unknown as OrderItemJoinRow);
}

// ---------------------------------------------------------------------------
// Multi-order (batch page)
// ---------------------------------------------------------------------------

/**
 * Fetch items for a list of orders in one round trip. Returns a map keyed
 * by order id.
 */
export async function getDispatchItemsForOrders(
  orderIds: string[]
): Promise<Map<string, DispatchItem[]>> {
  const byOrder = new Map<string, DispatchItem[]>();
  if (orderIds.length === 0) return byOrder;
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select(ITEM_SELECT)
    .in("order_id", orderIds)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`getDispatchItemsForOrders failed: ${error.message}`);
  }
  const rows = (data ?? []) as unknown as OrderItemJoinRow[];
  for (const r of rows) {
    const list = byOrder.get(r.order_id) ?? [];
    list.push(rowToDispatchItem(r));
    byOrder.set(r.order_id, list);
  }
  return byOrder;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Record the signed URL Rob received for an item. Appended to audit-only;
 * if the write fails we log but don't raise - the redirect has already
 * succeeded by the time this is called.
 */
export async function recordPrintFileUrlSnapshot(orderItemId: string, url: string): Promise<void> {
  const db = serverClient();
  const { error } = await db
    .from("order_items")
    .update({ print_file_url_snapshot: url })
    .eq("id", orderItemId);
  if (error) {
    console.error(`recordPrintFileUrlSnapshot(${orderItemId}) failed: ${error.message}`);
  }
}

/**
 * Persist tracking details on an order. Kept here (not in Track A's
 * orders.ts) so Track D's flow is self-contained. Track A can consolidate
 * later if desired.
 */
export async function updateOrderTracking(
  orderId: string,
  fields: {
    trackingNumber: string;
    carrier: string;
    notes?: string | null;
  }
): Promise<void> {
  const db = serverClient();
  const payload: Record<string, unknown> = {
    tracking_number: fields.trackingNumber,
    carrier: fields.carrier,
  };
  if (fields.notes !== undefined) {
    payload.notes = fields.notes;
  }
  const { error } = await db.from("orders").update(payload).eq("id", orderId);
  if (error) {
    throw new Error(`updateOrderTracking(${orderId}) failed: ${error.message}`);
  }
}

/**
 * Derive the list of orders visible on the batch dispatch page: every order
 * currently in Loupe's pipeline — `queued_for_print` (batch sent, not yet
 * acknowledged) or `sent_to_print` (Michael has pressed "Mark as sent").
 * Newest first.
 *
 * Includes `parent_order_id` so the batch page can flag reprints inline the
 * same way the PrintBatch email does.
 */
export async function listPendingDispatchOrders(): Promise<Order[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("orders")
    .select(
      "id, created_at, stripe_checkout_session_id, stripe_payment_intent_id, customer_email, customer_name, shipping_address, subtotal_cents, tax_cents, shipping_cents, total_cents, currency, status, fulfillment_token, fulfillment_token_revoked_at, print_job_email_sent_at, tracking_number, carrier, notes, parent_order_id"
    )
    .in("status", ["queued_for_print", "sent_to_print"])
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(`listPendingDispatchOrders failed: ${error.message}`);
  }
  type Row = {
    id: string;
    created_at: string;
    stripe_checkout_session_id: string;
    stripe_payment_intent_id: string | null;
    customer_email: string;
    customer_name: string;
    shipping_address: unknown;
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
  const rows = (data ?? []) as Row[];
  return rows.map((r): Order => {
    const addr = r.shipping_address as Record<string, unknown> | null;
    const need = (k: string): string => {
      const v = addr?.[k];
      return typeof v === "string" ? v : "";
    };
    const opt = (k: string): string | null => {
      const v = addr?.[k];
      return typeof v === "string" ? v : null;
    };
    const status = r.status as Order["status"];
    return {
      id: r.id,
      createdAt: r.created_at,
      stripeCheckoutSessionId: r.stripe_checkout_session_id,
      stripePaymentIntentId: r.stripe_payment_intent_id,
      customerEmail: r.customer_email,
      customerName: r.customer_name,
      shippingAddress: {
        name: need("name"),
        line1: need("line1"),
        line2: opt("line2"),
        city: need("city"),
        state: opt("state"),
        postalCode: need("postalCode"),
        country: need("country"),
      },
      subtotalCents: r.subtotal_cents,
      taxCents: r.tax_cents,
      shippingCents: r.shipping_cents,
      totalCents: r.total_cents,
      currency: r.currency,
      status,
      fulfillmentToken: r.fulfillment_token,
      fulfillmentTokenRevokedAt: r.fulfillment_token_revoked_at,
      printJobEmailSentAt: r.print_job_email_sent_at,
      trackingNumber: r.tracking_number,
      carrier: r.carrier,
      notes: r.notes,
      parentOrderId: r.parent_order_id,
    };
  });
}
