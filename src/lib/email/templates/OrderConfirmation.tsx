/**
 * Customer order confirmation email.
 *
 * Matches the At-Tamassok site aesthetic: warm paper background (#faf9f6),
 * French Blue accent (#0072BB), serif italic for titles, clean sans body.
 */

import * as React from "react";
import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import type { Address, Order, OrderItem } from "@/lib/types";
import {
  formatOrderReference,
  formatUsdFromCents,
  fontFamily,
  serifFamily,
  colors,
  baseTextStyle,
  labelStyle,
  serifStyle,
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
  const shipping = formatUsdFromCents(order.shippingCents, order.currency);
  const tax = formatUsdFromCents(order.taxCents, order.currency);
  const total = formatUsdFromCents(order.totalCents, order.currency);
  const address = formatAddress(order.shippingAddress);
  const customerName = order.shippingAddress?.name ?? order.customerName ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thaliabassim.com";

  return (
    <Html>
      <Head />
      <Preview>
        Order {ref} confirmed — {total}
      </Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          color: colors.ink,
          fontFamily,
          margin: 0,
          padding: 0,
        }}
      >
        {/* Blue accent bar */}
        <Section style={{ backgroundColor: colors.blue, height: "4px" }} />

        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "48px 24px 40px",
          }}
        >
          {/* Header */}
          <Text
            style={{
              fontFamily: serifFamily,
              fontSize: "22px",
              fontWeight: 400,
              fontStyle: "italic",
              color: colors.ink,
              margin: "0 0 32px 0",
              letterSpacing: "0.01em",
            }}
          >
            Thalia Bassim
          </Text>

          {/* Greeting */}
          <Text style={{ ...baseTextStyle, fontSize: "18px", marginBottom: 8 }}>
            {customerName ? `Thank you, ${customerName}.` : "Thank you."}
          </Text>
          <Text style={{ ...baseTextStyle, color: colors.inkSoft, marginBottom: 24 }}>
            Your order has been received and is being prepared.
          </Text>

          {/* Order ref */}
          <Text
            style={{
              ...baseTextStyle,
              fontSize: "12px",
              letterSpacing: "0.08em",
              color: colors.inkFaint,
              marginBottom: 32,
            }}
          >
            Order {ref}
          </Text>

          <Hr style={{ borderColor: colors.rule, margin: "0 0 28px 0" }} />

          {/* Line items */}
          <Text style={{ ...labelStyle, marginBottom: 16 }}>Prints</Text>
          {items.map((item) => (
            <Section key={item.id} style={{ marginBottom: 20 }}>
              <Text
                style={{
                  ...serifStyle,
                  fontSize: "17px",
                  margin: "0 0 4px 0",
                }}
              >
                {item.photoTitle}
              </Text>
              <Text
                style={{
                  ...baseTextStyle,
                  fontSize: "13px",
                  color: colors.inkSoft,
                  margin: 0,
                }}
              >
                {item.sizeLabel} · Archival pigment
              </Text>
              <Text
                style={{
                  ...baseTextStyle,
                  fontSize: "13px",
                  color: colors.inkSoft,
                  margin: 0,
                }}
              >
                Edition {item.editionNumber} of {item.editionTotal}
                {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
              </Text>
            </Section>
          ))}

          <Hr style={{ borderColor: colors.rule, margin: "8px 0 28px 0" }} />

          {/* Ship to */}
          <Text style={{ ...labelStyle, marginBottom: 12 }}>Ship to</Text>
          <Text
            style={{
              ...baseTextStyle,
              fontSize: "13px",
              whiteSpace: "pre-line",
              marginBottom: 28,
            }}
          >
            {address}
          </Text>

          <Hr style={{ borderColor: colors.rule, margin: "0 0 28px 0" }} />

          {/* Totals */}
          <Text style={{ ...labelStyle, marginBottom: 12 }}>Summary</Text>
          <Row style={{ marginBottom: 4 }}>
            <Column>
              <Text style={{ ...baseTextStyle, fontSize: "13px", color: colors.inkSoft }}>
                Subtotal
              </Text>
            </Column>
            <Column align="right">
              <Text style={{ ...baseTextStyle, fontSize: "13px" }}>{subtotal}</Text>
            </Column>
          </Row>
          {order.shippingCents > 0 ? (
            <Row style={{ marginBottom: 4 }}>
              <Column>
                <Text style={{ ...baseTextStyle, fontSize: "13px", color: colors.inkSoft }}>
                  Shipping
                </Text>
              </Column>
              <Column align="right">
                <Text style={{ ...baseTextStyle, fontSize: "13px" }}>{shipping}</Text>
              </Column>
            </Row>
          ) : null}
          {order.taxCents > 0 ? (
            <Row style={{ marginBottom: 4 }}>
              <Column>
                <Text style={{ ...baseTextStyle, fontSize: "13px", color: colors.inkSoft }}>
                  Tax
                </Text>
              </Column>
              <Column align="right">
                <Text style={{ ...baseTextStyle, fontSize: "13px" }}>{tax}</Text>
              </Column>
            </Row>
          ) : null}
          <Hr style={{ borderColor: colors.rule, margin: "8px 0" }} />
          <Row style={{ marginBottom: 28 }}>
            <Column>
              <Text style={{ ...baseTextStyle, fontSize: "14px" }}>Total</Text>
            </Column>
            <Column align="right">
              <Text style={{ ...baseTextStyle, fontSize: "14px", fontWeight: 600 }}>{total}</Text>
            </Column>
          </Row>

          <Hr style={{ borderColor: colors.rule, margin: "0 0 28px 0" }} />

          {/* Production note */}
          <Text
            style={{
              ...baseTextStyle,
              fontSize: "13px",
              color: colors.inkSoft,
              lineHeight: "1.7",
              marginBottom: 24,
            }}
          >
            Each print is signed, numbered, and made to order on archival pigment paper. Please
            allow up to 7 business days before shipment. You will receive tracking once your print
            ships.
          </Text>

          {/* CTA */}
          <Section style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <Link
              href={`${siteUrl}/track`}
              style={{
                display: "inline-block",
                backgroundColor: colors.blue,
                color: colors.white,
                fontFamily,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                padding: "14px 32px",
                textDecoration: "none",
              }}
            >
              Track your order
            </Link>
          </Section>

          {/* Footer */}
          <Text
            style={{
              ...baseTextStyle,
              fontSize: "11px",
              color: colors.inkFaint,
              textAlign: "center" as const,
              lineHeight: "1.6",
            }}
          >
            <Link href={siteUrl} style={{ color: colors.inkFaint, textDecoration: "underline" }}>
              thaliabassim.com
            </Link>
            {" · "}
            <Link
              href={`${siteUrl}/terms`}
              style={{ color: colors.inkFaint, textDecoration: "underline" }}
            >
              Terms
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmation;
