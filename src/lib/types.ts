/**
 * Core domain types for the print shop demo.
 * Mirrors the data model in docs/system-design.md Section 6, simplified for the static fixture.
 */

export type PaperType = "photo-rag" | "baryta" | "bamboo";

export type PaperOption = {
  id: PaperType;
  name: string; // display name, e.g. "Hahnemühle Photo Rag"
  surchargeCents: number; // added to base price
};

export type SizeOption = {
  id: string; // e.g. "8x10"
  label: string; // e.g. "8 × 10 in"
  multiplier: number; // base price × multiplier = size price (before paper)
};

export type Photo = {
  slug: string;
  referenceNumber: string; // e.g. "TB-024.07"
  title: string; // supports <em> via {italic} substring — UI renders <em>italic</em>
  titleItalic?: string; // optional italic portion, rendered inside <em> tags
  subtitle?: string; // e.g. "Lebanon"
  year: number;
  description: string[]; // paragraphs
  imageUrl: string; // public URL (Unsplash for demo)
  imageAlt: string;
  basePriceCents: number; // price at multiplier=1, paper surcharge=0
  sizes: SizeOption[];
  papers: PaperOption[];
  editionTotal: number; // 10 per design doc
  editionSold: number;
};

export type CartLine = {
  photoSlug: string;
  sizeId: string;
  paperId: PaperType;
  quantity: number;
};
