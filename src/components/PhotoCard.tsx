import Link from "next/link";
import type { Photo } from "@/lib/types";
import { isSoldOut } from "@/lib/pricing";

/**
 * Cargo-style catalog cell: full-bleed portrait image, two-line caption.
 * Hover affordance: image opacity shift + title underline + arrow on the
 * caption so the card reads as clickable.
 */
export default function PhotoCard({ photo }: { photo: Photo }) {
  const soldOut = isSoldOut(photo);
  return (
    <Link href={`/photos/${photo.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {soldOut ? (
          <span className="absolute left-3 top-3 bg-ink-strong px-2 py-1 text-[10px] uppercase tracking-widest text-bg">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3 text-xs">
        <span className="text-ink-strong group-hover:underline">
          {photo.title}
          {photo.titleItalic ? (
            <>
              {" "}
              <em>{photo.titleItalic}</em>
            </>
          ) : null}
        </span>
        <span
          className="text-ink-faint transition-transform group-hover:translate-x-0.5"
          aria-hidden
        >
          →
        </span>
      </div>
      <div className="mt-1 text-xs text-ink-faint">
        {photo.year} · Edition of {photo.editionTotal}
      </div>
    </Link>
  );
}
