/**
 * Abandoned cart recovery — sent to the customer ~24h after they started
 * checkout but never completed payment.
 *
 * Fires from `checkout.session.expired` webhook. Single email, no
 * follow-ups. Suppressed if the customer already purchased (same email
 * in orders table) or received a recovery email in the last 7 days.
 *
 * Tone: warm nudge, not pressure. No discount code. The buyer at this
 * price point ($300+) is likely deliberating, not lost.
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
import { baseTextStyle, colors, fontFamily, serifFamily } from "./_shared";

export type AbandonedCartProps = {
  customerName: string | null;
  /** The photo title(s) from the cart metadata, if extractable. */
  cartSummary: string | null;
};

export function AbandonedCart({ customerName, cartSummary }: AbandonedCartProps) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thaliabassim.com";
  const greeting = customerName ? `${customerName}, you` : "You";

  return (
    <Html>
      <Head />
      <Preview>You left a print behind.</Preview>
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
            {greeting} left a print behind.
          </Text>
          <Text
            style={{ ...baseTextStyle, fontSize: "15px", color: colors.inkSoft, marginBottom: 28 }}
          >
            {cartSummary
              ? `Your ${cartSummary} is still available — editions are limited and printed to order.`
              : "The editions are limited and printed to order — your selection is still available."}
          </Text>

          <Section style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <Link
              href={`${siteUrl}/checkout`}
              style={{
                display: "inline-block",
                backgroundColor: colors.blue,
                color: colors.white,
                fontFamily,
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                padding: "14px 32px",
                textDecoration: "none",
              }}
            >
              Continue to checkout
            </Link>
          </Section>

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
            Each print is signed, numbered, and made to order on archival pigment paper. If you have
            any questions, just reply to this email.
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

export default AbandonedCart;
