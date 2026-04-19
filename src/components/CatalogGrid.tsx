import PhotoCard from "./PhotoCard";
import type { Photo } from "@/lib/types";

export default function CatalogGrid({ photos }: { photos: Photo[] }) {
  return (
    <div
      className="grid grid-cols-1 min-[700px]:grid-cols-2 min-[1400px]:grid-cols-3"
      style={{
        gap: 0,
        borderTop: "1px solid var(--rule)",
        borderLeft: "1px solid var(--rule)",
      }}
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
              borderRight: "1px solid var(--rule)",
              borderBottom: "1px solid var(--rule)",
            } as React.CSSProperties
          }
        >
          <PhotoCard photo={photo} />
        </div>
      ))}
    </div>
  );
}
