/**
 * Print-job email - to Rob at Brooklyn Archival.
 *
 * Per docs/system-design.md §8:
 * - No attachments, no direct file URLs.
 * - One paragraph of body copy pointing at the dispatch link.
 * - Reply-to threads back to Thalia's inbox (set at send-time in ../send.ts).
 *
 * The dispatch page handles: order details, print file download (signed R2
 * URL), status updates.
 */

import * as React from "react";
import { Body, Container, Head, Html, Link, Preview, Text } from "@react-email/components";
import type { Order, OrderItem } from "@/lib/types";
import { baseTextStyle, colors, fontFamily, formatOrderReference } from "./_shared";

export type PrintJobProps = {
  order: Order;
  items: OrderItem[];
  dispatchUrl: string;
};

function totalPrints(items: OrderItem[]): number {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}

export function PrintJob({ order, items, dispatchUrl }: PrintJobProps) {
  const ref = formatOrderReference(order);
  const count = totalPrints(items);
  const plural = count === 1 ? "print" : "prints";

  return (
    <Html>
      <Head />
      <Preview>{`[Order ${ref}] New print job, ready to fulfill`}</Preview>
      <Body
        style={{
          backgroundColor: "#ffffff",
          color: colors.ink,
          fontFamily,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "40px 24px",
          }}
        >
          <Text style={{ ...baseTextStyle, marginBottom: 24 }}>Thalia Bassim</Text>

          <Text style={{ ...baseTextStyle, marginBottom: 24 }}>
            New print job, {count} {plural}. Order {ref}. Details, file download, and status
            controls live on the dispatch page -{" "}
            <Link href={dispatchUrl} style={{ ...baseTextStyle, textDecoration: "underline" }}>
              open order {ref}
            </Link>
            . Reply to this thread with any questions.
          </Text>

          <Text style={baseTextStyle}>Thank you.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PrintJob;
