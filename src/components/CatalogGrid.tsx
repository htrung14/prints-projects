import PhotoCard from "./PhotoCard";
import type { Photo } from "@/lib/types";

/**
 * Cargo 3-column portrait grid. Mobile collapses to 1-col, mid to 2-col.
 * Cards fade and rise in with a small stagger on first paint — see the
 * .stagger-in rule in globals.css. Animation is skipped automatically
 * when prefers-reduced-motion is set.
 */
export default function CatalogGrid({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-14 px-6 py-10 sm:grid-cols-2 md:px-10 lg:grid-cols-3">
      {photos.map((photo, i) => (
        <div
          key={photo.slug}
          className="stagger-in"
          style={{ ["--i" as string]: i } as React.CSSProperties}
        >
          <PhotoCard photo={photo} />
        </div>
      ))}
    </div>
  );
}
