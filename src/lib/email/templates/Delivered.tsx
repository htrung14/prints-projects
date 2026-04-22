/**
 * Delivery confirmation — sent to the customer when an order transitions
 * to `delivered`.
 *
 * Primary purpose: start the 14-day inspection clock. The terms say
 * "report damage within 14 days of delivery" — this email is the
 * customer's notice that the clock began.
 *
 * Secondary: care instructions so the print lasts 100+ years.
 *
 * On-brand: warm paper bg, French Blue accent, serif-italic header.
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
import { baseTextStyle, colors, fontFamily, formatOrderReference, serifFamily } from "./_shared";

export type DeliveredProps = {
  order: Order;
};

export function Delivered({ order }: DeliveredProps) {
  const ref = formatOrderReference(order);
  const customerName = order.shippingAddress?.name ?? order.customerName ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thaliabassim.com";

  return (
    <Html>
      <Head />
      <Preview>{`Order ${ref} delivered — please inspect your print`}</Preview>
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
            {customerName ? `${customerName}, your print has arrived.` : "Your print has arrived."}
          </Text>
          <Text
            style={{ ...baseTextStyle, fontSize: "15px", color: colors.inkSoft, marginBottom: 28 }}
          >
            Please inspect it carefully. If anything looks off — creased corners, scratches, colour
            shift — reply to this email within fourteen days of delivery and we&rsquo;ll make it
            right.
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

          <Text style={{ ...baseTextStyle, fontSize: "14px", fontWeight: 600, marginBottom: 10 }}>
            Care
          </Text>
          <Text
            style={{
              ...baseTextStyle,
              fontSize: "14px",
              color: colors.inkSoft,
              lineHeight: "1.7",
              marginBottom: 32,
            }}
          >
            Display away from direct sunlight and high humidity. The archival pigment ink is rated
            for 100+ years of lightfastness under standard indoor conditions. Handle by the edges or
            use cotton gloves. If you frame the print, use UV-protective glass and acid-free
            matting.
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

export default Delivered;
