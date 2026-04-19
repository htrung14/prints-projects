import LandingHero from "@/components/LandingHero";
import CatalogGrid from "@/components/CatalogGrid";
import { getAllPhotos } from "@/lib/photos";

export default function Home() {
  const photos = getAllPhotos();
  const lead = photos[0];

  return (
    <div>
      {lead ? <LandingHero lead={lead} /> : null}

      <div
        id="prints"
        className="flex items-baseline justify-between border-b border-ink-line px-6 py-[22px] md:px-11"
        style={{ scrollMarginTop: 48 }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink)",
          }}
        >
          Prints
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 15, color: "var(--i8)", letterSpacing: "0.02em" }}
        >
          {photos.length} works
        </span>
      </div>

      <CatalogGrid photos={photos} />
    </div>
  );
}
