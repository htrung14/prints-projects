import { notFound } from "next/navigation";
import DetailPanel from "@/components/DetailPanel";
import { getAllPhotos, getPhotoBySlug } from "@/lib/photos";

export function generateStaticParams() {
  return getAllPhotos().map((p) => ({ slug: p.slug }));
}

export default async function PhotoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const photo = getPhotoBySlug(slug);
  if (!photo) notFound();
  return <DetailPanel photo={photo} />;
}
