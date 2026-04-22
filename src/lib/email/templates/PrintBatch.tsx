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
  /**
   * Signed URL that lands on `/dispatch/batch` — the "all-orders" page
   * where the printer can enter tracking for every row in one sitting.
   * Rendered as a prominent top-of-email CTA.
   */
  batchDispatchUrl: string;
};

const REPRINT_REASON_MAX = 80;

/**
 * Returns the reprint marker label ("REPRINT · <reason>" or "REPRINT") if
 * this order is a reprint, else null. Detects reprints via parentOrderId
 * first, falling back to the `notes` convention ("reprint: ...") for rows
 * that predate the parent_order_id column being populated.
 */
function getReprintLabel(order: Order): string | null {
  const isReprint =
    Boolean(order.parentOrderId) ||
    (typeof order.notes === "string" &&
      order.notes.trimStart().toLowerCase().startsWith("reprint:"));
  if (!isReprint) return null;

  const notes = order.notes ?? "";
  const match = notes.match(/^\s*reprint:\s*(.*?)(?:\.\s*parent order:.*)?$/i);
  const rawReason = match?.[1]?.trim() ?? "";
  if (!rawReason) return "REPRINT";

  const truncated =
    rawReason.length > REPRINT_REASON_MAX
      ? rawReason.slice(0, REPRINT_REASON_MAX) + "…"
      : rawReason;
  return `REPRINT · ${truncated}`;
}

export function PrintBatch({ orders, batchDispatchUrl }: PrintBatchProps) {
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
            <Text style={{ ...baseTextStyle, color: colors.inkSoft, margin: "0 0 22px" }}>
              {count} order{count === 1 ? "" : "s"} · {totalPrints} print
              {totalPrints === 1 ? "" : "s"} to fulfill. Open the batch page to print, ship, and
              submit tracking — or click into individual orders below.
            </Text>

            {/* Single top-level CTA. Per-order detail lives below as text links
                (not blue buttons) so the email has one visual focal point. */}
            <Link
              href={batchDispatchUrl}
              style={{
                display: "inline-block",
                background: colors.blue,
                color: colors.white,
                textDecoration: "none",
                padding: "12px 22px",
                fontSize: 14,
                letterSpacing: "0.03em",
                borderRadius: 2,
                marginBottom: 32,
              }}
            >
              Open batch · submit tracking →
            </Link>

            {orders.map(({ order, items, dispatchUrl }, idx) => {
              const ref = formatOrderReference(order);
              const orderPrintCount = items.reduce((a, i) => a + i.quantity, 0);
              const reprintLabel = getReprintLabel(order);
              return (
                <Section key={order.id} style={{ marginBottom: idx === count - 1 ? 0 : 28 }}>
                  {idx > 0 && (
                    <Hr style={{ borderColor: colors.rule, margin: "0 0 20px", borderWidth: 1 }} />
                  )}
                  {reprintLabel && (
                    <Text
                      style={{
                        ...baseTextStyle,
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: colors.blue,
                        fontWeight: 600,
                        margin: "0 0 6px",
                      }}
                    >
                      {reprintLabel}
                    </Text>
                  )}
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
                              Ed. {item.editionNumber}/{item.editionTotal}
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

                  <Link
                    href={dispatchUrl}
                    style={{
                      color: colors.blue,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      fontSize: 13,
                    }}
                  >
                    Open order {ref} · print files →
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
              Print files live on each order page — nothing is attached here. Reply with any
              questions.
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
