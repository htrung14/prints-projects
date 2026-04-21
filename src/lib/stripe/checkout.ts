/**
 * Stripe Checkout Session builder.
 *
 * Server-only. Called by `POST /api/checkout`.
 *
 * Design decisions (per docs-ai/backend-plan.md §"Locked decisions" and the
 * Track B brief):
 * - Hosted Stripe Checkout (ui_mode defaults to `hosted`)
 * - Stripe Tax ON (`automatic_tax.enabled = true`)  ← satisfies Pastel #5 "auto tax"
 * - Guest checkout only - no `customer` param
 * - Currency: USD. Adaptive Pricing is a dashboard-level setting.
 * - Shipping address collected by Stripe (not pre-filled from us) ← Pastel #5 "shipping at checkout"
 * - Flat-rate shipping: $20 domestic, $45 international
 * - `cart_lines_json` stored on session metadata so the webhook can rebuild
 *   the cart server-side without trusting the Stripe line-item echo.
 *
 * Pastel #5 (2026-04-20) - "all prices are $300 + add the stripe fee and
 * auto tax + shipping at check out":
 *  - $300 flat base price: applied via fixture (basePriceCents = 30000,
 *    paper surcharges 0). See src/data/photos.fixture.json.
 *  - Auto tax: already wired (automatic_tax.enabled = true).
 *  - Shipping at checkout: already wired (shipping_address_collection +
 *    shipping_options).
 *  - Stripe fee pass-through: NOT YET IMPLEMENTED. Two common patterns:
 *      (a) Add a "Processing fee" line_item computed as
 *          ceil((subtotal + shipping) * 0.029 + 30) cents. This is legal
 *          in most US states but check your merchant agreement; some
 *          jurisdictions (e.g. CA, NY) regulate surcharging.
 *      (b) Raise the base price to absorb the fee server-side
 *          (baseCents + ceil(baseCents * 0.029 + 30)) and keep the
 *          displayed $300 unchanged.
 *    Decision pending from client. Once chosen, add a `stripeFeeLineItem()`
 *    helper and push it into lineItems before session create. Do not call
 *    both `automatic_tax` and a self-computed fee on the SAME line item -
 *    Stripe Tax would tax the fee, which you almost certainly don't want.
 *    Attach the fee as its own line_item with `tax_code: 'txcd_00000000'`
 *    (non-taxable) if going with (a).
 */

import "server-only";
import type Stripe from "stripe";
import type { CartLine, Photo } from "@/lib/types";
import { priceCents } from "@/lib/pricing";
import { getPhotoBySlug as getPhotoFromFixture } from "@/lib/photos";
import { stripeClient } from "./client";

// ---------------------------------------------------------------------------
// Stripe type aliases
//
// Stripe's SDK exposes `Stripe.Checkout.SessionCreateParams` as a type alias
// rather than a namespace, which means you can't walk its sub-namespaces via
// dotted type access (`SessionCreateParams.ShippingAddressCollection.AllowedCountry`).
// Indexed-access types are the portable workaround - and they re-follow
// future type changes in the SDK.
// ---------------------------------------------------------------------------
type SessionCreateParams = Stripe.Checkout.SessionCreateParams;
type AllowedCountry = NonNullable<
  SessionCreateParams["shipping_address_collection"]
>["allowed_countries"][number];
type ShippingOptionParam = NonNullable<SessionCreateParams["shipping_options"]>[number];
type LineItemParam = NonNullable<SessionCreateParams["line_items"]>[number];

// ---------------------------------------------------------------------------
// Configuration constants - promoted to module scope so adding a country or
// tweaking the shipping fallback is a one-line edit.
// ---------------------------------------------------------------------------

/**
 * Countries Stripe Checkout will offer in the shipping address collection.
 * Start: US, plus common international art-collector markets. Expand freely.
 * Two-letter ISO 3166-1 alpha-2 codes.
 */
export const ALLOWED_COUNTRIES: ReadonlyArray<AllowedCountry> = [
  "US",
  "CA",
  "GB",
  "AU",
  "DE",
  "FR",
  "NL",
];

/**
 * Stripe Tax product code used on inline `product_data`. `txcd_99999999`
 * ("general services") is a safe generic fallback; Stripe Tax reclassifies
 * based on your Tax Dashboard category rules at calculation time.
 */
const TAX_CODE_FALLBACK = "txcd_99999999";

const FALLBACK_DOMESTIC_CENTS = 2000; // $20 US
const FALLBACK_INTL_CENTS = 4500; // $45 international

// ---------------------------------------------------------------------------
// Line-item construction
// ---------------------------------------------------------------------------

export type ResolvedCartLine = {
  line: CartLine;
  photo: Photo;
  sizeLabel: string;
  paperName: string;
  unitPriceCents: number;
};

