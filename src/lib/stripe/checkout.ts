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
 * - Shipping: 4-tier regional (US free, CA $35, EU/UK $50, AU/ROW $65)
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
 * Split into four tiers because Stripe hosted Checkout cannot restrict
 * shipping_options per country — we pre-select the correct rate on our own
 * /checkout page (destination picker) and narrow `allowed_countries` to the
 * matching tier's subset before creating the session.
 *
 * Two-letter ISO 3166-1 alpha-2 codes. Tier rates are calibrated to real
 * USPS/FedEx NYC-origin estimates (see docs-ai/shipping-model.md).
 */
export const US_COUNTRIES: ReadonlyArray<AllowedCountry> = ["US"];
export const CA_COUNTRIES: ReadonlyArray<AllowedCountry> = ["CA"];
export const EU_UK_COUNTRIES: ReadonlyArray<AllowedCountry> = [
  "GB",
  "IE",
  "DE",
  "FR",
  "NL",
  "BE",
  "LU",
  "IT",
  "ES",
  "PT",
  "AT",
  "DK",
  "SE",
  "FI",
  "NO",
  "CH",
  "IS",
  "PL",
  "CZ",
  "GR",
  "HU",
  "SK",
  "SI",
  "HR",
  "EE",
  "LV",
  "LT",
  "RO",
  "BG",
  "CY",
  "MT",
];
export const AU_ROW_COUNTRIES: ReadonlyArray<AllowedCountry> = [
  "AU",
  "NZ",
  "JP",
  "SG",
  "HK",
  "KR",
  "TW",
  "TH",
  "MY",
  "IL",
  "AE",
  "SA",
  "MX",
  "BR",
  "AR",
  "CL",
  "CO",
  "ZA",
  "IN",
  "PH",
];

/**
 * @deprecated Prefer the per-tier country arrays. Kept as the flattened
 * aggregate for legacy doc/tooling references. No runtime callers.
 */
export const ALLOWED_COUNTRIES: ReadonlyArray<AllowedCountry> = [
  ...US_COUNTRIES,
  ...CA_COUNTRIES,
  ...EU_UK_COUNTRIES,
  ...AU_ROW_COUNTRIES,
];

export type ShippingDestination = "US" | "CA" | "EU_UK" | "AU_ROW";

/**
 * Stripe Tax product code used on inline `product_data`. `txcd_99999999`
 * ("general services") is a safe generic fallback; Stripe Tax reclassifies
 * based on your Tax Dashboard category rules at calculation time.
 */
const TAX_CODE_FALLBACK = "txcd_99999999";

// Per-tier shipping rates in USD cents.
const SHIPPING_CENTS_US = 1000; // $10 US
const SHIPPING_CENTS_CA = 3500; // $35 Canada
const SHIPPING_CENTS_EU_UK = 5000; // $50 UK + EU
const SHIPPING_CENTS_AU_ROW = 6500; // $65 Australia + rest of world

/**
 * Map a destination tier to its country list.
 */
function countriesForDestination(destination: ShippingDestination): ReadonlyArray<AllowedCountry> {
  switch (destination) {
    case "US":
      return US_COUNTRIES;
    case "CA":
      return CA_COUNTRIES;
    case "EU_UK":
      return EU_UK_COUNTRIES;
    case "AU_ROW":
      return AU_ROW_COUNTRIES;
  }
}

/**
 * Map an ISO2 country code to its shipping tier. Returns null when we don't
 * ship to that country (caller must 4xx before reaching session creation).
 */
export function tierForCountry(country: string): ShippingDestination | null {
  const c = country.toUpperCase();
  if ((US_COUNTRIES as ReadonlyArray<string>).includes(c)) return "US";
  if ((CA_COUNTRIES as ReadonlyArray<string>).includes(c)) return "CA";
  if ((EU_UK_COUNTRIES as ReadonlyArray<string>).includes(c)) return "EU_UK";
  if ((AU_ROW_COUNTRIES as ReadonlyArray<string>).includes(c)) return "AU_ROW";
  return null;
}

/**
 * Expected shipping cents for a given ISO2 country code. Used by the webhook
 * as defence-in-depth to detect under-payment (e.g. a session somehow
 * completed with a mismatched country/rate).
 *
 * Unknown country → return the highest tier (AU_ROW / $65). Biases the guard
 * toward "alert on mismatch" rather than silently accepting under-payment.
 */
