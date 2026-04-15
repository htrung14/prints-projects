import CatalogGrid from "@/components/CatalogGrid";
import { getAllPhotos } from "@/lib/photos";

export default function Home() {
  const photos = getAllPhotos();
  return (
    <div>
      <section className="border-b border-[var(--ink-line)] px-6 py-10 md:px-8">
        <p className="max-w-2xl text-sm leading-relaxed">
          A small catalog of photographs made in Brooklyn, NY between 2023 and 2024. Each piece is
          an edition of {photos[0]?.editionTotal ?? 10} prints, made to order on archival pigment
          paper.
        </p>
      </section>
      <CatalogGrid photos={photos} />
    </div>
  );
}
