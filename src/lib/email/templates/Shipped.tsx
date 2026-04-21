/**
 * Shipped notification - to the customer.
 *
 * Sent when Rob submits tracking on the dispatch page (Track D triggers this
 * via ../send.ts#sendShippedNotification).
 *
 * If tracking_number or carrier is missing we still send a minimal note that
 * the print is on its way; the admin can resend once tracking is attached.
 */

import * as React from "react";
import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { Order } from "@/lib/types";
import { baseTextStyle, colors, fontFamily, formatOrderReference, labelStyle } from "./_shared";

export type ShippedProps = {
  order: Order;
};

export function Shipped({ order }: ShippedProps) {
  const ref = formatOrderReference(order);
  const tracking = order.trackingNumber?.trim() ?? "";
  const carrier = order.carrier?.trim() ?? "";
  const hasTracking = tracking.length > 0;

  return (
    <Html>
      <Head />
      <Preview>{`Order ${ref} shipped${hasTracking ? ` · ${tracking}` : ""}`}</Preview>
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

          <Text style={{ ...baseTextStyle, marginBottom: 24 }}>Your print has shipped.</Text>

          <Text style={{ ...baseTextStyle, marginBottom: 24 }}>Reference {ref}</Text>

          <Hr style={{ borderColor: colors.ink, opacity: 0.3, margin: "24px 0" }} />

          <Section style={{ marginBottom: 24 }}>
            <Text style={labelStyle}>Tracking</Text>
            {hasTracking ? (
              <Text style={baseTextStyle}>
                {carrier ? `${carrier} · ` : ""}
                {tracking}
              </Text>
            ) : (
              <Text style={baseTextStyle}>Tracking will follow in a separate note.</Text>
            )}
          </Section>

          <Text style={{ ...baseTextStyle, marginBottom: 12 }}>
            The print ships flat in archival packaging. Please inspect on arrival. If anything looks
            off, reply to this email within fourteen days of delivery.
          </Text>

          <Text style={baseTextStyle}>Thank you.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default Shipped;
