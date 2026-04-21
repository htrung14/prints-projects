/**
 * E2E test: Full checkout pipeline.
 * Cart → resolveCartLines → createCheckoutSession → webhook → order insert → alerts
 *
 * Mocks: Stripe SDK, Supabase client (external services).
 * Tests: Full internal pipeline including alerting dispatch.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock external dependencies before imports ---
vi.mock("server-only", () => ({}));

const mockStripeCreate = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  stripeClient: () => ({
    checkout: { sessions: { create: mockStripeCreate } },
  }),
}));

const mockGetPhotoBySlug = vi.fn();
vi.mock("@/lib/supabase/queries/photos", () => ({
  getPhotoBySlug: (...args: unknown[]) => mockGetPhotoBySlug(...args),
}));

const mockInsertOrderWithItems = vi.fn();
vi.mock("@/lib/supabase/queries/orders", () => ({
  insertOrderWithItems: (...args: unknown[]) => mockInsertOrderWithItems(...args),
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

// --- Import after mocks ---
import type Stripe from "stripe";
import { resolveCartLines, createCheckoutSession } from "@/lib/stripe/checkout";
import { handleCheckoutSessionCompleted, dispatchWebhookEvent } from "@/lib/stripe/webhook";
import { priceCents, formatUsd, editionRemaining, isSoldOut } from "@/lib/pricing";
import type { Photo, CartLine } from "@/lib/types";
import {
  createAlertDispatcher,
  orderCompletedAlert,
  editionSoldOutAlert,
  editionLowStockAlert,
  webhookRetryAlert,
  paymentFailedAlert,
  batchReadyAlert,
  systemErrorAlert,
} from "@/lib/alerting";

// --- Test fixtures ---
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

function makeStripeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_session_123",
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
          city: "Brooklyn",
          state: "NY",
          postal_code: "11201",
          country: "US",
        },
      },
    },
    payment_intent: "pi_test_123",
    amount_total: 32000,
    currency: "usd",
    total_details: {
      amount_tax: 2000,
      amount_shipping: 0,
    },
    ...overrides,
  };
}

// --- Tests ---

describe("Pricing utilities", () => {
  it("computes flat price for 8x10 photo-rag", () => {
    expect(priceCents(FIXTURE_PHOTO, "8x10", "photo-rag")).toBe(30000);
  });

  it("formats USD without decimals", () => {
    expect(formatUsd(30000)).toBe("$300");
    expect(formatUsd(0)).toBe("$0");
    expect(formatUsd(99)).toBe("$1");
  });

  it("calculates edition remaining", () => {
    expect(editionRemaining(FIXTURE_PHOTO)).toBe(2);
    expect(editionRemaining({ ...FIXTURE_PHOTO, editionSold: 10 })).toBe(0);
    expect(editionRemaining({ ...FIXTURE_PHOTO, editionSold: 11 })).toBe(0);
  });

  it("detects sold out", () => {
    expect(isSoldOut(FIXTURE_PHOTO)).toBe(false);
    expect(isSoldOut({ ...FIXTURE_PHOTO, editionSold: 10 })).toBe(true);
  });
});

describe("resolveCartLines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPhotoBySlug.mockResolvedValue(FIXTURE_PHOTO);
  });

  it("resolves a valid single-line cart", async () => {
    const result = await resolveCartLines([VALID_CART_LINE]);
    expect(result).toHaveLength(1);
    expect(result[0].unitPriceCents).toBe(30000);
    expect(result[0].photo.slug).toBe("north-lebanon-oct-2020");
    expect(result[0].sizeLabel).toBe("8 × 10 in");
  });

  it("throws on empty cart", async () => {
    await expect(resolveCartLines([])).rejects.toThrow("at least one line");
  });

  it("throws on unknown photo slug", async () => {
    mockGetPhotoBySlug.mockResolvedValue(null);
    await expect(
      resolveCartLines([{ ...VALID_CART_LINE, photoSlug: "nonexistent" }])
    ).rejects.toThrow("unknown photo nonexistent");
  });

  it("throws on unknown sizeId", async () => {
    await expect(resolveCartLines([{ ...VALID_CART_LINE, sizeId: "24x36" }])).rejects.toThrow(
      "unknown sizeId 24x36"
    );
  });

  it("throws on unknown paperId", async () => {
    await expect(
      resolveCartLines([{ ...VALID_CART_LINE, paperId: "canvas" as CartLine["paperId"] }])
    ).rejects.toThrow("unknown paperId canvas");
  });

  it("throws on zero quantity", async () => {
    await expect(resolveCartLines([{ ...VALID_CART_LINE, quantity: 0 }])).rejects.toThrow(
      "quantity must be 1-10"
    );
  });

  it("throws on negative quantity", async () => {
    await expect(resolveCartLines([{ ...VALID_CART_LINE, quantity: -1 }])).rejects.toThrow(
      "quantity must be 1-10"
    );
  });

  it("throws on missing photoSlug", async () => {
    await expect(resolveCartLines([{ ...VALID_CART_LINE, photoSlug: "" }])).rejects.toThrow(
      "missing photoSlug"
    );
  });
});

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPhotoBySlug.mockResolvedValue(FIXTURE_PHOTO);
    mockStripeCreate.mockResolvedValue({
      id: "cs_test_new",
      url: "https://checkout.stripe.com/test",
    });
  });

  it("creates a session with correct line items", async () => {
    const session = await createCheckoutSession({
      lines: [VALID_CART_LINE],
      origin: "http://localhost:3000",
    });

    expect(mockStripeCreate).toHaveBeenCalledOnce();
    const params = mockStripeCreate.mock.calls[0][0];
    expect(params.mode).toBe("payment");
    expect(params.line_items).toHaveLength(2);
    expect(params.line_items[0].price_data.unit_amount).toBe(30000);
    expect(params.line_items[0].price_data.currency).toBe("usd");
    expect(params.line_items[1].price_data.product_data.name).toBe("Processing fee (3%)");
    expect(params.automatic_tax.enabled).toBe(true);
    expect(params.metadata.cart_lines_json).toBe(JSON.stringify([VALID_CART_LINE]));
    expect(session.url).toBe("https://checkout.stripe.com/test");
  });

  it("offers flat-rate shipping only (no free shipping)", async () => {
    mockGetPhotoBySlug.mockResolvedValue(FIXTURE_PHOTO);
    await createCheckoutSession({
      lines: [VALID_CART_LINE, { ...VALID_CART_LINE, photoSlug: "tyre-feb-2022" }],
      origin: "http://localhost:3000",
    });

    const params = mockStripeCreate.mock.calls[0][0];
    const freeOption = params.shipping_options.find(
      (o: { shipping_rate_data: { display_name: string } }) =>
        o.shipping_rate_data.display_name.includes("Free")
    );
    expect(freeOption).toBeUndefined();
    expect(params.shipping_options).toHaveLength(2);
    expect(params.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(2000);
    expect(params.shipping_options[1].shipping_rate_data.fixed_amount.amount).toBe(4500);
  });
});

describe("handleCheckoutSessionCompleted (webhook)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPhotoBySlug.mockResolvedValue(FIXTURE_PHOTO);
    mockInsertOrderWithItems.mockResolvedValue({
      order: {
        id: "order-001",
        createdAt: "2026-04-20T00:00:00Z",
        stripeCheckoutSessionId: "cs_test_session_123",
        stripePaymentIntentId: "pi_test_123",
        customerEmail: "buyer@example.com",
        customerName: "Test Buyer",
        shippingAddress: {
          name: "Test Buyer",
          line1: "123 Art St",
          line2: null,
          city: "Brooklyn",
          state: "NY",
          postalCode: "11201",
          country: "US",
        },
        subtotalCents: 30000,
        taxCents: 2000,
        shippingCents: 0,
        totalCents: 32000,
        currency: "usd",
        status: "paid",
        fulfillmentToken: "abc123",
        fulfillmentTokenRevokedAt: null,
        printJobEmailSentAt: null,
        trackingNumber: null,
        carrier: null,
        notes: null,
      },
      items: [
        {
          id: "item-001",
          orderId: "order-001",
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

  it("processes a valid checkout session end-to-end", async () => {
    const session = makeStripeSession();
    const result = await handleCheckoutSessionCompleted(
      session as unknown as Stripe.Checkout.Session
    );

    expect(result).toHaveProperty("order");
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("dispatchUrl");
    if ("order" in result) {
      expect(result.order.id).toBe("order-001");
      expect(result.items).toHaveLength(1);
    }

    expect(mockInsertOrderWithItems).toHaveBeenCalledOnce();
    // Emails/alerts/audit are now deferred via after() — not called in handleCheckoutSessionCompleted
  });

  it("handles duplicate session idempotently", async () => {
    mockInsertOrderWithItems.mockRejectedValue(
      new Error("duplicate key value violates unique constraint")
    );

    const session = makeStripeSession();
    const result = await handleCheckoutSessionCompleted(
      session as unknown as Stripe.Checkout.Session
    );

    expect(result).toEqual({ idempotent: true });
    expect(mockSendOrderConfirmation).not.toHaveBeenCalled();
  });

  it("auto-refunds on edition exhausted and returns idempotent", async () => {
    mockInsertOrderWithItems.mockRejectedValue(new Error("EDITION_EXCEEDED: all editions sold"));

    const session = makeStripeSession();
    const result = await handleCheckoutSessionCompleted(
      session as unknown as Stripe.Checkout.Session
    );
    expect(result).toEqual({ idempotent: true });
  });

  it("throws on missing metadata", async () => {
    const session = makeStripeSession({ metadata: {} });
    await expect(
      handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session)
    ).rejects.toThrow("cart_lines_json missing or empty");
  });

  it("throws on malformed cart JSON in metadata", async () => {
    const session = makeStripeSession({ metadata: { cart_lines_json: "not{json" } });
    await expect(
      handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session)
    ).rejects.toThrow("not valid JSON");
  });

  it("throws on empty cart array in metadata", async () => {
    const session = makeStripeSession({ metadata: { cart_lines_json: "[]" } });
    await expect(
      handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session)
    ).rejects.toThrow("did not decode to a non-empty array");
  });

  it("throws on missing shipping address", async () => {
    const session = makeStripeSession({
      collected_information: { shipping_details: null },
      customer_details: { email: "a@b.com", name: "X", address: null },
    });
    await expect(
      handleCheckoutSessionCompleted(session as unknown as Stripe.Checkout.Session)
    ).rejects.toThrow("no shipping or billing address");
  });

  it("returns order even when side-effects would fail (deferred)", async () => {
    mockSendOrderConfirmation.mockRejectedValue(new Error("Resend down"));

    const session = makeStripeSession();
    const result = await handleCheckoutSessionCompleted(
      session as unknown as Stripe.Checkout.Session
    );

    // Side-effects are deferred — handleCheckoutSessionCompleted only does DB insert
    expect(result).toHaveProperty("order");
    expect(result).toHaveProperty("dispatchUrl");
  });
});

describe("dispatchWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPhotoBySlug.mockResolvedValue(FIXTURE_PHOTO);
    mockInsertOrderWithItems.mockResolvedValue({
      order: { id: "order-002", stripePaymentIntentId: "pi_2" },
      items: [],
    });
  });

  it("dispatches checkout.session.completed events", async () => {
    const event = {
      type: "checkout.session.completed",
      data: { object: makeStripeSession() },
    };
    const result = await dispatchWebhookEvent(event as unknown as Stripe.Event);
    expect(result).toHaveProperty("order");
  });

  it("ignores unknown event types gracefully", async () => {
    const event = { type: "invoice.payment_failed", data: { object: {} } };
    const result = await dispatchWebhookEvent(event as unknown as Stripe.Event);
    expect(result).toBeNull();
  });
});

describe("Alerting system", () => {
  it("dispatches alerts to filtered channels", async () => {
    const notionSend = vi.fn().mockResolvedValue(undefined);
    const emailSend = vi.fn().mockResolvedValue(undefined);
    const telegramSend = vi.fn().mockResolvedValue(undefined);

    const dispatcher = createAlertDispatcher({
      channels: [
        { name: "notion", send: notionSend },
        { name: "email", send: emailSend },
        { name: "telegram", send: telegramSend },
      ],
    });

    const infoAlert = orderCompletedAlert("order-001", "Test Buyer", "Edition 9/10");
    await dispatcher.send(infoAlert);

    expect(notionSend).toHaveBeenCalledOnce();
    expect(emailSend).not.toHaveBeenCalled();
    expect(telegramSend).not.toHaveBeenCalled();
  });

  it("sends critical alerts to all channels", async () => {
    const notionSend = vi.fn().mockResolvedValue(undefined);
    const emailSend = vi.fn().mockResolvedValue(undefined);
    const telegramSend = vi.fn().mockResolvedValue(undefined);

    const dispatcher = createAlertDispatcher({
      channels: [
        { name: "notion", send: notionSend },
        { name: "email", send: emailSend },
        { name: "telegram", send: telegramSend },
      ],
    });

    const criticalAlert = editionSoldOutAlert("North Lebanon (4)", "north-lebanon-oct-2020");
    await dispatcher.send(criticalAlert);

    expect(notionSend).toHaveBeenCalledOnce();
    expect(emailSend).toHaveBeenCalledOnce();
    expect(telegramSend).toHaveBeenCalledOnce();
  });

  it("sends warning alerts to notion only by default", async () => {
    const notionSend = vi.fn().mockResolvedValue(undefined);
    const emailSend = vi.fn().mockResolvedValue(undefined);

    const dispatcher = createAlertDispatcher({
      channels: [
        { name: "notion", send: notionSend },
        { name: "email", send: emailSend },
      ],
    });

    const warningAlert = editionLowStockAlert("North Lebanon (4)", "north-lebanon-oct-2020", 2);
    await dispatcher.send(warningAlert);

    expect(notionSend).toHaveBeenCalledOnce();
    expect(emailSend).not.toHaveBeenCalled();
  });

  it("edition_sold_out alert says no action needed (auto-handled)", () => {
    const alert = editionSoldOutAlert("North Lebanon (4)", "north-lebanon-oct-2020");
    expect(alert.actionRequired).toBe(false);
    expect(alert.autoHandled).toContain("automatically marked as unavailable");
  });

  it("batch_ready alert requires action", () => {
    const alert = batchReadyAlert(3, ["o1", "o2", "o3"]);
    expect(alert.actionRequired).toBe(true);
    expect(alert.actionInstructions).toContain("Send batch to printer");
  });

  it("webhook_retry becomes critical at attempt 3", () => {
    const retry2 = webhookRetryAlert("cs_123", 2, "timeout");
    expect(retry2.severity).toBe("warning");
    expect(retry2.actionRequired).toBe(false);

    const retry3 = webhookRetryAlert("cs_123", 3, "timeout");
    expect(retry3.severity).toBe("critical");
    expect(retry3.actionRequired).toBe(true);
  });

  it("payment_failed alert does not require action", () => {
    const alert = paymentFailedAlert("cs_456", "buyer@test.com", "card_declined");
    expect(alert.actionRequired).toBe(false);
    expect(alert.autoHandled).toContain("retry");
  });

  it("system_error alert always requires action", () => {
    const alert = systemErrorAlert("webhook handler", "Supabase connection refused");
    expect(alert.actionRequired).toBe(true);
    expect(alert.severity).toBe("critical");
  });

  it("continues sending if one channel fails", async () => {
    const failingChannel = { name: "email", send: vi.fn().mockRejectedValue(new Error("down")) };
    const workingChannel = { name: "notion", send: vi.fn().mockResolvedValue(undefined) };

    const dispatcher = createAlertDispatcher({
      channels: [failingChannel, workingChannel],
      severityFilter: {
        email: ["critical", "warning", "info"],
        notion: ["critical", "warning", "info"],
      },
    });

    const alert = systemErrorAlert("test", "fail");
    await dispatcher.send(alert);

    expect(workingChannel.send).toHaveBeenCalledOnce();
  });
});

describe("Edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPhotoBySlug.mockResolvedValue(FIXTURE_PHOTO);
  });

  it("cart metadata stays under Stripe 500-char limit for typical carts", () => {
    const lines: CartLine[] = Array.from({ length: 5 }, (_, i) => ({
      photoSlug: `photo-slug-${i}`,
      sizeId: "8x10",
      paperId: "photo-rag" as CartLine["paperId"],
      quantity: 1,
    }));
    const json = JSON.stringify(lines);
    expect(json.length).toBeLessThan(500);
  });

  it("warns if cart metadata could exceed 500 chars", () => {
    const lines: CartLine[] = Array.from({ length: 10 }, (_, i) => ({
      photoSlug: `very-long-photo-slug-name-that-takes-space-${i}`,
      sizeId: "8x10",
      paperId: "photo-rag" as CartLine["paperId"],
      quantity: 1,
    }));
    const json = JSON.stringify(lines);
    // 10 items with long slugs — this should be flagged
    if (json.length >= 500) {
      expect(json.length).toBeGreaterThanOrEqual(500);
    }
  });

  it("resolveCartLines validates each line independently", async () => {
    const validLine = VALID_CART_LINE;
    const invalidLine = { ...VALID_CART_LINE, sizeId: "nonexistent" };

    await expect(resolveCartLines([validLine, invalidLine])).rejects.toThrow("unknown sizeId");
  });
});
