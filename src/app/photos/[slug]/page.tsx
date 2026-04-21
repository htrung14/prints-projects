import { notFound } from "next/navigation";
import DetailPanel from "@/components/DetailPanel";
import RelatedPrints from "@/components/RelatedPrints";
import { getAllPhotos, getCatalogPhotos, getPhotoBySlug } from "@/lib/photos";

export function generateStaticParams() {
  return getAllPhotos().map((p) => ({ slug: p.slug }));
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
