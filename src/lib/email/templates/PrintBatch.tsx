/**
 * Weekly print-batch email — sent to the printer with all orders to fulfill.
 *
 * One email per batch dispatch, not per order. Lists each order inline with
 * items and a dispatch link; no file attachments (files live behind signed
 * URLs on the dispatch page).
 *
 * On-brand: warm paper bg, French Blue accent, serif italic header.
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
import type { Order, OrderItem } from "@/lib/types";
import {
  baseTextStyle,
  colors,
  fontFamily,
  formatOrderReference,
  formatUsdFromCents,
  serifFamily,
} from "./_shared";

export type PrintBatchProps = {
  orders: Array<{
    order: Order;
    items: OrderItem[];
    dispatchUrl: string;
  }>;
};

function formatShipTo(order: Order): string {
  const a = order.shippingAddress;
  if (!a) return "(no shipping address)";
  return [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
    a.country,
  ]
    .filter((l): l is string => Boolean(l && l.length > 0))
    .join(" · ");
}

export function PrintBatch({ orders }: PrintBatchProps) {
  const count = orders.length;
  const totalPrints = orders.reduce(
    (acc, o) => acc + o.items.reduce((a, i) => a + i.quantity, 0),
    0
  );

  return (
    <Html>
      <Head />
      <Preview>{`Print batch — ${count} order${count === 1 ? "" : "s"}, ${totalPrints} print${totalPrints === 1 ? "" : "s"}`}</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          color: colors.ink,
          fontFamily,
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: 640,
            margin: "0 auto",
            background: colors.white,
            border: `1px solid ${colors.rule}`,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div style={{ background: colors.blue, height: 6 }} />

          <div style={{ padding: "36px 32px 28px" }}>
            <Text
              style={{
                fontFamily: serifFamily,
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 26,
                lineHeight: 1.2,
                color: colors.ink,
                margin: "0 0 8px",
              }}
            >
              New batch ready
            </Text>
            <Text style={{ ...baseTextStyle, color: colors.inkSoft, margin: "0 0 28px" }}>
              {count} order{count === 1 ? "" : "s"} · {totalPrints} print
              {totalPrints === 1 ? "" : "s"} total. Each order below has its own dispatch link with
              the print file and shipping details.
            </Text>

            {orders.map(({ order, items, dispatchUrl }, idx) => {
              const ref = formatOrderReference(order);
              const orderPrintCount = items.reduce((a, i) => a + i.quantity, 0);
              return (
                <Section key={order.id} style={{ marginBottom: idx === count - 1 ? 0 : 28 }}>
                  {idx > 0 && (
                    <Hr style={{ borderColor: colors.rule, margin: "0 0 20px", borderWidth: 1 }} />
                  )}
                  <Text
                    style={{
                      ...baseTextStyle,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: colors.inkFaint,
                      margin: "0 0 6px",
                    }}
                  >
                    Order {ref}
                  </Text>
                  <Text
                    style={{
                      fontFamily: serifFamily,
                      fontStyle: "italic",
                      fontSize: 18,
                      color: colors.ink,
                      margin: "0 0 10px",
                    }}
                  >
                    {order.customerName || "(no name)"}
                  </Text>

                  <table
                    style={{ width: "100%", borderCollapse: "collapse", margin: "6px 0 14px" }}
                  >
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} style={{ borderTop: `1px solid ${colors.rule}` }}>
                          <td style={{ padding: "8px 0", verticalAlign: "top" }}>
                            <Text style={{ ...baseTextStyle, margin: 0 }}>{item.photoTitle}</Text>
                            <Text
                              style={{
                                ...baseTextStyle,
                                fontSize: 12,
                                color: colors.inkFaint,
                                margin: 0,
                              }}
                            >
                              {item.sizeLabel} · {item.paperName} · Ed. {item.editionNumber}/
                              {item.editionTotal}
                            </Text>
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              textAlign: "right",
                              verticalAlign: "top",
                              fontFamily: "ui-monospace, monospace",
                              fontSize: 13,
                            }}
                          >
                            × {item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Text
                    style={{
                      ...baseTextStyle,
                      fontSize: 12,
                      color: colors.inkSoft,
                      margin: "0 0 14px",
                    }}
                  >
                    <span style={{ color: colors.inkFaint }}>Ship to:</span> {formatShipTo(order)}
                  </Text>

                  <Link
                    href={dispatchUrl}
                    style={{
                      display: "inline-block",
                      background: colors.blue,
                      color: colors.white,
                      textDecoration: "none",
                      padding: "10px 20px",
                      fontSize: 13,
                      letterSpacing: "0.03em",
                      borderRadius: 2,
                    }}
                  >
                    Open order {ref} →
                  </Link>
                </Section>
              );
            })}

            <Hr style={{ borderColor: colors.rule, margin: "28px 0 20px", borderWidth: 1 }} />
            <Text
              style={{
                ...baseTextStyle,
                fontSize: 12,
                color: colors.inkFaint,
                margin: 0,
              }}
            >
              Reply to this email with any questions. Files download from the order pages; links
              expire in 7 days — ping Thalia to regenerate.
            </Text>
          </div>
        </Container>

        <Text
          style={{
            ...baseTextStyle,
            fontFamily: serifFamily,
            fontStyle: "italic",
            textAlign: "center",
            color: colors.inkFaint,
            fontSize: 11,
            marginTop: 20,
          }}
        >
          Thalia Bassim
        </Text>
      </Body>
    </Html>
  );
}

export default PrintBatch;
