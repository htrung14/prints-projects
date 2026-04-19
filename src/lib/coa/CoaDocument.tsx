/**
 * Certificate of Authenticity - @react-pdf/renderer document.
 *
 * Layout: 8.5x11 portrait.
 *   Left 3/5 - image area (placeholder rectangle in v1 until the master
 *               file lands locally; the master lives in R2 and is resolved
 *               by Track D at dispatch time).
 *   Right 2/5 - metadata: title, edition `N of 10`, size, paper, date,
 *               reference number, plus a signature block.
 *
 * Restraint per the Notion research-report §3 anti-patterns:
 *   - no gold foil
 *   - no flourish fonts
 *   - no ornamental borders
 *
 * Typography: one face, stayed consistent. @react-pdf ships Helvetica as a
 * built-in PDF base font; we reference it by name and do NOT `Font.register`
 * an external file (no network access at render time, no bundling surprises
 * on Vercel). Weight-900 lookalike emulated by the `Helvetica-Bold` variant.
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

const TEXT_COLOR = "#000000";
// Use solid black in the PDF (vs rgba on the web) so the print reads cleanly
// on paper. Low opacity on web = low contrast on pigment.

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT_COLOR,
  },
  imageColumn: {
    flex: 3,
    marginRight: 24,
    // Placeholder rectangle. Replaced when the master file is resolvable.
    borderWidth: 1,
    borderColor: TEXT_COLOR,
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
  header: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 24,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontFamily: "Helvetica",
    fontSize: 11,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginBottom: 6,
  },
  titleItalic: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 14,
    marginBottom: 6,
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
    borderTopColor: TEXT_COLOR,
    paddingTop: 8,
  },
  signaturePending: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9,
    marginTop: 4,
  },
  smallPrint: {
    fontFamily: "Helvetica",
    fontSize: 8,
    marginTop: 4,
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
      </Page>
    </Document>
  );
}

export default CoaDocument;
