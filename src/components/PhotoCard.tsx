import Link from "next/link";
import type { Photo } from "@/lib/types";

/**
 * Cargo-style catalog cell: full-bleed portrait image, plain caption below.
 * No letterbox, no border, no hover shadow. Edition status lives in the
 * detail overlay, not on the card.
 */
export default function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <Link href={`/photos/${photo.slug}`} className="group block">
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="mt-3 text-xs text-[var(--ink-strong)]">
        {photo.title}
        {photo.titleItalic ? (
          <>
            {" "}
            <em>{photo.titleItalic}</em>
          </>
        ) : null}
      </div>
    </Link>
  );
}
