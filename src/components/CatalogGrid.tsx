import PhotoCard from "./PhotoCard";
import type { Photo } from "@/lib/types";

export default function CatalogGrid({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 px-6 py-10 sm:grid-cols-2 md:px-8 lg:grid-cols-3">
      {photos.map((photo) => (
        <PhotoCard key={photo.slug} photo={photo} />
      ))}
    </div>
  );
}
