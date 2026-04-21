/**
 * Core domain types for the print shop.
 * Mirrors the data model in docs/system-design.md Section 6.
 *
 * Changes applied for backend build (2026-04-16 decisions):
 * - Dropped "bamboo" paper (Hai: 2 flat papers only - Photo Rag Baryta + Canson Baryta Photographique)
 * - Flat per-photo pricing - paper surcharge remains on the type for fixture compatibility but
 *   real seed sets all paper surcharges to 0.
 * - All order/fulfillment types added for backend tracks.
 */

// -----------------------------------------------------------------------------
// Catalog (existing, used by frontend + admin photo CRUD)
// -----------------------------------------------------------------------------

// Note: retained "photo-rag" | "baryta" for backwards-compat with existing
// fixture/components. New code should prefer the string-typed paperId and only
// match on values returned from Supabase.
export type PaperType = "photo-rag" | "baryta" | "bamboo";

export type PaperOption = {
  id: PaperType;
  name: string; // display name, e.g. "Hahnemühle Photo Rag Baryta"
  surchargeCents: number; // added to base price; expected 0 under flat pricing
};

export type SizeOption = {
  id: string; // e.g. "8x10"
  label: string; // e.g. "8 × 10 in"
  multiplier: number; // base price × multiplier = size price (before paper)
};

export type Photo = {
  slug: string;
  referenceNumber: string; // e.g. "AT-001"
  title: string;
  titleItalic?: string;
  subtitle?: string;
  year: number;
  description: string[];
  imageUrl: string;
  imageAlt: string;
  basePriceCents: number;
  sizes: SizeOption[];
  papers: PaperOption[];
  editionTotal: number;
  editionSold: number;
  // Added for backend:
  id?: string; // uuid, populated when loaded from Supabase
  isPublished?: boolean;
  sortOrder?: number;
  printFileKey?: string; // R2 object key for master print file
};

export type CartLine = {
  photoSlug: string;
  sizeId: string;
  paperId: PaperType;
  quantity: number;
};

// -----------------------------------------------------------------------------
// Orders & fulfillment (new - consumed by Stripe, emails, dispatch, admin)
// -----------------------------------------------------------------------------

/**
 * Order status enum. **Drop-ship model (2026-04-16):**
 * Michael at Loupe Digital ships direct to the customer. No in-person pickup step.
 *
 * paid          → webhook received, order persisted
 * sent_to_print → Printer opened the dispatch link (auto-set on first fulfillment-page visit)
 * printed       → (optional) Printer marks printed before shipping
 * shipped       → Printer submits tracking on the dispatch page
 * delivered     → (optional) carrier webhook or manual set
 * refunded      → Stripe refund processed via admin
 * cancelled     → pre-ship cancellation
 */
export type OrderStatus =
  | "paid"
  | "queued_for_print"
  | "sent_to_print"
  | "printed"
  | "shipped"
  | "delivered"
  | "refunded"
  | "cancelled";

export type Address = {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null; // state/region (US: state code; intl: region)
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
};

export type Order = {
  id: string; // uuid
  createdAt: string; // ISO
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: Address;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string; // "usd"
  status: OrderStatus;
  fulfillmentToken: string; // 64-char url-safe random
  fulfillmentTokenRevokedAt: string | null;
  printJobEmailSentAt: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  notes: string | null; // internal
  /**
   * When set, this order is a reprint/reship of another order (damage, lost
   * in transit, etc.). Reprints are modelled as a new order row with
   * status='paid' so they flow through the normal batch-dispatch pipeline.
   * Optional on the type so existing row→Order mappers (admin list page,
   * dispatch batch) don't need synchronous updates to satisfy typecheck.
   */
  parentOrderId?: string | null;
};

export type OrderItem = {
  id: string; // uuid
  orderId: string;
  photoId: string; // fk to photos.id
  photoSlug: string; // denormalized for audit
  photoTitle: string; // denormalized for audit
  sizeId: string;
  sizeLabel: string; // denormalized
  paperId: string;
  paperName: string; // denormalized
  quantity: number;
  unitPriceCents: number;
  editionNumber: number; // 1..10, assigned at webhook time via row lock
  editionTotal: number;
  printFileUrlSnapshot: string | null; // signed URL the printer got (for audit)
};

// -----------------------------------------------------------------------------
// Dispatch (printer's magic link)
// -----------------------------------------------------------------------------

export type DispatchTokenPayload = {
  orderId: string; // order uuid
  kind: "single" | "batch"; // single-order page or weekly batch digest
  exp: number; // unix seconds
};

// -----------------------------------------------------------------------------
// Audit
// -----------------------------------------------------------------------------

export type AuditLogEntry = {
  id: string;
  createdAt: string;
  orderId: string | null;
  actor: string; // email or "system" or "stripe_webhook"
  action: string; // e.g. "status_change", "token_revoked", "email_sent"
  meta: Record<string, unknown>;
};
