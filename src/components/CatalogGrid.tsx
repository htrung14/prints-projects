import PhotoCard from "./PhotoCard";
import type { Photo } from "@/lib/types";

export default function CatalogGrid({ photos }: { photos: Photo[] }) {
  return (
    <div
      className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3"
      style={{ gap: 0 }}
    >
      {photos.map((photo, i) => (
        <div
          key={photo.slug}
          className="stagger-in block"
          style={
            {
              ["--i" as string]: i,
              background: "var(--bg)",
              padding: "36px 44px",
            } as React.CSSProperties
          }
        >
          <PhotoCard photo={photo} />
        </div>
      ))}
    </div>
  );
}
