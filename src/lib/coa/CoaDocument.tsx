/**
 * Certificate of Authenticity - @react-pdf/renderer document.
 *
 * Layout: 8.5x11 portrait.
 *   Left 3/5 - image area (placeholder rectangle in v1 until the master
 *               file lands locally; the master lives in R2 and is resolved
 *               by Track D at dispatch time).
 *   Right 2/5 - metadata: title, edition `N of 10`, size, paper, date,
 *               reference number, plus a provenance block.
 *
 * Restraint per the Notion research-report §3 anti-patterns:
 *   - no gold foil
 *   - no flourish fonts
 *   - no ornamental borders
 *
 * Brand match (2026-04-21): modest alignment with the rest of the site —
 *   - thin French Blue accent rule at the top (matches email templates)
 *   - serif italic for the photo title (matches BuyUI + OrderConfirmation
 *     headline typography, approximated with @react-pdf's built-in
 *     `Times-Italic` since we avoid `Font.register` to keep render
 *     network-free)
 *   - Helvetica retained for labels + meta for legibility on paper
 *
 * Background stays white for printability; the site's warm paper tone
 * doesn't reproduce reliably on a laser printer.
 */

import * as React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Order, OrderItem } from "@/lib/types";

export type CoaDocumentProps = {
  order: Order;
  item: OrderItem;
  /**
   * Customer-facing reference (`TB-YYYY-NNNN`). Passed in rather than
   * recomputed so the PDF matches the order confirmation email.
   */
  referenceNumber: string;
  /**
   * ISO date string shown in the metadata block. Typically
   * `order.createdAt`, but callers can override (e.g. regen date).
   */
  dateIso: string;
};

// Solid ink on pure white paper — the print is legible on any printer regardless
// of the site's warm-paper web tone, which wouldn't reproduce reliably.
const INK = "#0c0b0a";
const INK_SOFT = "#4a4644";
// French Blue — the site accent. Used sparingly here: one thin top rule.
const FRENCH_BLUE = "#0072BB";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingRight: 36,
    paddingBottom: 36,
    paddingLeft: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
  },
  // Thin blue accent rule at the very top of the page, matching the email
  // templates' blue accent bar. Page padding accommodates it.
  accentRule: {
    height: 4,
    backgroundColor: FRENCH_BLUE,
    marginBottom: 28,
    marginLeft: -36,
    marginRight: -36,
  },
  body: {
    flexDirection: "row",
  },
  imageColumn: {
    flex: 3,
    marginRight: 24,
    // Placeholder rectangle. Replaced when the master file is resolvable.
    borderWidth: 1,
    borderColor: INK,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  imagePlaceholderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
  },
  metaColumn: {
    flex: 2,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  metaTop: {
    flexDirection: "column",
  },
  // Artist name — serif italic mirrors the site headline typography
  // (Times-Italic is @react-pdf's built-in approximation of our web serif).
  header: {
    fontFamily: "Times-Italic",
    fontSize: 16,
    marginBottom: 24,
    color: INK,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: INK_SOFT,
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  // Photo title — serif italic for editorial warmth, matches BuyUI + the
  // order-confirmation email headline treatment.
  title: {
    fontFamily: "Times-Italic",
    fontSize: 15,
    marginBottom: 6,
    color: INK,
  },
  edition: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginTop: 6,
    marginBottom: 6,
  },
  signatureBlock: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: INK,
    paddingTop: 8,
  },
  smallPrint: {
    fontFamily: "Helvetica",
    fontSize: 8,
    marginTop: 4,
    color: INK_SOFT,
    lineHeight: 1.5,
  },
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CoaDocument({ order, item, referenceNumber, dateIso }: CoaDocumentProps) {
  return (
    <Document
      title={`COA - ${referenceNumber}`}
      author="Thalia Bassim"
      subject={`Certificate of Authenticity for ${item.photoTitle}`}
      creator="Thalia Bassim"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.accentRule} />

        <View style={styles.body}>
          <View style={styles.imageColumn}>
            <Text style={styles.imagePlaceholderText}>Print preview</Text>
            <Text style={[styles.smallPrint, { marginTop: 6 }]}>{item.photoTitle}</Text>
          </View>

          <View style={styles.metaColumn}>
            <View style={styles.metaTop}>
              <Text style={styles.header}>Thalia Bassim</Text>

              <Text style={styles.label}>Title</Text>
              <Text style={styles.title}>{item.photoTitle}</Text>

              <Text style={styles.label}>Edition</Text>
              <Text style={styles.edition}>
                {item.editionNumber} of {item.editionTotal}
              </Text>

              <Text style={styles.label}>Size</Text>
              <Text style={styles.value}>{item.sizeLabel}</Text>

              <Text style={styles.label}>Paper</Text>
              <Text style={styles.value}>{item.paperName}</Text>

              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{formatDate(dateIso)}</Text>

              <Text style={styles.label}>Reference</Text>
              <Text style={styles.value}>{referenceNumber}</Text>

              <Text style={styles.label}>Order</Text>
              <Text style={styles.value}>{order.customerName}</Text>
            </View>

            <View style={styles.signatureBlock}>
              <Text style={styles.label}>Provenance</Text>
              <Text style={styles.smallPrint}>
                Printed to order on archival pigment paper. Issued against the edition register held
                by Thalia Bassim. This certificate is the authoritative record of the print&apos;s
                edition number.
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default CoaDocument;
