import CatalogGrid from "@/components/CatalogGrid";
import { getAllPhotos } from "@/lib/photos";

export default function Home() {
  const photos = getAllPhotos();
  return (
    <div>
      <CatalogGrid photos={photos} />
    </div>
  );
}
