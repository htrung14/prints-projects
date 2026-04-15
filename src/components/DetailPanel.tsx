import BuyUI from "./BuyUI";
import DetailCloseLink from "./DetailCloseLink";
import type { Photo } from "@/lib/types";

export default function DetailPanel({ photo, modal = false }: { photo: Photo; modal?: boolean }) {
  return (
    <article>
      {/* On the full page, show the panel header with the Close link.
          In modal mode, the PhotoModal provides a sticky close bar, so
          skip this redundant header bar. */}
      {!modal ? (
        <div
          className="grid items-center gap-6 border-b border-ink-line px-6 py-3 md:px-8"
          style={{ gridTemplateColumns: "1fr auto 1fr" }}
        >
          <span className="justify-self-start text-ink-faint">Project Reference</span>
          <span className="justify-self-center text-ink-strong">{photo.referenceNumber}</span>
          <DetailCloseLink modal={modal} />
        </div>
      ) : null}

      <div className="grid gap-8 px-6 py-8 pb-16 md:px-10 lg:gap-12">
        {/* Mobile: single-column stack starting with BuyUI (photo + buy form). */}
        <div className="lg:hidden">
          <BuyUI photo={photo} />
        </div>

        {/* Desktop: 3-column editorial grid (16% meta / 30% description / buy column). */}
        <div className="hidden lg:grid lg:grid-cols-[16%_30%_1fr] lg:gap-12">
          {/* META — small, label-style, left rail */}
          <aside className="flex flex-col gap-5 text-xs leading-snug">
            <div>
              <div className="label-caps mb-1.5 text-ink-faint">Title</div>
              <div className="text-ink-strong">
                {photo.title}
                {photo.titleItalic ? (
                  <>
                    {" "}
                    <em>{photo.titleItalic}</em>
                  </>
                ) : null}
              </div>
              {photo.subtitle ? <div className="text-ink-faint">{photo.subtitle}</div> : null}
            </div>
            <div>
              <div className="label-caps mb-1.5 text-ink-faint">Medium</div>
              <div>
                Archival pigment print
                <br />
                Edition of {photo.editionTotal}
              </div>
            </div>
            <div>
              <div className="label-caps mb-1.5 text-ink-faint">Year</div>
              <div>{photo.year}</div>
            </div>
            <div>
              <div className="label-caps mb-1.5 text-ink-faint">Reference</div>
              <div>{photo.referenceNumber}</div>
            </div>
          </aside>

          {/* DESCRIPTION — middle column, reading column */}
          <div className="space-y-4 text-sm leading-relaxed">
            {photo.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* BUY — sticky right column */}
          <div
            className="self-start lg:sticky"
            style={{ top: "calc(var(--header-height) + 72px)" }}
          >
            <BuyUI photo={photo} />
          </div>
        </div>

        {/* Mobile: description stacks below BuyUI. */}
        <div className="space-y-4 text-sm leading-relaxed lg:hidden">
          {photo.description.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
