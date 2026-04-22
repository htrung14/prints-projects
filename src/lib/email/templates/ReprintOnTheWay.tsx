/**
 * Reprint acknowledgement — sent to the customer at reprint creation time.
 *
 * Fires from `POST /api/admin/orders/[id]/reprint` once the new order row
 * exists in the DB. Closes the loop for the customer: between "reported
 * damage to Thalia" and "tracking email arrives" there was previously a
 * silent gap that could stretch a full batch cycle. This email fills it.
 *
 * Scope-limited: no reason echoed back (the customer already knows why),
 * no reprint order ref (the customer thinks in terms of their original
 * order). Just an ack + timing expectation.
 *
 * On-brand: warm paper bg, French Blue accent bar, serif-italic header —
 * matches OrderConfirmation / Shipped.
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

export type ReprintOnTheWayProps = {
  /** The ORIGINAL order that is being reprinted (not the newly created reprint row). */
  originalOrder: Order;
};

export function ReprintOnTheWay({ originalOrder }: ReprintOnTheWayProps) {
  const ref = formatOrderReference(originalOrder);
  const customerName = originalOrder.shippingAddress?.name ?? originalOrder.customerName ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thaliabassim.com";

  return (
    <Html>
      <Head />
      <Preview>{`A replacement for order ${ref} is on the way.`}</Preview>
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
              ? `${customerName}, a replacement is on the way.`
              : "A replacement is on the way."}
          </Text>
          <Text
            style={{ ...baseTextStyle, fontSize: "15px", color: colors.inkSoft, marginBottom: 28 }}
          >
            We&rsquo;re remaking your print and sending it out in the next batch to the lab —
            usually within a week. You&rsquo;ll get a separate email with tracking as soon as it
            leaves the studio.
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
            Original order · {ref}
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
            No need to do anything on your end. The replacement is a fresh print from the same
            edition, sent to the same address on file. If anything else looks wrong, just reply to
            this email.
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

export default ReprintOnTheWay;
