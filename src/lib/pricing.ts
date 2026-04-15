import type { PaperType, Photo } from "./types";

export function priceCents(photo: Photo, sizeId: string, paperId: PaperType): number {
  const size = photo.sizes.find((s) => s.id === sizeId) ?? photo.sizes[0];
  const paper = photo.papers.find((p) => p.id === paperId) ?? photo.papers[0];
  return Math.round(photo.basePriceCents * size.multiplier) + paper.surchargeCents;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function editionRemaining(photo: Photo): number {
  return Math.max(0, photo.editionTotal - photo.editionSold);
}

export function isSoldOut(photo: Photo): boolean {
  return editionRemaining(photo) <= 0;
}
