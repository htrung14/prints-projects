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
              <h1 className="h-display-xl">
                <em>At-Tamassok</em>
              </h1>
              <p className="drop-cap max-w-md text-sm leading-relaxed">
                Twenty-five frames from a single roll of 35mm film. Each photograph is made to order
                as an archival pigment print, in an edition of ten pooled across all sizes and
                papers.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="#catalog" className="btn-ghost">
                  View editions →
                </Link>
                <Link href="/essay" className="btn-ghost is-secondary">
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
        className="flex items-baseline justify-between scroll-mt-20 px-6 pb-3 pt-10 md:px-10"
      >
        <div className="label-caps">Editions</div>
        <div className="text-xs text-ink-faint">{photos.length} photographs</div>
      </div>
      <CatalogGrid photos={photos} />
    </div>
  );
}
