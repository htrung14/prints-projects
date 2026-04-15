import Link from "next/link";
import type { Photo } from "@/lib/types";
import { editionRemaining, isSoldOut } from "@/lib/pricing";

export default function PhotoCard({ photo }: { photo: Photo }) {
  const remaining = editionRemaining(photo);
  const soldOut = isSoldOut(photo);
  return (
    <Link href={`/photos/${photo.slug}`} className="group block">
      <div className="aspect-[4/5] overflow-hidden bg-[var(--bg-soft)]">
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
          loading="lazy"
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-xs">
        <span className="text-[var(--ink-strong)]">
          {photo.title}
          {photo.titleItalic ? (
            <>
              {" "}
              <em>{photo.titleItalic}</em>
            </>
          ) : null}
        </span>
        <span className="text-[var(--ink-faint)]">
          {soldOut ? "Sold out" : `${remaining} of ${photo.editionTotal} left`}
        </span>
      </div>
    </Link>
  );
}
