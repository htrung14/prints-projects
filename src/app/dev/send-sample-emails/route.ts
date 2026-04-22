/**
 * Dev-only route that sends two sample printer emails to the dev inbox
 * so you can preview them in Gmail as Loupe would see them.
 *
 *   GET /dev/send-sample-emails
 *
 * Sends:
 *   1. PrintBatch — the weekly (or twice-weekly) batch email with 3 stubbed
 *      orders, one of which is a reprint so the "REPRINT" marker renders.
 *   2. PrintJob  — the per-order alternative template (single order body).
 *
 * Recipient is hardcoded to haivotrung@gmail.com. 404s in production.
 */

import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import * as React from "react";
import type { Order, OrderItem } from "@/lib/types";
import { fromAddress, getResend } from "@/lib/email/client";
import PrintBatch from "@/lib/email/templates/PrintBatch";
import PrintJob from "@/lib/email/templates/PrintJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_RECIPIENT = "haivotrung@gmail.com";

// Stubbed orders. No DB work, no signed URLs (the dispatch links in the email
// are fake non-resolving placeholders — the sample is for visual review, not
// click-through testing).
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

  // Dev-only sanity check: if Resend isn't configured locally, bail with a
  // helpful 400 rather than letting getResend() throw. A throw here would
  // surface in Sentry + the alerting pipeline as if it were a real prod
  // incident, which it isn't.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        error: "RESEND_API_KEY not set in local env",
        hint: "Use /dev/preview-print-batch and /dev/preview-print-job to render the HTML in the browser without sending. To actually send, run `vercel env pull .env.local --environment=production --yes` and restart the dev server.",
      },
      { status: 400 }
    );
  }

  const resend = getResend();
  const from = fromAddress();

  // --- Stub orders + items ---
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

  const itemsA = [makeStubItem(orderA.id, "bekaa-feb-2025", "Bekaa, February 2025", 3)];
  const itemsB = [
    makeStubItem(orderB.id, "north-lebanon-oct-2020", "North Lebanon (2), October 2020", 7),
    makeStubItem(orderB.id, "keserwan-feb-2026", "Keserwan, February 2026", 2),
  ];
  const itemsC = [makeStubItem(orderC.id, "bekaa-feb-2025", "Bekaa, February 2025", 3)];

  // --- 1. PrintBatch email (weekly batch to Loupe) ---
  const batchOrders = [
    { order: orderA, items: itemsA, dispatchUrl: "https://www.thaliabassim.com/dispatch/sample-a" },
    { order: orderB, items: itemsB, dispatchUrl: "https://www.thaliabassim.com/dispatch/sample-b" },
    { order: orderC, items: itemsC, dispatchUrl: "https://www.thaliabassim.com/dispatch/sample-c" },
  ];
  const batchHtml = await render(
    React.createElement(PrintBatch, {
      orders: batchOrders,
      batchDispatchUrl: "https://www.thaliabassim.com/dispatch/batch?token=sample",
    })
  );
  const batchResult = await resend.emails.send({
    from,
    to: SAMPLE_RECIPIENT,
    subject: "[SAMPLE] Print batch ready — 3 orders",
    html: batchHtml,
  });

  // --- 2. PrintJob email (per-order single-order alternative) ---
  const jobHtml = await render(
    React.createElement(PrintJob, {
      order: orderB,
      items: itemsB,
      dispatchUrl: "https://www.thaliabassim.com/dispatch/sample-b",
    })
  );
  const jobResult = await resend.emails.send({
    from,
    to: SAMPLE_RECIPIENT,
    subject: "[SAMPLE] New print job — Order B2C3D4E5",
    html: jobHtml,
  });

  return NextResponse.json(
    {
      ok: true,
      sent_to: SAMPLE_RECIPIENT,
      from,
      batch: batchResult.error
        ? { ok: false, error: String(batchResult.error) }
        : { ok: true, id: batchResult.data?.id ?? null },
      job: jobResult.error
        ? { ok: false, error: String(jobResult.error) }
        : { ok: true, id: jobResult.data?.id ?? null },
    },
    { status: 200 }
  );
}
