import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DetailPanel from "@/components/DetailPanel";
import RelatedPrints from "@/components/RelatedPrints";
import { getAllPhotos, getCatalogPhotos, getPhotoBySlug } from "@/lib/photos";

export function generateStaticParams() {
  // Only pre-generate published slugs. The test item remains accessible by
  // direct URL (fall back to dynamic rendering), but it won't be in the
  // static manifest or sitemap.
  return getCatalogPhotos().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const photo = getPhotoBySlug(slug);
  if (!photo) return {};
  // Unpublished photos (test items, sold-out hidden) must not be indexed
  // by search engines or previewed on social.
  if (photo.isPublished === false) {
    return { robots: { index: false, follow: false } };
  }
  return {};
}

export default async function PhotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const photo = getPhotoBySlug(slug);
  if (!photo) notFound();
  // Related-prints rail only shows publicly listed photos, never the test item.
  const all = getCatalogPhotos();
  return (
    <>
      <DetailPanel photo={photo} />
      <RelatedPrints current={photo} all={all} />
    </>
  );
}
