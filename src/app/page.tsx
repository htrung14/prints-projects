import Link from "next/link";
import CatalogGrid from "@/components/CatalogGrid";
import { getAllPhotos } from "@/lib/photos";

export default function Home() {
  const photos = getAllPhotos();
  const lead = photos[0];

  return (
    <div>
      {lead ? (
        <section className="border-b border-ink-line">
          <div className="grid gap-8 px-6 pb-14 pt-12 md:grid-cols-[1fr_1fr] md:gap-12 md:px-10 md:pt-16">
            <div className="order-2 flex flex-col gap-6 self-end md:order-1 md:pb-4">
              <div className="label-caps">Current roll</div>
              <h1 className="h-display-xl">
                Roll <em>6604</em>,<br />a film archive
                <br />
                from Brooklyn.
              </h1>
              <p className="drop-cap max-w-md text-sm leading-relaxed">
                Eight frames from a single roll of 35mm film, scanned by PhotoLife in Brooklyn, NY.
                Each photograph is made to order as an archival pigment print, signed and numbered
                verso, in an edition of ten pooled across all sizes and papers.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="#catalog"
                  className="inline-block bg-ink-strong px-5 py-3 text-bg hover:opacity-90"
                  style={{ fontSize: "1rem", letterSpacing: "0.01em" }}
                >
                  View catalog →
                </Link>
                <Link
                  href="/essay"
                  className="inline-block border border-ink px-5 py-3 text-ink-strong hover:opacity-70"
                  style={{ fontSize: "1rem" }}
                >
                  Read essay
                </Link>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Link
                href={`/photos/${lead.slug}`}
                className="group block aspect-[3/4] overflow-hidden"
                aria-label={`Open ${lead.title} detail`}
              >
                <img
                  src={lead.imageUrl}
                  alt={lead.imageAlt}
                  className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <div
        id="catalog"
        className="flex items-baseline justify-between scroll-mt-20 border-b border-ink-line px-6 pb-3 pt-10 md:px-10"
      >
        <div className="label-caps">Catalog</div>
        <div className="text-xs text-ink-faint">{photos.length} photographs</div>
      </div>
      <CatalogGrid photos={photos} />
    </div>
  );
}
