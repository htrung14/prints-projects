import PhotoCard from "./PhotoCard";
import type { Photo } from "@/lib/types";

/**
 * Cargo 3-column portrait grid. Mobile collapses to 1-col, mid to 2-col.
 * Generous gutters, no page padding at the grid level — handled by the outer
 * layout so the gutters remain consistent with header/footer rhythm.
 */
export default function CatalogGrid({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-14 px-6 py-10 sm:grid-cols-2 md:px-10 lg:grid-cols-3">
      {photos.map((photo) => (
        <PhotoCard key={photo.slug} photo={photo} />
      ))}
    </div>
  );
}
