/**
 * Shipped notification — sent to the customer.
 *
 * Fires when an admin transitions an order to `shipped` via the order
 * detail page (see `src/app/api/admin/orders/[id]/transition/route.ts`).
 * The status change persists `tracking_number` + `carrier` first, so this
 * template always has both fields available when `hasTracking` is true.
 *
 * On-brand: warm paper bg (#faf9f6), French Blue accent (#0072BB),
 * serif-italic header, single-column card — matches OrderConfirmation.
 *
 * If carrier is missing or unrecognized we fall back to plain tracking
 * text rather than render a broken link. Known carriers: USPS, UPS, DHL,
 * FedEx (case-insensitive).
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
  labelStyle,
  serifFamily,
} from "./_shared";

export type ShippedProps = {
  order: Order;
};

/**
 * Map common carrier names → public tracking-page URL.
 * Returns `null` when the carrier isn't recognized; callers render the
 * bare tracking number instead of a broken link.
 */
export function trackingUrlFor(carrier: string, tracking: string): string | null {
  const c = carrier.trim().toLowerCase();
  const t = encodeURIComponent(tracking.trim());
  if (!t) return null;
  if (c === "usps") return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
  if (c === "ups") return `https://www.ups.com/track?tracknum=${t}`;
  if (c === "dhl") return `https://www.dhl.com/en/express/tracking.html?AWB=${t}`;
  if (c === "fedex") return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
  return null;
}

export function Shipped({ order }: ShippedProps) {
  const ref = formatOrderReference(order);
  const tracking = order.trackingNumber?.trim() ?? "";
  const carrier = order.carrier?.trim() ?? "";
  const hasTracking = tracking.length > 0;
  const trackingUrl = hasTracking && carrier ? trackingUrlFor(carrier, tracking) : null;
  const customerName = order.shippingAddress?.name ?? order.customerName ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thaliabassim.com";

  return (
    <Html>
      <Head />
      <Preview>{`Order ${ref} shipped${hasTracking ? ` · ${tracking}` : ""}`}</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          color: colors.ink,
          fontFamily,
          margin: 0,
          padding: 0,
        }}
      >
        {/* Blue accent bar — matches OrderConfirmation */}
        <Section style={{ backgroundColor: colors.blue, height: "4px" }} />

        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "48px 24px 40px",
          }}
        >
          {/* Serif-italic header */}
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
            {customerName ? `${customerName}, your print has shipped.` : "Your print has shipped."}
          </Text>
          <Text style={{ ...baseTextStyle, color: colors.inkSoft, marginBottom: 24 }}>
            {hasTracking
              ? "Tracking is below. Please inspect on arrival."
              : "Tracking will follow in a separate note as soon as it's available."}
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

          {/* Tracking block */}
          <Section style={{ marginBottom: 28 }}>
            <Text style={{ ...labelStyle, marginBottom: 12 }}>Tracking</Text>
            {hasTracking ? (
              <>
                <Text
                  style={{
                    ...baseTextStyle,
                    fontSize: "14px",
                    margin: "0 0 4px 0",
                  }}
                >
                  {carrier ? `${carrier} · ` : ""}
                  <span style={{ fontFamily: "ui-monospace, monospace" }}>{tracking}</span>
                </Text>
                {trackingUrl ? (
                  <Section style={{ marginTop: 20 }}>
                    <Link
                      href={trackingUrl}
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
                ) : (
                  <Text
                    style={{
                      ...baseTextStyle,
                      fontSize: "12px",
                      color: colors.inkFaint,
                      margin: "6px 0 0 0",
                    }}
                  >
                    Tracking # {tracking}
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ ...baseTextStyle, fontSize: "14px" }}>
                Tracking will follow in a separate note.
              </Text>
            )}
          </Section>

          <Hr style={{ borderColor: colors.rule, margin: "0 0 28px 0" }} />

          {/* Care note */}
          <Text
            style={{
              ...baseTextStyle,
              fontSize: "13px",
              color: colors.inkSoft,
              lineHeight: "1.7",
              marginBottom: 32,
            }}
          >
            The print ships flat in archival packaging. Please inspect on arrival — if anything
            looks off, reply to this email within fourteen days of delivery and we will make it
            right.
          </Text>

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

export default Shipped;
