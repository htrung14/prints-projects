/**
 * GET /dispatch/batch/picklist?token=...
 *
 * Renders a printer-friendly PDF with every pending order in the batch —
 * Michael's paper hand-out for his workstation. Auth via the same signed
 * batch token as `/dispatch/batch`. The PDF contains the same data as the
 * batch page, laid out for print: ship-to address + items + checkboxes.
 *
 * @react-pdf needs the Node runtime — never invoke from an edge handler.
 */

import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import * as React from "react";
import { verifyDispatchToken } from "@/lib/dispatch/token";
import { getDispatchItemsForOrders, listPendingDispatchOrders } from "@/lib/dispatch/queries";
import PickListDocument from "@/lib/dispatch/PickListDocument";
import { alertSafely } from "@/lib/alerting/dispatcher";
import { systemErrorAlert } from "@/lib/alerting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPRINT_REASON_MAX = 60;

function detectReprintLabel(
  parentOrderId: string | null | undefined,
  notes: string | null
): string | null {
  const isReprint =
    Boolean(parentOrderId) ||
    (typeof notes === "string" && notes.trimStart().toLowerCase().startsWith("reprint:"));
  if (!isReprint) return null;
  const raw = notes ?? "";
  const match = raw.match(/^\s*reprint:\s*(.*?)(?:\.\s*parent order:.*)?$/i);
  const reason = match?.[1]?.trim() ?? "";
  if (!reason) return "REPRINT";
  const truncated =
    reason.length > REPRINT_REASON_MAX ? reason.slice(0, REPRINT_REASON_MAX) + "…" : reason;
  return `REPRINT · ${truncated}`;
}

function formatGeneratedAt(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
}

export async function GET(req: NextRequest): Promise<Response> {
  const tokenParam = req.nextUrl.searchParams.get("token");
  if (!tokenParam) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const payload = verifyDispatchToken(tokenParam);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }
  if (payload.kind !== "batch") {
    return NextResponse.json({ error: "Token is not a batch token." }, { status: 401 });
  }

  let orders;
  let itemsByOrder;
  try {
    orders = await listPendingDispatchOrders();
    itemsByOrder = await getDispatchItemsForOrders(orders.map((o) => o.id));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await alertSafely(
      "GET /dispatch/batch/picklist load",
      systemErrorAlert("GET /dispatch/batch/picklist load", msg)
    );
    return NextResponse.json({ error: "Failed to load batch." }, { status: 500 });
  }

  const orderBlocks = orders.map((order) => ({
    order,
    items: itemsByOrder.get(order.id) ?? [],
    reprintLabel: detectReprintLabel(order.parentOrderId, order.notes),
  }));

  const doc = React.createElement(PickListDocument, {
    orders: orderBlocks,
    generatedAt: formatGeneratedAt(),
  }) as unknown as React.ReactElement<DocumentProps>;

  let pdf: Buffer;
  try {
    pdf = await renderToBuffer(doc);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await alertSafely(
      "GET /dispatch/batch/picklist render",
      systemErrorAlert("GET /dispatch/batch/picklist render", msg)
    );
    return NextResponse.json({ error: "Failed to render pick-list." }, { status: 500 });
  }

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="picklist.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
