import Link from "next/link";
import { getAllPhotos } from "@/lib/photos";
import PreviewBanner from "@/components/PreviewBanner";

/*
  Stakeholder preview landing page. Served from the `stakeholder-preview`
  branch so Thalia + Z can click through every mock in one place. Not
  linked from the production shop.
*/

type Mock = {
  href: string;
  label: string;
  blurb: string;
  imageSlug?: string;
  note?: string;
};

export default function PreviewIndex() {
  const photos = getAllPhotos();
  const hero = photos[0];
  const coaHero = photos[2];

  const mocks: Mock[] = [
    {
      href: "/dispatch-mock",
      label: "Dispatch · single order",
      blurb:
        "Printer-facing magic-link page. Rob opens it from an email, downloads TIFFs + COA, enters tracking, hits submit.",
      imageSlug: "pl-6604-01",
      note: "Also try /dispatch-mock?dispatched for the post-submit state.",
    },
    {
      href: "/dispatch-batch-mock",
      label: "Dispatch · batch view",
      blurb:
        "Monday digest view: every pending order, one row per order, bulk TIFF/COA download, submit all at once.",
      imageSlug: "pl-6604-07",
    },
    {
      href: "/coa-mock",
      label: "Certificate of authenticity",
      blurb:
        "Auto-generated PDF bundled into each fulfillment email. Editorial layout, anchor-left image, Thalia's signature on a clean baseline.",
      imageSlug: coaHero?.slug,
    },
    {
      href: "/photos/pl-6604-01",
      label: "Product detail",
      blurb:
        "Live detail page with the new archival spec block below the price: paper, ink, lifespan, authenticity.",
      imageSlug: hero?.slug,
    },
    {
      href: "/",
      label: "Home page",
      blurb:
        "The grid as it ships today. Use this to sense-check the rest of the site around the mocks.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{`
        body > div > div.app-shell > header,
        body > div > div.app-shell > footer {
          display: none !important;
        }
        body > div > div.app-shell {
          min-height: 0 !important;
        }
      `}</style>
      <PreviewBanner />

      <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <header className="mb-12 md:mb-16">
          <div className="label-caps mb-4" style={{ color: "var(--accent)" }}>
            Stakeholder preview
          </div>
          <h1
            className="text-ink-strong"
            style={{
              fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Prints-projects <em>— review</em>
          </h1>
          <p
            className="mt-5 text-ink"
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.6,
              maxWidth: "60ch",
            }}
          >
            Preview deployment of in-progress mocks and one live detail-page polish. Not the
            production shop. Fake customer data throughout. Click anything to open it in its own
            tab.
          </p>
        </header>

        <ul className="flex flex-col divide-y" style={{ borderColor: "var(--ink-line)" }}>
          {mocks.map((m) => {
            const photo = m.imageSlug ? photos.find((p) => p.slug === m.imageSlug) : undefined;
            return (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="group grid items-start gap-6 py-7 md:grid-cols-[120px_1fr_auto] md:gap-10"
                  style={{ borderTop: "1px solid var(--ink-line)" }}
                >
                  <div
                    className="hidden md:block"
                    style={{
                      width: "120px",
                      aspectRatio: "3/4",
                      overflow: "hidden",
                      background: "var(--bg-soft)",
                    }}
                  >
                    {photo ? (
                      <img
                        src={photo.imageUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : null}
                  </div>
                  <div>
                    <div
                      className="text-ink-strong"
                      style={{
                        fontSize: "1.4rem",
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {m.label}
                    </div>
                    <p
                      className="mt-2 text-ink"
                      style={{
                        fontSize: "0.95rem",
                        lineHeight: 1.55,
                        maxWidth: "52ch",
                      }}
                    >
                      {m.blurb}
                    </p>
                    {m.note ? (
                      <p className="mt-2 text-xs text-ink-faint" style={{ lineHeight: 1.5 }}>
                        {m.note}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className="self-center"
                    style={{
                      color: "var(--accent)",
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Open {m.href} →
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <footer
          className="mt-14 flex flex-col gap-3 pt-6 text-sm text-ink-faint"
          style={{ borderTop: "1px solid var(--ink-line)", lineHeight: 1.6 }}
        >
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <a
              href="https://prints-projects.vercel.app"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)", fontWeight: 900 }}
            >
              Live shop (production) ↗
            </a>
            <a href="#notion-decision-poll" style={{ color: "var(--accent)", fontWeight: 900 }}>
              Back to Notion decision poll ↗
            </a>
          </div>
          <div className="text-xs">
            Questions or broken mocks? Ping Hai directly — don&apos;t file in the main repo.
          </div>
        </footer>
      </div>
    </div>
  );
}
