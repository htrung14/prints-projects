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
      <div className="flex items-baseline justify-between gap-4">
        <span
          className="font-serif overflow-hidden text-ellipsis whitespace-nowrap min-w-0"
          style={{ fontSize: "clamp(14px, 2.5vw, 21px)", color: "var(--ink)" }}
        >
          {photo.title}
          {photo.titleItalic ? <>, {photo.titleItalic}</> : null}
        </span>
        <span
          className="font-mono opacity-100 lg:opacity-0 transition-opacity duration-300 group-hover:opacity-100 shrink-0"
          style={{ fontSize: "clamp(12px, 2vw, 15px)", fontWeight: 400, color: "var(--ink)" }}
        >
          {formatUsd(photo.basePriceCents)}
        </span>
      </div>
    </Link>
  );
}
