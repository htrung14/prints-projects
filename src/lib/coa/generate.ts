/**
 * Render a COA (Certificate of Authenticity) PDF to a Buffer.
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

export async function generateCoaPdf(order: Order, item: OrderItem): Promise<Buffer> {
  const referenceNumber = formatOrderReference(order);
  // CoaDocument returns a <Document ...> element internally. renderToBuffer
  // types the element as ReactElement<DocumentProps>, so we cast.
  const doc = React.createElement(CoaDocument, {
    order,
    item,
    referenceNumber,
    dateIso: order.createdAt,
  }) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(doc);
}
