/**
 * Render a COA (Certificate of Authenticity) PDF to a Buffer.
 *
 * Two entry points:
 *   - `generateCoaPdf(order, item)` — one-page PDF for a single item.
 *   - `generateOrderCoasPdf(order, items)` — multi-page PDF bundling every
 *     item in an order (one COA per page).
 *
 * Called from:
 *   - `/api/coa/[orderId]` (streams to browser)
 *   - admin "download COA" actions
 *
 * @react-pdf needs the Node runtime - never invoke this from an edge handler.
 */

import "server-only";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import * as React from "react";
import type { Order, OrderItem } from "@/lib/types";
import CoaDocument from "./CoaDocument";
import { formatOrderReference } from "@/lib/email/templates/_shared";

export async function generateCoaPdf(
  order: Order,
  item: OrderItem,
  opts: { imageSrc?: string } = {}
): Promise<Buffer> {
  const referenceNumber = formatOrderReference(order);
  const imageSrcByItemId = opts.imageSrc ? { [item.id]: opts.imageSrc } : undefined;
  const doc = React.createElement(CoaDocument, {
    order,
    items: [item],
    referenceNumber,
    dateIso: order.createdAt,
    imageSrcByItemId,
  }) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(doc);
}

export async function generateOrderCoasPdf(
  order: Order,
  items: OrderItem[],
  opts: { imageSrcByItemId?: Record<string, string> } = {}
): Promise<Buffer> {
  const referenceNumber = formatOrderReference(order);
  const doc = React.createElement(CoaDocument, {
    order,
    items,
    referenceNumber,
    dateIso: order.createdAt,
    imageSrcByItemId: opts.imageSrcByItemId,
  }) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(doc);
}
