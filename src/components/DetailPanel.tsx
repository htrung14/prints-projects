import BuyUI from "./BuyUI";
import type { Photo } from "@/lib/types";

export default function DetailPanel({ photo }: { photo: Photo }) {
  return (
    <article>
      <div
        className="grid min-h-[calc(100vh-63px)] grid-cols-1 gap-0 lg:grid-cols-[1fr_38vw]"
        style={{ maxWidth: 1600, margin: "0 auto" }}
      >
        {/* Gallery — framed image, fit to viewport */}
        <section
          className="flex items-start justify-center lg:py-8"
          style={{ padding: "32px 20px 32px 44px" }}
        >
          <figure
            className="mat-o"
            style={{
              maxHeight: "calc(100vh - 63px - 64px)",
              display: "inline-flex",
            }}
          >
            <div className="mat-i" style={{ display: "flex" }}>
              <img
                src={photo.imageUrl}
                alt={photo.imageAlt}
                className="block object-contain"
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 63px - 64px - 40px - 4px)",
                }}
              />
            </div>
          </figure>
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
            padding: 20px 20px 32px !important;
            min-width: 0;
          }
          article > .grid > section .mat-o {
            padding: 10px;
            /* Cap the frame to the viewport so wide images can't push the
               page horizontally on narrow screens. Pair with max-width on
               the inner mat + img so the image shrinks proportionally. */
            max-width: 100%;
            box-sizing: border-box;
          }
          article > .grid > section .mat-i,
          article > .grid > section .mat-i > img {
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