export function expectedShippingCentsFor(country: string): number {
  const tier = tierForCountry(country);
  switch (tier) {
    case "US":
      return SHIPPING_CENTS_US;
    case "CA":
      return SHIPPING_CENTS_CA;
    case "EU_UK":
      return SHIPPING_CENTS_EU_UK;
    case "AU_ROW":
      return SHIPPING_CENTS_AU_ROW;
    case null:
      return SHIPPING_CENTS_AU_ROW;
  }
}

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
 * Build the `shipping_options` array for this session. Exactly one option per
 * session, matching the tier the customer selected on /checkout:
 *   - "US"     → $0   (free)
 *   - "CA"     → $35  (Canada)
 *   - "EU_UK"  → $50  (United Kingdom & EU)
 *   - "AU_ROW" → $65  (Australia & rest of world)
 *
 * The webhook (src/lib/stripe/webhook.ts) re-checks shipping_cents against
 * `expectedShippingCentsFor(country)` as defence-in-depth.
 */
function buildShippingOptions(destination: ShippingDestination): ShippingOptionParam[] {
  switch (destination) {
    case "US":
      return [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_CENTS_US, currency: "usd" },
            display_name: "United States — $10",
            tax_behavior: "exclusive",
          },
        },
      ];
    case "CA":
      return [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_CENTS_CA, currency: "usd" },
            display_name: "Canada — $35",
            tax_behavior: "exclusive",
          },
        },
      ];
    case "EU_UK":
      return [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_CENTS_EU_UK, currency: "usd" },
            display_name: "United Kingdom & EU — $50",
            tax_behavior: "exclusive",
          },
        },
      ];
    case "AU_ROW":
      return [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_CENTS_AU_ROW, currency: "usd" },
            display_name: "Australia & rest of world — $65",
            tax_behavior: "exclusive",
          },
        },
      ];
  }
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
  /**
   * ISO 3166-1 alpha-2 country code the buyer selected on /checkout. Used to
   * derive the shipping tier, narrow `allowed_countries`, and pick the single
   * matching shipping rate. Required for non-test carts; ignored for the
   * hidden `test-1-dollar` flow. Throws if the country is not in any tier.
   */
  country?: string;
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

  // Guard: unpublished photos (test item, hidden sold-out items) must not be
  // mixed with regular prints in a single cart. The test-cart branch below
  // grants a flat $1 price + no shipping collection, so a mixed cart would
  // effectively smuggle a real print through that branch. We only permit
  // unpublished items when the *entire* cart is unpublished.
  const hasUnpublished = resolved.some((r) => r.photo.isPublished === false);
  const allUnpublished = resolved.every((r) => r.photo.isPublished === false);
  if (hasUnpublished && !allUnpublished) {
    throw new Error(
      "resolveCartLines: cart mixes unpublished items with regular items. Split into separate carts."
    );
  }

  const lineItems = resolved.map(buildLineItem);

  // Test-mode cart: only the hidden `test-1-dollar` item is present.
  // Skip processing fee and shipping so the charge is a clean flat $1.
  const isTestCart =
    resolved.length > 0 && resolved.every((r) => r.line.photoSlug === "test-1-dollar");

  if (!isTestCart) {
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
  }

  // Derive the tier from the buyer's country. Test cart skips this entirely.
  // Default to "US" ONLY for test carts, where shipping is suppressed anyway.
  let shippingOptions: ShippingOptionParam[] | undefined;
  let allowedCountries: ReadonlyArray<AllowedCountry> = US_COUNTRIES;
  if (!isTestCart) {
    if (!args.country) {
      throw new Error("createCheckoutSession: country is required for non-test carts");
    }
    const tier = tierForCountry(args.country);
    if (!tier) {
      throw new Error(
        `createCheckoutSession: we don't currently ship to ${args.country.toUpperCase()}`
      );
    }
    shippingOptions = buildShippingOptions(tier);
    allowedCountries = [args.country.toUpperCase() as AllowedCountry];
  }

  const origin = args.origin ?? siteOrigin();
  const successUrl = `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/checkout`;

  const params: SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    // Tax: off for launch — no NY Certificate of Authority yet, and this
    // limited edition stays well under NY's economic-nexus thresholds.
    // Re-enable once the studio registers with NY state.
    automatic_tax: { enabled: false },
    tax_id_collection: { enabled: false },
    billing_address_collection: "required",
    phone_number_collection: { enabled: !isTestCart },
    ...(isTestCart
      ? {}
      : {
          shipping_address_collection: {
            allowed_countries: [...allowedCountries],
          },
          shipping_options: shippingOptions,
        }),
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
