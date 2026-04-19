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
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[640ms] group-hover:scale-[1.015]"
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
      <span
        className="block font-mono"
        style={{ fontSize: 15, fontWeight: 400, color: "var(--ink)", marginBottom: 4 }}
      >
        From {formatUsd(photo.basePriceCents)}
      </span>
      <span
        className="block font-mono"
        style={{ fontSize: 14, fontWeight: 400, color: "var(--i8)" }}
      >
        Edition of {photo.editionTotal}
      </span>
    </Link>
  );
}
