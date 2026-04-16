import BuyUI from "./BuyUI";
import DetailCloseLink from "./DetailCloseLink";
import type { Photo } from "@/lib/types";

export default function DetailPanel({ photo, modal = false }: { photo: Photo; modal?: boolean }) {
  return (
    <article>
      {!modal ? (
        <div className="flex items-center justify-end gap-6 border-b border-ink-line px-6 py-3 md:px-8">
          <DetailCloseLink modal={modal} />
        </div>
      ) : null}

      <div className="px-6 py-8 pb-16 md:px-10">
        {/* Mobile: single-column stack. Photo + BuyUI, then description. */}
        <div className="lg:hidden">
          <BuyUI photo={photo} />
          <div className="mt-10 space-y-4 text-sm leading-relaxed">
            {photo.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* Desktop P3: 2-col — photo left (60%), buy+description right (40%).
            Buy is sticky ONLY within its own block. Description is a sibling
            that flows normally below it. Keeping sticky scoped prevents the
            description from pinning or dragging when the page scrolls. */}
        <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] lg:gap-16">
          <div className="bg-bg-soft p-6">
            <img
              src={photo.imageUrl}
              alt={photo.imageAlt}
              className="w-full object-contain"
              style={{ maxHeight: "85vh" }}
            />
          </div>
          <div>
            <BuyUI photo={photo} showPhoto={false} />
            <div className="mt-6 space-y-4 text-sm leading-relaxed">
              {photo.description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
