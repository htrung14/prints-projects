/**
 * Refund notification — sent to the customer.
 *
 * Fires when a charge is refunded (Stripe `charge.refunded` webhook) OR
 * when an admin issues a refund from the dashboard. The handler at
 * `src/lib/stripe/webhook.ts` :: `handleChargeRefunded` calls
 * `sendRefundedNotification(order)` after flipping the order status to
 * `refunded`.
 *
 * Tone: straightforward, no surprise. The customer may have requested the
 * refund themselves, or it may be an ops-initiated one (edition sold out,
 * duplicate charge). Either way, this email confirms the money is on its
 * way back and sets expectations on timing.
 *
 * On-brand: warm paper bg (#faf9f6), French Blue accent, serif-italic
 * header — matches OrderConfirmation / Shipped / ReprintOnTheWay.
 */

import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { Order } from "@/lib/types";
import {
  baseTextStyle,
  colors,
  fontFamily,
  formatOrderReference,
  formatUsdFromCents,
  serifFamily,
} from "./_shared";

export type RefundedProps = {
  order: Order;
};

export function Refunded({ order }: RefundedProps) {
  const ref = formatOrderReference(order);
  const amount = formatUsdFromCents(order.totalCents, order.currency);
  const customerName = order.shippingAddress?.name ?? order.customerName ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thaliabassim.com";

  return (
    <Html>
      <Head />
      <Preview>{`Order ${ref} refunded — ${amount}`}</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          color: colors.ink,
          fontFamily,
          margin: 0,
          padding: 0,
        }}
      >
        <Section style={{ backgroundColor: colors.blue, height: "4px" }} />

        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "48px 24px 40px",
          }}
        >
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

          <Text style={{ ...baseTextStyle, fontSize: "18px", marginBottom: 10 }}>
            {customerName
              ? `${customerName}, your order was refunded.`
              : "Your order was refunded."}
          </Text>
          <Text
            style={{ ...baseTextStyle, fontSize: "15px", color: colors.inkSoft, marginBottom: 28 }}
          >
            {amount} has been returned to your original payment method. It usually appears on your
            statement within 5–10 business days, depending on your bank.
          </Text>

          <Text
            style={{
              ...baseTextStyle,
              fontSize: "13px",
              letterSpacing: "0.08em",
              color: colors.inkFaint,
              marginBottom: 32,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Order · {ref}
          </Text>

          <Hr style={{ borderColor: colors.rule, margin: "0 0 28px 0" }} />

          <Text
            style={{
              ...baseTextStyle,
              fontSize: "14px",
              color: colors.inkSoft,
              lineHeight: "1.7",
              marginBottom: 32,
            }}
          >
            If this refund was unexpected, or you&rsquo;d like to place the order again, just reply
            to this email and we&rsquo;ll sort it out.
          </Text>

          <Text
            style={{
              ...baseTextStyle,
              fontSize: "13px",
              color: colors.inkFaint,
              textAlign: "center" as const,
              lineHeight: "1.7",
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

export default Refunded;
