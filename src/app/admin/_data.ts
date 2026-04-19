/**
 * Admin-only read helpers.
 *
 * Track A's query helpers cover the happy path for the public/webhook flow
 * (listOrders, getOrderById, audit write). The admin UI also needs to read
 * `order_items` per order and paged/filtered `audit_log` entries. Rather
 * than extending `src/lib/supabase/queries/*` (Track A territory), we read
 * those directly through the service-role client from admin-only code.
 *
 * If these helpers outgrow the admin area they should graduate into
 * `src/lib/supabase/queries/` so the Stripe webhook and Track C can share
 * them.
 */

import "server-only";
import type { AuditLogEntry, OrderItem } from "@/lib/types";
import { serverClient } from "@/lib/supabase/server";

const ORDER_ITEM_COLUMNS =
  "id, created_at, order_id, photo_id, photo_slug, photo_title, size_id, size_label, paper_id, paper_name, quantity, unit_price_cents, edition_number, edition_total, print_file_url_snapshot";

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

export async function listOrderItems(orderId: string): Promise<OrderItem[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select(ORDER_ITEM_COLUMNS)
    .eq("order_id", orderId)
    .order("edition_number", { ascending: true });
  if (error) {
    throw new Error(`listOrderItems(${orderId}) failed: ${error.message}`);
  }
  return (data ?? []).map((r) => rowToOrderItem(r as OrderItemRow));
}

type AuditRow = {
  id: string;
  created_at: string;
  order_id: string | null;
  actor: string;
  action: string;
  meta: unknown;
};

function rowToAudit(row: AuditRow): AuditLogEntry {
  const meta =
    typeof row.meta === "object" && row.meta !== null ? (row.meta as Record<string, unknown>) : {};
  return {
    id: row.id,
    createdAt: row.created_at,
    orderId: row.order_id,
    actor: row.actor,
    action: row.action,
    meta,
  };
}

export async function listAuditEntries(opts: {
  orderId?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const db = serverClient();
  let q = db
    .from("audit_log")
    .select("id, created_at, order_id, actor, action, meta")
    .order("created_at", { ascending: false });
  if (opts.orderId) q = q.eq("order_id", opts.orderId);
  if (typeof opts.limit === "number" && opts.limit > 0) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) {
    throw new Error(`listAuditEntries failed: ${error.message}`);
  }
  return (data ?? []).map((r) => rowToAudit(r as AuditRow));
}

// -----------------------------------------------------------------------------
// Photos: admin reads + writes
// -----------------------------------------------------------------------------

export type PhotoAdminRow = {
  id: string;
  slug: string;
  referenceNumber: string;
  title: string;
  titleItalic: string | null;
  subtitle: string | null;
  year: number;
  description: string[];
  imageUrl: string;
  imageAlt: string;
  basePriceCents: number;
  sizes: unknown;
  papers: unknown;
  editionTotal: number;
  editionSold: number;
  isPublished: boolean;
  sortOrder: number;
  printFileKey: string | null;
};

const PHOTO_COLUMNS =
  "id, slug, reference_number, title, title_italic, subtitle, year, description, image_url, image_alt, base_price_cents, sizes, papers, edition_total, edition_sold, is_published, sort_order, print_file_key";

type PhotoDbRow = {
  id: string;
  slug: string;
  reference_number: string;
  title: string;
  title_italic: string | null;
  subtitle: string | null;
  year: number;
  description: unknown;
  image_url: string;
  image_alt: string;
  base_price_cents: number;
  sizes: unknown;
  papers: unknown;
  edition_total: number;
  edition_sold: number;
  is_published: boolean;
  sort_order: number;
  print_file_key: string | null;
};

function descToArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((p): p is string => typeof p === "string");
}

function rowToPhotoAdmin(row: PhotoDbRow): PhotoAdminRow {
  return {
    id: row.id,
    slug: row.slug,
    referenceNumber: row.reference_number,
    title: row.title,
    titleItalic: row.title_italic,
    subtitle: row.subtitle,
    year: row.year,
    description: descToArray(row.description),
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    basePriceCents: row.base_price_cents,
    sizes: row.sizes,
    papers: row.papers,
    editionTotal: row.edition_total,
    editionSold: row.edition_sold,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    printFileKey: row.print_file_key,
  };
}

export async function listAllPhotosForAdmin(): Promise<PhotoAdminRow[]> {
  const db = serverClient();
  const { data, error } = await db
    .from("photos")
    .select(PHOTO_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(`listAllPhotosForAdmin failed: ${error.message}`);
  }
  return (data ?? []).map((r) => rowToPhotoAdmin(r as PhotoDbRow));
}

export async function getPhotoForAdmin(id: string): Promise<PhotoAdminRow | null> {
  const db = serverClient();
  const { data, error } = await db.from("photos").select(PHOTO_COLUMNS).eq("id", id).maybeSingle();
  if (error) {
    throw new Error(`getPhotoForAdmin(${id}) failed: ${error.message}`);
  }
  return data ? rowToPhotoAdmin(data as PhotoDbRow) : null;
}

export async function updatePhotoAdmin(id: string, patch: Record<string, unknown>): Promise<void> {
  const db = serverClient();
  const { error } = await db.from("photos").update(patch).eq("id", id);
  if (error) {
    throw new Error(`updatePhotoAdmin(${id}) failed: ${error.message}`);
  }
}

// -----------------------------------------------------------------------------
// Orders: admin-only mutations not covered by Track A's updateOrderStatus.
// -----------------------------------------------------------------------------

export async function updateOrderFields(
  id: string,
  patch: {
    tracking_number?: string | null;
    carrier?: string | null;
    notes?: string | null;
    fulfillment_token?: string;
    fulfillment_token_revoked_at?: string | null;
    print_job_email_sent_at?: string | null;
  }
): Promise<void> {
  const db = serverClient();
  const { error } = await db.from("orders").update(patch).eq("id", id);
  if (error) {
    throw new Error(`updateOrderFields(${id}) failed: ${error.message}`);
  }
}
