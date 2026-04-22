/**
 * Dev-only COA preview route.
 *
 * Visit `/dev/coa-sample` to download a PDF rendered with stubbed order +
 * item data. Useful for iterating on `CoaDocument.tsx` without needing a
 * real order in the DB. 404s in production so this never leaks.
 */

import { NextResponse, type NextRequest } from "next/server";
import type { Order, OrderItem } from "@/lib/types";
import { generateCoaPdf } from "@/lib/coa/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Build an absolute URL for the sample photo so @react-pdf's Image can
  // fetch it during server-side render. Uses the request's own origin so
  // the URL resolves on whichever port/IP the dev server is listening on.
  const origin = new URL(req.url).origin;
  const imageSrc = `${origin}/images/catalog/bekaa-feb-2025.jpg`;

  const fakeOrder: Order = {
    id: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    createdAt: "2026-04-21T12:00:00Z",
    stripeCheckoutSessionId: "cs_live_sample",
    stripePaymentIntentId: "pi_sample",
    customerEmail: "collector@example.com",
    customerName: "Alex Collector",
    shippingAddress: {
      name: "Alex Collector",
      line1: "1 Gallery Row",
      line2: null,
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "US",
    },
    subtotalCents: 30000,
    taxCents: 0,
    shippingCents: 0,
    totalCents: 30000,
    currency: "usd",
    status: "paid",
    fulfillmentToken: "tok-sample",
    fulfillmentTokenRevokedAt: null,
    printJobEmailSentAt: null,
    trackingNumber: null,
    carrier: null,
    notes: null,
  };

  const fakeItem: OrderItem = {
    id: "item-sample",
    orderId: fakeOrder.id,
    photoId: "photo-sample",
    photoSlug: "bekaa-feb-2025",
    photoTitle: "Bekaa, February 2025",
    sizeId: "8x10",
    sizeLabel: "8 × 10 in",
    paperId: "photo-rag",
    paperName: "Hahnemühle Photo Rag 308 gsm",
    quantity: 1,
    unitPriceCents: 30000,
    editionNumber: 3,
    editionTotal: 10,
    printFileUrlSnapshot: null,
  };

  const pdf = await generateCoaPdf(fakeOrder, fakeItem, { imageSrc });
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="coa-sample.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
