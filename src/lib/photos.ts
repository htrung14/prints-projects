import type { Photo } from "./types";
import fixture from "@/data/photos.fixture.json";

export function getAllPhotos(): Photo[] {
  return fixture as Photo[];
}

// Photos visible to the public: grid, hero, related. Excludes anything
// flagged `isPublished: false` (hidden test items, sold-out unpublished).
export function getCatalogPhotos(): Photo[] {
  return getAllPhotos().filter((p) => p.isPublished !== false);
}

export function getPhotoBySlug(slug: string): Photo | undefined {
  return getAllPhotos().find((p) => p.slug === slug);
}
