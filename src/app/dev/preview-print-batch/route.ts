/**
 * Dev-only: render the PrintBatch email (the weekly batch to Loupe) as HTML
 * so you can eyeball it in the browser. No send, no Resend dependency.
 * 404s in production.
 */

import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import * as React from "react";
import type { Order, OrderItem } from "@/lib/types";
import PrintBatch from "@/lib/email/templates/PrintBatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeStubOrder(
  id: string,
  name: string,
  email: string,
  country: string,
  notes: string | null = null,
  parentOrderId: string | null = null
): Order {
  return {
    id,
    createdAt: "2026-04-21T12:00:00Z",
    stripeCheckoutSessionId: `cs_live_${id.slice(0, 8)}`,
    stripePaymentIntentId: `pi_${id.slice(0, 8)}`,
    customerEmail: email,
    customerName: name,
    shippingAddress: {
      name,
      line1: "123 Example St",
      line2: null,
      city: "Brooklyn",
      state: "NY",
      postalCode: "11201",
      country,
    },
    subtotalCents: 30000,
    taxCents: 0,
    shippingCents: country === "US" ? 0 : 5000,
    totalCents: country === "US" ? 30900 : 35900,
    currency: "usd",
    status: "queued_for_print",
    fulfillmentToken: `tok-${id.slice(0, 8)}`,
    fulfillmentTokenRevokedAt: null,
    printJobEmailSentAt: null,
    trackingNumber: null,
    carrier: null,
    notes,
    parentOrderId,
  };
}

function makeStubItem(
  orderId: string,
  photoSlug: string,
  photoTitle: string,
  editionNumber: number
): OrderItem {
  return {
    id: `item-${orderId.slice(0, 6)}-${photoSlug}`,
    orderId,
    photoId: `photo-${photoSlug}`,
    photoSlug,
    photoTitle,
    sizeId: "8x10",
    sizeLabel: "8 × 10 in",
    paperId: "photo-rag",
    paperName: "Hahnemühle Photo Rag 308 gsm",
    quantity: 1,
    unitPriceCents: 30000,
    editionNumber,
    editionTotal: 10,
    printFileUrlSnapshot: null,
  };
}

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const orderA = makeStubOrder(
    "a1b2c3d4-0001-0000-0000-000000000001",
    "Alex Collector",
    "alex@example.com",
    "US"
  );
  const orderB = makeStubOrder(
    "b2c3d4e5-0002-0000-0000-000000000002",
    "Marie Dubois",
    "marie@example.com",
    "FR"
  );
  const orderC = makeStubOrder(
    "c3d4e5f6-0003-0000-0000-000000000003",
    "Alex Collector",
    "alex@example.com",
    "US",
    "reprint: damaged in transit. parent order: a1b2c3d4",
    "a1b2c3d4-0001-0000-0000-000000000001"
  );

  const batchOrders = [
    {
      order: orderA,
      items: [makeStubItem(orderA.id, "bekaa-feb-2025", "Bekaa, February 2025", 3)],
      dispatchUrl: "https://www.thaliabassim.com/dispatch/sample-a",
    },
    {
      order: orderB,
      items: [
        makeStubItem(orderB.id, "north-lebanon-oct-2020", "North Lebanon (2), October 2020", 7),
        makeStubItem(orderB.id, "keserwan-feb-2026", "Keserwan, February 2026", 2),
      ],
      dispatchUrl: "https://www.thaliabassim.com/dispatch/sample-b",
    },
    {
      order: orderC,
      items: [makeStubItem(orderC.id, "bekaa-feb-2025", "Bekaa, February 2025", 3)],
      dispatchUrl: "https://www.thaliabassim.com/dispatch/sample-c",
    },
  ];

  const html = await render(
    React.createElement(PrintBatch, {
      orders: batchOrders,
      batchDispatchUrl: "https://www.thaliabassim.com/dispatch/batch?token=sample",
    })
  );
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
