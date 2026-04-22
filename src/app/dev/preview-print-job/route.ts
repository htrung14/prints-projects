/**
 * Dev-only: render the PrintJob email (single-order alternative) as HTML
 * so you can eyeball it in the browser. No send, no Resend dependency.
 * 404s in production.
 */

import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import * as React from "react";
import type { Order, OrderItem } from "@/lib/types";
import PrintJob from "@/lib/email/templates/PrintJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const order: Order = {
    id: "b2c3d4e5-0002-0000-0000-000000000002",
    createdAt: "2026-04-21T12:00:00Z",
    stripeCheckoutSessionId: "cs_live_b2c3d4e5",
    stripePaymentIntentId: "pi_b2c3d4e5",
    customerEmail: "marie@example.com",
    customerName: "Marie Dubois",
    shippingAddress: {
      name: "Marie Dubois",
      line1: "45 rue de Rivoli",
      line2: null,
      city: "Paris",
      state: null,
      postalCode: "75001",
      country: "FR",
    },
    subtotalCents: 60000,
    taxCents: 0,
    shippingCents: 5000,
    totalCents: 66800,
    currency: "usd",
    status: "queued_for_print",
    fulfillmentToken: "tok-sample",
    fulfillmentTokenRevokedAt: null,
    printJobEmailSentAt: null,
    trackingNumber: null,
    carrier: null,
    notes: null,
    parentOrderId: null,
  };

  const items: OrderItem[] = [
    {
      id: "item-1",
      orderId: order.id,
      photoId: "photo-north-lebanon",
      photoSlug: "north-lebanon-oct-2020",
      photoTitle: "North Lebanon (2), October 2020",
      sizeId: "8x10",
      sizeLabel: "8 × 10 in",
      paperId: "photo-rag",
      paperName: "Hahnemühle Photo Rag 308 gsm",
      quantity: 1,
      unitPriceCents: 30000,
      editionNumber: 7,
      editionTotal: 10,
      printFileUrlSnapshot: null,
    },
    {
      id: "item-2",
      orderId: order.id,
      photoId: "photo-keserwan",
      photoSlug: "keserwan-feb-2026",
      photoTitle: "Keserwan, February 2026",
      sizeId: "8x10",
      sizeLabel: "8 × 10 in",
      paperId: "photo-rag",
      paperName: "Hahnemühle Photo Rag 308 gsm",
      quantity: 1,
      unitPriceCents: 30000,
      editionNumber: 2,
      editionTotal: 10,
      printFileUrlSnapshot: null,
    },
  ];

  const html = await render(
    React.createElement(PrintJob, {
      order,
      items,
      dispatchUrl: "https://www.thaliabassim.com/dispatch/sample-b",
    })
  );
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
