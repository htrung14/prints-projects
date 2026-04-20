import Image from "next/image";
import Link from "next/link";
import type { Photo } from "@/lib/types";
import { formatUsd, isSoldOut, editionRemaining } from "@/lib/pricing";
import { SaveButton } from "@/components/SaveButton";

export default function PhotoCard({ photo }: { photo: Photo }) {
  const soldOut = isSoldOut(photo);
  const remaining = editionRemaining(photo);
  return (
    <Link href={`/photos/${photo.slug}`} className="group block">
      <figure
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4 / 5",
          background: "#ebe9e4",
          marginBottom: 16,
          margin: 0,
        }}
      >
        <SaveButton slug={photo.slug} />
        <Image
          src={photo.imageUrl}
          alt={photo.imageAlt}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="img-protected object-cover transition-transform duration-[640ms] group-hover:scale-[1.015]"
          style={{ transitionTimingFunction: "cubic-bezier(.2,.6,.2,1)" }}
        />
        {soldOut ? (
          <span
            className="absolute left-3 top-3 bg-ink px-2 py-1 uppercase text-bg"
            style={{ fontSize: 10, letterSpacing: "0.08em" }}
          >
            Sold out
          </span>
        ) : null}
      </figure>
      <div className="flex items-baseline justify-between gap-4 mt-4">
        <h3
          className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0"
          style={{
            fontSize: "clamp(14px, 2.5vw, 21px)",
            color: "var(--ink)",
            margin: 0,
            fontWeight: 400,
          }}
        >
          {photo.title}
          {photo.titleItalic ? <> {photo.titleItalic}</> : null}
        </h3>
        <span
          className="font-mono opacity-100 lg:opacity-0 transition-opacity duration-300 group-hover:opacity-100 shrink-0"
          style={{ fontSize: "clamp(12px, 2vw, 15px)", fontWeight: 400, color: "var(--ink)" }}
        >
          {formatUsd(photo.basePriceCents)}
        </span>
      </div>
      {!soldOut && remaining <= 5 && (
        <span
          className="font-mono"
          style={{ fontSize: 11, color: "var(--i5)", marginTop: 4, display: "block" }}
        >
          {remaining} of {photo.editionTotal} available
        </span>
      )}
    </Link>
  );
}
