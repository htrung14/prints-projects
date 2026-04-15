import { notFound } from "next/navigation";
import PhotoModal from "@/components/PhotoModal";
import DetailPanel from "@/components/DetailPanel";
import { getPhotoBySlug, getAllPhotos } from "@/lib/photos";

export function generateStaticParams() {
  return getAllPhotos().map((p) => ({ slug: p.slug }));
}

export default async function InterceptedPhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const photo = getPhotoBySlug(slug);
  if (!photo) notFound();
  return (
    <PhotoModal>
      <DetailPanel photo={photo} modal />
    </PhotoModal>
  );
}
