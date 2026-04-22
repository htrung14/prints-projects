/**
 * Certificate of Authenticity — @react-pdf/renderer document.
 *
 * Landscape Letter. Lemaire-style product-spec layout (matches the site's
 * PDPs): full-bleed photo left, metadata right. Typography is all Helvetica
 * variants — no font mixing — so size and weight do the hierarchy work.
 *
 * One <Page> is rendered per item, so a multi-line order produces a single
 * multi-page PDF. Single-item orders still produce a one-page PDF.
 *
 * Constraints:
 *   - No `Font.register`: keeps render network-free on Vercel and avoids
 *     bundling surprises. Site fonts (Suisse Intl, Favorit) would need to
 *     be bundled as .otf for @react-pdf; a v1.1 move if the user wants
 *     strict brand-font parity.
 *   - Pure white background — warm paper tone doesn't reproduce reliably
 *     on a standard laser printer.
 *   - No brand colour: ink + whitespace only.
 */

import * as React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Order, OrderItem } from "@/lib/types";

export type CoaDocumentProps = {
  order: Order;
  /** One <Page> rendered per item. */
  items: OrderItem[];
  /** Customer-facing reference (TB-YYYY-NNNN). */
  referenceNumber: string;
  /** ISO date string shown in the metadata strip. */
  dateIso: string;
  /**
   * Optional per-item print thumbnail source (absolute URL or Buffer). Keyed
   * by item id. When present for a given item, renders in the image column;
   * otherwise a placeholder text box shows the photo title.
   */
  imageSrcByItemId?: Record<string, string>;
};

const INK = "#0c0b0a";
const INK_SOFT = "#4a4644";
const RULE = "#e6e3dd";

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
  },
  imageColumn: {
    flexBasis: "60%",
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 36,
  },
  imageFill: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  imagePlaceholderText: {
    fontFamily: "Helvetica",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: INK_SOFT,
  },
  rightColumn: {
    flexBasis: "40%",
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingRight: 42,
    paddingBottom: 54,
    paddingLeft: 42,
  },
  // --- Top block ---
  topBlock: {
    flexDirection: "column",
  },
  artistName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: INK,
    marginBottom: 6,
  },
  photoTitle: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 13,
    color: INK_SOFT,
    marginBottom: 22,
  },
  kicker: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: INK,
    paddingBottom: 10,
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: INK,
  },
  // --- Metadata rows ---
  metaBlock: {
    flexDirection: "column",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: 9,
    paddingBottom: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  metaLabel: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK_SOFT,
  },
  metaValue: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    textAlign: "right",
  },
  // --- Bottom block ---
  bottomBlock: {
    flexDirection: "column",
  },
  provenanceLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: INK,
    marginBottom: 6,
  },
  provenanceBody: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.55,
    color: INK_SOFT,
    marginBottom: 20,
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

type PageProps = {
  order: Order;
  item: OrderItem;
  referenceNumber: string;
  dateIso: string;
  imageSrc?: string;
};

function CoaPage({ order, item, referenceNumber, dateIso, imageSrc }: PageProps) {
  return (
    <Page size="LETTER" orientation="landscape" style={styles.page}>
      <View style={styles.imageColumn}>
        {imageSrc ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image has no alt prop
          <Image src={imageSrc} style={styles.imageFill} />
        ) : (
          <Text style={styles.imagePlaceholderText}>{item.photoTitle}</Text>
        )}
      </View>

      <View style={styles.rightColumn}>
        <View style={styles.topBlock}>
          <Text style={styles.artistName}>Thalia Bassim</Text>
          <Text style={styles.photoTitle}>{item.photoTitle}</Text>
          <Text style={styles.kicker}>Certificate of Authenticity</Text>

          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Edition</Text>
              <Text style={styles.metaValue}>
                {item.editionNumber} of {item.editionTotal}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Size</Text>
              <Text style={styles.metaValue}>{item.sizeLabel}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Paper</Text>
              <Text style={styles.metaValue}>{item.paperName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(dateIso)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Reference</Text>
              <Text style={styles.metaValue}>{referenceNumber}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Issued to</Text>
              <Text style={styles.metaValue}>{order.customerName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomBlock}>
          <Text style={styles.provenanceLabel}>Provenance</Text>
          <Text style={styles.provenanceBody}>
            Printed to order on archival pigment paper. Numbered and signed by hand on the print
            itself. Issued against the edition register held by Thalia Bassim.
          </Text>
        </View>
      </View>
    </Page>
  );
}

export function CoaDocument({
  order,
  items,
  referenceNumber,
  dateIso,
  imageSrcByItemId,
}: CoaDocumentProps) {
  const docTitle = items.length > 1 ? `COAs - ${referenceNumber}` : `COA - ${referenceNumber}`;
  const docSubject =
    items.length > 1
      ? `Certificates of Authenticity for order ${referenceNumber}`
      : `Certificate of Authenticity for ${items[0]?.photoTitle ?? referenceNumber}`;
  return (
    <Document title={docTitle} author="Thalia Bassim" subject={docSubject} creator="Thalia Bassim">
      {items.map((item) => (
        <CoaPage
          key={item.id}
          order={order}
          item={item}
          referenceNumber={referenceNumber}
          dateIso={dateIso}
          imageSrc={imageSrcByItemId?.[item.id]}
        />
      ))}
    </Document>
  );
}

export default CoaDocument;
