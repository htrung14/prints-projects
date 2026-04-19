import Link from "next/link";
import type { Photo } from "@/lib/types";
import { formatUsd, isSoldOut } from "@/lib/pricing";

export default function PhotoCard({ photo }: { photo: Photo }) {
  const soldOut = isSoldOut(photo);
  return (
    <Link href={`/photos/${photo.slug}`} className="group block">
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4 / 5",
          background: "#ebe9e4",
          marginBottom: 16,
        }}
      >
        <img
          src={photo.imageUrl}
          alt={photo.imageAlt}
          className="img-protected absolute inset-0 h-full w-full object-cover transition-transform duration-[640ms] group-hover:scale-[1.015]"
          style={{ transitionTimingFunction: "cubic-bezier(.2,.6,.2,1)" }}
          loading="lazy"
        />
        {soldOut ? (
          <span
            className="absolute left-3 top-3 bg-ink px-2 py-1 uppercase text-bg"
            style={{ fontSize: 10, letterSpacing: "0.08em" }}
          >
            Sold out
          </span>
        ) : null}
      </div>
      <span
        className="block font-serif italic"
        style={{ fontSize: 21, color: "var(--ink)", marginBottom: 8 }}
      >
        {photo.title}
        {photo.titleItalic ? <> {photo.titleItalic}</> : null}
      </span>
      {/* Edition count removed from card - every print is an edition of 10,
          so repeating it across the grid is noise. The edition meta lives on
          the product detail page (Shipping & returns disclosure) and in the
          footer strap. */}
      <span
        className="block font-mono"
        style={{ fontSize: 15, fontWeight: 400, color: "var(--ink)" }}
      >
        From {formatUsd(photo.basePriceCents)}
      </span>
    </Link>
  );
}
