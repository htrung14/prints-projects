/**
 * Unit tests for the 4-tier shipping-mismatch guard inside
 * `handleCheckoutSessionCompleted`.
 *
 * The UI picker + `allowed_countries` narrowing should already prevent a
 * buyer from paying the US (free) rate and shipping to e.g. Canada, but
 * Stripe's hosted page lets the address be edited in some edge cases. The
 * guard re-derives the expected shipping cost from the *actual* country on
 * the completed session and fires `alertSystemError("shipping/country
 * mismatch", ...)` when the buyer under-paid. These tests lock that
 * defence-in-depth behaviour in place.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock external dependencies before imports ---
vi.mock("server-only", () => ({}));

// Stripe SDK: not exercised by handleCheckoutSessionCompleted, stub anyway.
vi.mock("@/lib/stripe/client", () => ({
  stripeClient: () => ({
    checkout: { sessions: { create: vi.fn() } },
  }),
}));

const mockGetPhotoBySlug = vi.fn();
vi.mock("@/lib/supabase/queries/photos", () => ({
  getPhotoBySlug: (...args: unknown[]) => mockGetPhotoBySlug(...args),
}));

const mockInsertOrderWithItems = vi.fn();
const mockInsertRefundedStub = vi.fn();
vi.mock("@/lib/supabase/queries/orders", () => ({
  insertOrderWithItems: (...args: unknown[]) => mockInsertOrderWithItems(...args),
  insertRefundedStub: (...args: unknown[]) => mockInsertRefundedStub(...args),
}));

const mockSendOrderConfirmation = vi.fn().mockResolvedValue(undefined);
const mockSendPrintJobEmail = vi.fn().mockResolvedValue(undefined);
const mockSchedulePostPurchaseSequence = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/email/send", () => ({
  sendOrderConfirmation: (...args: unknown[]) => mockSendOrderConfirmation(...args),
  sendPrintJobEmail: (...args: unknown[]) => mockSendPrintJobEmail(...args),
  schedulePostPurchaseSequence: (...args: unknown[]) => mockSchedulePostPurchaseSequence(...args),
}));

vi.mock("@/lib/dispatch/url", () => ({
  buildDispatchUrl: () => "https://example.com/dispatch/test-token",
}));

const mockAudit = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/supabase/queries/audit", () => ({
  audit: (...args: unknown[]) => mockAudit(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  serverClient: () => ({}),
}));

// Keep post-order alerts quiet so they don't confuse call-count assertions.
vi.mock("@/lib/alerting/webhook-alerts", () => ({
  alertAfterOrder: vi.fn().mockResolvedValue(undefined),
  alertWebhookFailure: vi.fn().mockResolvedValue(undefined),
}));

// The assertion target: route every `alertSystemError` call through a spy so
// we can inspect call counts and the `(context, error)` pair. We preserve the
// rest of the dispatcher module so `alertSafely` (and anything else the
// webhook imports) still behaves normally.
const mockAlertSystemError = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/alerting/dispatcher", async () => {
  const actual = await vi.importActual<typeof import("@/lib/alerting/dispatcher")>(
    "@/lib/alerting/dispatcher"
  );
  return {
    ...actual,
    alertSystemError: (...args: unknown[]) => mockAlertSystemError(...args),
  };
});

// --- Import after mocks ---
import type Stripe from "stripe";
import { handleCheckoutSessionCompleted } from "@/lib/stripe/webhook";
import type { Photo, CartLine } from "@/lib/types";

// --- Fixtures ---
const FIXTURE_PHOTO: Photo = {
  id: "photo-001",
  slug: "north-lebanon-oct-2020",
  referenceNumber: "AT-025",
  title: "North Lebanon (4), October 2020",
  year: 2020,
  description: ["Archival pigment print"],
  imageUrl: "/photos/north-lebanon-4.jpg",
  imageAlt: "North Lebanon landscape",
  basePriceCents: 30000,
  sizes: [{ id: "8x10", label: "8 × 10 in", multiplier: 1 }],
  papers: [{ id: "photo-rag", name: "Hahnemühle Photo Rag Baryta", surchargeCents: 0 }],
  editionTotal: 10,
  editionSold: 8,
};

const VALID_CART_LINE: CartLine = {
  photoSlug: "north-lebanon-oct-2020",
  sizeId: "8x10",
  paperId: "photo-rag",
  quantity: 1,
};

/**
 * Build a `checkout.session.completed` session. Accepts overrides for the
 * two fields the guard cares about: shipping country and `amount_shipping`.
 */
function makeStripeSession(
  opts: { country?: string; shippingCents?: number; overrides?: Record<string, unknown> } = {}
) {
  const country = opts.country ?? "US";
  const shippingCents = opts.shippingCents ?? 0;
  return {
    id: "cs_test_session_shipping_guard",
    payment_status: "paid",
    metadata: {
      cart_lines_json: JSON.stringify([VALID_CART_LINE]),
    },
    customer_details: {
      email: "buyer@example.com",
      name: "Test Buyer",
    },
    collected_information: {
      shipping_details: {
        name: "Test Buyer",
        address: {
          line1: "123 Art St",
          line2: null,
          city: "Somewhere",
          state: null,
          postal_code: "00000",
          country,
        },
      },
    },
    payment_intent: "pi_test_shipping_guard",
    amount_total: 30000 + shippingCents,
    currency: "usd",
    total_details: {
      amount_tax: 0,
      amount_shipping: shippingCents,
    },
    ...(opts.overrides ?? {}),
  };
}

