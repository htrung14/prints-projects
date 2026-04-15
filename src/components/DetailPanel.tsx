import Link from "next/link";
import BuyUI from "./BuyUI";
import type { Photo } from "@/lib/types";

export default function DetailPanel({ photo }: { photo: Photo }) {
  return (
    <article className="border-t border-[var(--ink-line)]">
      <div
        className="grid items-center gap-6 border-b border-[var(--ink-line)] px-6 py-3 md:px-8"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        <span className="justify-self-start text-[var(--ink-faint)]">Project Reference</span>
        <span className="justify-self-center text-[var(--ink-strong)]">
          {photo.referenceNumber}
        </span>
        <Link href="/" className="justify-self-end">
          Close ✕
        </Link>
      </div>

      <div
        className="grid gap-6 px-6 py-7 pb-32 md:px-8 lg:gap-8"
        style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
      >
        <div className="lg:hidden">
          <BuyUI photo={photo} />
        </div>

        <div className="hidden lg:grid lg:grid-cols-[16%_30%_1fr] lg:gap-8">
          <div className="text-sm leading-snug">
            <div className="mb-3.5">
              {photo.title}
              {photo.titleItalic ? (
                <>
                  {" "}
                  <em>{photo.titleItalic}</em>
                </>
              ) : null}
              {photo.subtitle ? (
                <>
                  <br />
                  {photo.subtitle}
                </>
              ) : null}
            </div>
            <div className="mb-3.5">
              Archival pigment print
              <br />
              Edition of {photo.editionTotal}
            </div>
            <div className="mb-3.5">
              {photo.year}
              <br />
              {photo.referenceNumber}
            </div>
          </div>

          <div className="space-y-4 text-sm leading-relaxed">
            {photo.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <BuyUI photo={photo} />
        </div>

        <div className="space-y-4 text-sm leading-relaxed lg:hidden">
          {photo.description.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
