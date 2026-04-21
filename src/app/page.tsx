import LandingHero from "@/components/LandingHero";
import CatalogGrid from "@/components/CatalogGrid";
import { getCatalogPhotos } from "@/lib/photos";

export default function Home() {
  const photos = getCatalogPhotos();
  const lead = photos.find((p) => p.slug === "north-lebanon-oct-2020") ?? photos[0];

  return (
    <main>
      {lead ? <LandingHero lead={lead} /> : null}

      <section
        id="prints"
        className="flex items-baseline justify-between border-b border-ink-line px-6 py-[22px] md:px-11"
        style={{ scrollMarginTop: 48 }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.14em",
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Prints
        </h2>
        <span
          className="font-mono"
          style={{ fontSize: 15, color: "var(--i8)", letterSpacing: "0.02em" }}
        >
          {photos.length} works
        </span>
      </section>

      <CatalogGrid photos={photos} />
    </main>
  );
}
