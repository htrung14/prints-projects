import BuyUI from "./BuyUI";
import type { Photo } from "@/lib/types";

export default function DetailPanel({ photo }: { photo: Photo }) {
  return (
    <article>
      <div
        className="grid min-h-[calc(100vh-63px)] grid-cols-1 gap-0 lg:grid-cols-[1fr_38vw]"
        style={{ maxWidth: 1600, margin: "0 auto" }}
      >
        {/* Gallery - framed image, fit to viewport.
            min-width:0 is essential: without it a 1fr grid column will auto-
            expand to accommodate the image's intrinsic width, pushing the page
            sideways. With it, the image shrinks to the column and the frame
            stays neatly inside. */}
        <section
          className="flex items-center justify-center lg:py-8"
          style={{ padding: "32px 20px 32px 44px", minWidth: 0 }}
        >
          <img
            src={photo.imageUrl.replace("/catalog/", "/catalog-hires/")}
            srcSet={`${photo.imageUrl} 2000w, ${photo.imageUrl.replace("/catalog/", "/catalog-hires/")} 3000w`}
            sizes="(max-width: 900px) 100vw, 62vw"
            alt={photo.imageAlt}
            className="img-protected block object-contain"
            draggable={false}
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "100%",
              maxHeight: "calc(100dvh - 63px - 64px)",
            }}
          />
        </section>

        {/* Rail */}
        <aside
          className="self-center justify-self-center w-full"
          style={{ padding: "48px 28px", maxWidth: 420 }}
        >
          <BuyUI photo={photo} />
        </aside>
      </div>

      <style>{`
        @media (max-width: 900px) {
          article > .grid {
            grid-template-columns: 1fr;
          }
          article > .grid > section {
            padding: 20px !important;
            min-width: 0;
          }
          article > .grid > section img {
            max-width: 100%;
            height: auto !important;
          }
          article > .grid > aside {
            padding: 32px 20px 48px !important;
            max-width: none !important;
          }
        }
      `}</style>
    </article>
  );
}
