import type { Photo } from "./types";
import fixture from "@/data/photos.fixture.json";

export function getAllPhotos(): Photo[] {
  return fixture as Photo[];
}

export function getPhotoBySlug(slug: string): Photo | undefined {
  return getAllPhotos().find((p) => p.slug === slug);
}