function wasShippingMismatchAlerted(): boolean {
  return mockAlertSystemError.mock.calls.some(
    (call) => typeof call[0] === "string" && call[0].includes("shipping/country mismatch")
  );
}

describe("shipping mismatch guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPhotoBySlug.mockResolvedValue(FIXTURE_PHOTO);
    mockInsertOrderWithItems.mockResolvedValue({
      order: {
        id: "order-guard-001",
        createdAt: "2026-04-20T00:00:00Z",
        stripeCheckoutSessionId: "cs_test_session_shipping_guard",
        stripePaymentIntentId: "pi_test_shipping_guard",
        customerEmail: "buyer@example.com",
        customerName: "Test Buyer",
        shippingAddress: {
          name: "Test Buyer",
          line1: "123 Art St",
          line2: null,
          city: "Somewhere",
          state: null,
          postalCode: "00000",
          country: "US",
        },
        subtotalCents: 30000,
        taxCents: 0,
        shippingCents: 0,
        totalCents: 30000,
        currency: "usd",
        status: "paid",
        fulfillmentToken: "tok-guard",
        fulfillmentTokenRevokedAt: null,
        printJobEmailSentAt: null,
        trackingNumber: null,
        carrier: null,
        notes: null,
      },
      items: [
        {
          id: "item-guard-001",
          orderId: "order-guard-001",
          photoId: "photo-001",
          photoSlug: "north-lebanon-oct-2020",
          photoTitle: "North Lebanon (4), October 2020",
          sizeId: "8x10",
          sizeLabel: "8 × 10 in",
          paperId: "photo-rag",
          paperName: "Hahnemühle Photo Rag Baryta",
          quantity: 1,
          unitPriceCents: 30000,
          editionNumber: 9,
          editionTotal: 10,
          printFileUrlSnapshot: null,
        },
      ],
    });
  });

  // --- Happy paths: buyer paid the correct tier for their country. ---

  it("US address + $10 shipping (1000¢): no mismatch alert", async () => {
    const session = makeStripeSession({ country: "US", shippingCents: 1000 });
    await handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session);
    expect(wasShippingMismatchAlerted()).toBe(false);
  });

  it("CA address + $35 shipping (3500¢): no mismatch alert", async () => {
    const session = makeStripeSession({ country: "CA", shippingCents: 3500 });
    await handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session);
    expect(wasShippingMismatchAlerted()).toBe(false);
  });

  it("EU_UK address (GB) + $50 shipping (5000¢): no mismatch alert", async () => {
    const session = makeStripeSession({ country: "GB", shippingCents: 5000 });
    await handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session);
    expect(wasShippingMismatchAlerted()).toBe(false);
  });

  it("AU_ROW address (JP) + $65 shipping (6500¢): no mismatch alert", async () => {
    const session = makeStripeSession({ country: "JP", shippingCents: 6500 });
    await handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session);
    expect(wasShippingMismatchAlerted()).toBe(false);
  });

  // --- Under-payment cases: guard must fire. ---

  it("CA address but $10 US-tier shipping (1000¢): alert fires (picked US, shipped CA)", async () => {
    const session = makeStripeSession({ country: "CA", shippingCents: 1000 });
    await handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session);

    expect(wasShippingMismatchAlerted()).toBe(true);
    const mismatchCall = mockAlertSystemError.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes("shipping/country mismatch")
    );
    expect(mismatchCall).toBeDefined();
    // Match against the dynamic part of the message (template:
    //   "Order <id>: shipping country <CC> expects <N>¢ (legend...) but buyer
    //    paid only <M>¢."). Bare .toContain("CA") / .toContain("3500") would
    // false-pass on the static tier legend, so we anchor to the dynamic slice.
    expect(mismatchCall?.[1]).toMatch(/shipping country CA expects 3500¢/);
    expect(mismatchCall?.[1]).toMatch(/paid only 1000¢/);
  });

  it("EU_UK address (DE) but paid CA tier (3500¢): alert fires (-$15)", async () => {
    const session = makeStripeSession({ country: "DE", shippingCents: 3500 });
    await handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session);

    expect(wasShippingMismatchAlerted()).toBe(true);
    const mismatchCall = mockAlertSystemError.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes("shipping/country mismatch")
    );
    expect(mismatchCall?.[1]).toMatch(/shipping country DE expects 5000¢/);
    expect(mismatchCall?.[1]).toMatch(/paid only 3500¢/);
  });

  it("AU_ROW address (AU) but paid EU_UK tier (5000¢): alert fires (-$15)", async () => {
    const session = makeStripeSession({ country: "AU", shippingCents: 5000 });
    await handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session);

    expect(wasShippingMismatchAlerted()).toBe(true);
    const mismatchCall = mockAlertSystemError.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes("shipping/country mismatch")
    );
    expect(mismatchCall?.[1]).toMatch(/shipping country AU expects 6500¢/);
    expect(mismatchCall?.[1]).toMatch(/paid only 5000¢/);
  });

  it("unknown country code (XX) + $0: alert fires (falls back to highest tier)", async () => {
    // `expectedShippingCentsFor` biases unknowns to the AU_ROW tier ($65), so
    // a $0 payment is always flagged. Locks the "fail loud on surprise
    // country" behaviour.
    const session = makeStripeSession({ country: "XX", shippingCents: 0 });
    await handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session);

    expect(wasShippingMismatchAlerted()).toBe(true);
    const mismatchCall = mockAlertSystemError.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes("shipping/country mismatch")
    );
    expect(mismatchCall?.[1]).toMatch(/shipping country XX expects 6500¢/);
    expect(mismatchCall?.[1]).toMatch(/paid only 0¢/);
  });
});
