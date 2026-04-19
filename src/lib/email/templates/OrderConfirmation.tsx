/**
 * Customer order confirmation email.
 *
 * Cargo aesthetic (per design doc §10 + §7):
 * - Single font (system sans fallback - Geist is not reliably supported by
 *   email clients so we don't reference it).
 * - Weight 900 on everything.
 * - Text color rgba(0,0,0,0.6), background pure white, no fills or radii.
 * - Minimal markup so Gmail/Outlook/Apple Mail render it consistently.
 *
 * Consumed by `sendOrderConfirmation` in ../send.ts.
 */

import * as React from "react";
import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { Address, Order, OrderItem } from "@/lib/types";
import {
  formatOrderReference,
  formatUsdFromCents,
  fontFamily,
  textColor,
  baseTextStyle,
  labelStyle,
} from "./_shared";

export type OrderConfirmationProps = {
  order: Order;
  items: OrderItem[];
};

function formatAddress(a: Address): string {
  const lines = [
    a.name,
    a.line1,
    a.line2 ?? "",
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country,
  ].filter((l) => l.length > 0);
  return lines.join("\n");
}

export function OrderConfirmation({ order, items }: OrderConfirmationProps) {
  const ref = formatOrderReference(order);
  const subtotal = formatUsdFromCents(order.subtotalCents, order.currency);
  const tax = formatUsdFromCents(order.taxCents, order.currency);
  const shipping = formatUsdFromCents(order.shippingCents, order.currency);
  const total = formatUsdFromCents(order.totalCents, order.currency);
  const address = formatAddress(order.shippingAddress);

  return (
    <Html>
      <Head />
      <Preview>
        Order {ref} received - {total}
      </Preview>
      <Body
        style={{
          backgroundColor: "#ffffff",
          color: textColor,
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

          <Text style={{ ...baseTextStyle, marginBottom: 24 }}>Order received.</Text>

          <Text style={{ ...baseTextStyle, marginBottom: 24 }}>Reference {ref}</Text>

          <Hr style={{ borderColor: textColor, opacity: 0.3, margin: "24px 0" }} />

          <Section style={{ marginBottom: 24 }}>
            <Text style={labelStyle}>Prints</Text>
            {items.map((item) => (
              <Text key={item.id} style={{ ...baseTextStyle, marginBottom: 8 }}>
                {item.photoTitle}
                <br />
                {item.sizeLabel} on {item.paperName}
                <br />
                Edition {item.editionNumber} of {item.editionTotal}
                {item.quantity > 1 ? ` · Quantity ${item.quantity}` : ""}
              </Text>
            ))}
          </Section>

          <Hr style={{ borderColor: textColor, opacity: 0.3, margin: "24px 0" }} />

          <Section style={{ marginBottom: 24 }}>
            <Text style={labelStyle}>Ship to</Text>
            <Text style={{ ...baseTextStyle, whiteSpace: "pre-line" }}>{address}</Text>
          </Section>

          <Hr style={{ borderColor: textColor, opacity: 0.3, margin: "24px 0" }} />

          <Section style={{ marginBottom: 24 }}>
            <Text style={labelStyle}>Totals</Text>
            <Text style={{ ...baseTextStyle, marginBottom: 4 }}>Subtotal {subtotal}</Text>
            {order.shippingCents > 0 ? (
              <Text style={{ ...baseTextStyle, marginBottom: 4 }}>Shipping {shipping}</Text>
            ) : null}
            {order.taxCents > 0 ? (
              <Text style={{ ...baseTextStyle, marginBottom: 4 }}>Tax {tax}</Text>
            ) : null}
            <Text style={{ ...baseTextStyle, marginBottom: 4 }}>Total {total}</Text>
          </Section>

          <Hr style={{ borderColor: textColor, opacity: 0.3, margin: "24px 0" }} />

          <Text style={{ ...baseTextStyle, marginBottom: 12 }}>
            Each print is made to order. Production typically runs three to four weeks; tracking
            will follow once the print ships.
          </Text>

          <Text style={baseTextStyle}>Your confirmation email will arrive shortly.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmation;
