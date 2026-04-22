/**
 * Printer pick-list — a paper hand-out Michael can take to his workstation.
 *
 * One page per batch (or more if orders spill). Each order block shows:
 *   - Reprint marker when applicable (French Blue, uppercase)
 *   - Order short-id + customer name + status
 *   - Ship-to address (copy-ready, multi-line)
 *   - Items: □ photo title · size · paper · edition number · qty
 *
 * Pure typographic restraint — no photo thumbnails, no color accents beyond
 * the reprint marker. @react-pdf built-in fonts only (Helvetica family) so
 * the render has no network dependency.
 */

import * as React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Address, Order, OrderItem } from "@/lib/types";

export type PickListDocumentProps = {
  orders: Array<{
    order: Order;
    items: OrderItem[];
    reprintLabel: string | null;
  }>;
  generatedAt: string;
};

const INK = "#0c0b0a";
const INK_SOFT = "#4a4644";
const RULE = "#d9d4cd";
const FRENCH_BLUE = "#0072bb";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    paddingTop: 42,
    paddingRight: 42,
    paddingBottom: 42,
    paddingLeft: 42,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
  },
  masthead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderBottomWidth: 1,
    borderBottomColor: INK,
    paddingBottom: 10,
    marginBottom: 22,
  },
  mastheadTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: INK,
  },
  mastheadMeta: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INK_SOFT,
  },
  order: {
    flexDirection: "column",
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    paddingTop: 14,
    paddingBottom: 14,
  },
  reprintMarker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: FRENCH_BLUE,
    marginBottom: 4,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 8,
  },
  orderRef: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: INK,
  },
  customerName: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: INK,
  },
  statusPill: {
    fontFamily: "Helvetica",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: INK_SOFT,
    borderWidth: 0.5,
    borderColor: RULE,
    paddingTop: 1,
    paddingRight: 6,
    paddingBottom: 1,
    paddingLeft: 6,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 28,
  },
  sectionCol: {
    flex: 1,
    flexDirection: "column",
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: INK_SOFT,
    marginBottom: 4,
  },
  addressLine: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    lineHeight: 1.45,
  },
  item: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 3,
  },
  itemCheckbox: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: INK_SOFT,
    minWidth: 12,
  },
  itemText: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    flex: 1,
    lineHeight: 1.4,
  },
  itemMeta: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INK_SOFT,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: INK_SOFT,
    textAlign: "center",
  },
});

function formatAddress(a: Address | null): string[] {
  if (!a) return ["(no shipping address)"];
  const cityLine = [a.city, a.state, a.postalCode].filter(Boolean).join(", ");
  return [
    a.name,
    a.line1,
    a.line2 && a.line2.length > 0 ? a.line2 : null,
    cityLine,
    a.country,
  ].filter((l): l is string => Boolean(l && l.length > 0));
}

export function PickListDocument({ orders, generatedAt }: PickListDocumentProps) {
  const totalPrints = orders.reduce(
    (acc, o) => acc + o.items.reduce((n, i) => n + i.quantity, 0),
    0
  );
  const reprintCount = orders.filter((o) => o.reprintLabel !== null).length;

  return (
    <Document
      title={`Print batch pick-list · ${orders.length} orders`}
      author="Thalia Bassim"
      subject="Printer pick-list for batch dispatch"
      creator="Thalia Bassim"
    >
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.masthead}>
          <Text style={styles.mastheadTitle}>Print batch · pick-list</Text>
          <Text style={styles.mastheadMeta}>
            {orders.length} order{orders.length === 1 ? "" : "s"} · {totalPrints} print
            {totalPrints === 1 ? "" : "s"}
            {reprintCount > 0 ? ` · ${reprintCount} reprint${reprintCount === 1 ? "" : "s"}` : ""} ·
            Generated {generatedAt}
          </Text>
        </View>

        {orders.map(({ order, items, reprintLabel }) => {
          const addressLines = formatAddress(order.shippingAddress);
          const shortRef = order.id.slice(0, 8).toUpperCase();
          return (
            <View key={order.id} style={styles.order} wrap={false}>
              {reprintLabel ? <Text style={styles.reprintMarker}>{reprintLabel}</Text> : null}
              <View style={styles.orderHeader}>
                <Text style={styles.orderRef}>{shortRef}</Text>
                <Text style={styles.customerName}>{order.customerName || "(no name)"}</Text>
                <Text style={styles.statusPill}>{order.status.replace(/_/g, " ")}</Text>
              </View>

              <View style={styles.sectionRow}>
                <View style={styles.sectionCol}>
                  <Text style={styles.sectionLabel}>Print</Text>
                  {items.map((item) => (
                    <View key={item.id} style={styles.item}>
                      <Text style={styles.itemCheckbox}>☐</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemText}>{item.photoTitle}</Text>
                        <Text style={styles.itemMeta}>
                          {item.sizeLabel} · {item.paperName} · Ed. {item.editionNumber}/
                          {item.editionTotal}
                          {item.quantity > 1 ? ` · Qty ${item.quantity}` : ""}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.sectionCol}>
                  <Text style={styles.sectionLabel}>Ship to</Text>
                  {addressLines.map((line, i) => (
                    <Text key={i} style={styles.addressLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        <Text style={styles.footer}>
          Thalia Bassim · thaliabassim.com · printed to order on archival pigment paper
        </Text>
      </Page>
    </Document>
  );
}

export default PickListDocument;