function dedupeCartLines(lines: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of lines) {
    const key = `${line.photoSlug}::${line.sizeId}::${line.paperId}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      map.set(key, { ...line });
    }
  }
  return Array.from(map.values());
}

/**
 * Resolve each incoming cart line against the catalog and compute the
 * server-side unit price. Throws on any line that references an unknown
 * photo/size/paper so we never accidentally charge the customer $0.
 *
 * Used both by session creation and the webhook (defence in depth - the
 * webhook recomputes prices from slugs, never trusting Stripe's echoed
 * `unit_amount`).
 */
export async function resolveCartLines(lines: CartLine[]): Promise<ResolvedCartLine[]> {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("resolveCartLines: cart must contain at least one line");
  }

  // Dedupe: aggregate quantities for identical (photoSlug, sizeId, paperId) combos
  const deduped = dedupeCartLines(lines);

  const resolved: ResolvedCartLine[] = [];
  for (const line of deduped) {
    if (typeof line.photoSlug !== "string" || !line.photoSlug) {
      throw new Error("resolveCartLines: missing photoSlug");
    }
    if (typeof line.sizeId !== "string" || !line.sizeId) {
      throw new Error(`resolveCartLines: missing sizeId on ${line.photoSlug}`);
    }
    if (typeof line.paperId !== "string" || !line.paperId) {
      throw new Error(`resolveCartLines: missing paperId on ${line.photoSlug}`);
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > 10) {
      throw new Error(
        `resolveCartLines: quantity must be 1-10 per photo (got ${line.quantity} on ${line.photoSlug})`
      );
    }

    const photo = getPhotoFromFixture(line.photoSlug) ?? null;
    if (!photo) {
      throw new Error(`resolveCartLines: unknown photo ${line.photoSlug}`);
    }

    const size = photo.sizes.find((s) => s.id === line.sizeId);
    if (!size) {
      throw new Error(`resolveCartLines: unknown sizeId ${line.sizeId} for ${line.photoSlug}`);
    }
    const paper = photo.papers.find((p) => p.id === line.paperId);
    if (!paper) {
      throw new Error(`resolveCartLines: unknown paperId ${line.paperId} for ${line.photoSlug}`);
    }

    const unitPriceCents = priceCents(photo, line.sizeId, line.paperId);

    resolved.push({
      line,
      photo,
      sizeLabel: size.label,
      paperName: paper.name,
      unitPriceCents,
    });
  }
  return resolved;
}

function buildLineItem(r: ResolvedCartLine): LineItemParam {
  const { line, photo, sizeLabel, paperName, unitPriceCents } = r;

  // Product description carries human-readable variant info; metadata carries
  // the stable IDs the webhook needs to reconcile without re-parsing text.
  const description = `${sizeLabel} · ${paperName} · Edition of ${photo.editionTotal}`;

  return {
    quantity: line.quantity,
    price_data: {
      currency: "usd",
      unit_amount: unitPriceCents,
      product_data: {
        name: `${photo.title}${photo.titleItalic ? ` ${photo.titleItalic}` : ""} (${photo.referenceNumber})`,
        description,
        tax_code: TAX_CODE_FALLBACK,
        metadata: {
          photoSlug: photo.slug,
          photoId: photo.id ?? "",
          sizeId: line.sizeId,
          paperId: line.paperId,
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Shipping-options builder
// ---------------------------------------------------------------------------

/**
 * Build the `shipping_options` array for this session.
 *
 * Two flat-rate options: $20 domestic (US), $45 international.
 */
function buildShippingOptions(lines: CartLine[]): ShippingOptionParam[] {
  const options: ShippingOptionParam[] = [];

  options.push({
    shipping_rate_data: {
      type: "fixed_amount",
      fixed_amount: {
        amount: FALLBACK_DOMESTIC_CENTS,
        currency: "usd",
      },
      display_name: "Standard shipping (US)",
      tax_behavior: "exclusive",
    },
  });
  options.push({
    shipping_rate_data: {
      type: "fixed_amount",
      fixed_amount: {
        amount: FALLBACK_INTL_CENTS,
        currency: "usd",
      },
      display_name: "International shipping",
      tax_behavior: "exclusive",
    },
  });

  // Stripe caps at 5 shipping_options per session.
  return options.slice(0, 5);
}

// ---------------------------------------------------------------------------
// URL builders
// ---------------------------------------------------------------------------

/**
 * Derive the site's absolute origin for success/cancel URLs. Order of
 * precedence:
 *   1. Explicit `NEXT_PUBLIC_APP_URL` (preferred; set in prod + preview)
 *   2. Vercel's auto-injected `VERCEL_URL` (deploy previews)
 *   3. Local dev fallback
 */
function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export type CreateCheckoutSessionArgs = {
  lines: CartLine[];
  /** Optional override for success/cancel origin (e.g. during tests). */
  origin?: string;
};

/**
 * Create a Stripe Checkout Session for the given cart.
 *
 * Returns the Session object (caller extracts `url`). Callers should treat
 * any thrown error as a 4xx (unknown slug, empty cart, invalid quantity) and
 * let Stripe-SDK errors surface as 5xx.
 */
export async function createCheckoutSession(
  args: CreateCheckoutSessionArgs
): Promise<Stripe.Checkout.Session> {
  const resolved = await resolveCartLines(args.lines);

  const lineItems = resolved.map(buildLineItem);

  const printSubtotalCents = resolved.reduce(
    (sum, r) => sum + r.unitPriceCents * r.line.quantity,
    0
  );
  const processingFeeCents = Math.ceil(printSubtotalCents * 0.03);
  lineItems.push({
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: processingFeeCents,
      product_data: {
        name: "Processing fee (3%)",
        tax_code: "txcd_00000000",
      },
    },
  });

  const shippingOptions = buildShippingOptions(args.lines);

  const origin = args.origin ?? siteOrigin();
  const successUrl = `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/checkout`;

  const params: SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: false },
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    shipping_address_collection: {
      allowed_countries: [...ALLOWED_COUNTRIES],
    },
    shipping_options: shippingOptions,
    // Guest checkout: don't pass `customer`. Stripe groups sessions under a
    // "guest customer" entity in the dashboard without us creating a
    // permanent Customer record.
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: (() => {
      const cartJson = JSON.stringify(args.lines);
      if (cartJson.length > 490) {
        throw new Error(
          `resolveCartLines: cart too large for Stripe metadata (${cartJson.length} chars). Max 25 unique prints.`
        );
      }
      return { cart_lines_json: cartJson };
    })(),
  };

  const stripe = stripeClient();
  return stripe.checkout.sessions.create(params);
}
