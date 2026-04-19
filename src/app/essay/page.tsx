import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Essay — Thalia Bassim",
  description: "A written accompaniment to the photographic series.",
};

export default function EssayPage() {
  return (
    <div className="border-t border-ink-line px-6 py-16 md:px-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <span
            className="label-caps mb-4 block"
            style={{ color: "var(--i5)", letterSpacing: "0.08em" }}
          >
            Essay
          </span>
          <h1 className="flex flex-col" style={{ margin: 0 }}>
            <span
              className="font-serif"
              lang="ar"
              style={{
                fontWeight: 500,
                fontSize: "clamp(36px, 5vw, 48px)",
                color: "var(--ink)",
                lineHeight: 1.05,
                letterSpacing: "0.01em",
                marginBottom: 10,
              }}
            >
              التمسّك
            </span>
            <span
              className="font-serif italic"
              style={{
                fontSize: "clamp(20px, 2.2vw, 24px)",
                fontWeight: 500,
                color: "var(--i8)",
              }}
            >
              At-Tamassok
            </span>
          </h1>
        </div>

        <p className="drop-cap text-sm leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>

        <p className="mt-5 text-sm leading-relaxed">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
          deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit
          voluptatem accusantium doloremque laudantium.
        </p>

        <p className="mt-5 text-sm leading-relaxed">
          Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae
          vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut
          odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi
          nesciunt.
        </p>

        <h2 className="mt-12 mb-5 text-ink-strong" style={{ fontSize: "22px", lineHeight: 1.2 }}>
          Neque porro quisquam
        </h2>

        <p className="text-sm leading-relaxed">
          Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
          velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam
          quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis
          suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.
        </p>

        <p className="mt-5 text-sm leading-relaxed">
          Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae
          consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et
          accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti
          atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non
          provident.
        </p>

        <p className="mt-12 text-ink-faint">
          Placeholder copy. Real essay text to be provided by the studio.
        </p>
      </div>
    </div>
  );
}
