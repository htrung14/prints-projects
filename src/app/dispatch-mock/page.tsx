import { getAllPhotos } from "@/lib/photos";
import PreviewBanner from "@/components/PreviewBanner";

/*
  MOCK of the printer-facing /dispatch/[orderId]?token= page.
  Served on the stakeholder-preview branch for review; gated by PreviewBanner.

  Two views for preview:
    /dispatch-mock              → unfulfilled, shows the dispatch form
    /dispatch-mock?dispatched   → after Rob submits, success/receipt view
*/

type SP = { dispatched?: string };

export default async function DispatchMock({ searchParams }: { searchParams?: Promise<SP> }) {
  const params = (await searchParams) ?? {};
  const isDispatched = "dispatched" in params;

  const photos = getAllPhotos();
  const items = [
    {
      photo: photos[0],
      size: "11 × 14 in",
      paper: "Canson Baryta",
      editionNumber: 3,
      editionTotal: 10,
      tiffUrl: "#",
      tiffSize: "84.2 MB",
      coaUrl: "#",
    },
    {
      photo: photos[6],
      size: "8 × 10 in",
      paper: "Hahnemühle Photo Rag",
      editionNumber: 5,
      editionTotal: 10,
      tiffUrl: "#",
      tiffSize: "62.8 MB",
      coaUrl: "#",
    },
  ];

  const dispatchedAt = "April 15, 2026 · 9:14 PM EST";
  const trackingNumber = "9400 1000 0000 0000 0000 00";
  const carrier = "USPS";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Hide the shop's global header/footer + cart so this page reads as
          a standalone printer-facing tool. The real /dispatch/[orderId] route
          will use a route group (dispatch)/layout.tsx that doesn't include
          Header/Footer at all; this scoped style is the mock equivalent. */}
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
      {/* HEADER — changes state on dispatch */}
      <header
        style={{
          backgroundColor: isDispatched ? "var(--ink-strong)" : "var(--accent, #1529db)",
          color: "#fff",
          padding: "20px 24px",
        }}
        className="md:px-10"
      >
        <div className="mx-auto grid max-w-6xl gap-y-3 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-x-6">
          <span
            style={{
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            {isDispatched ? "✓ Dispatched" : "📦 Fulfill"}
          </span>
          <span
            style={{
              fontSize: "22px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            ORD-A7K4XM2
          </span>
          <div
            style={{
              fontSize: "12px",
              opacity: 0.8,
              whiteSpace: "nowrap",
            }}
          >
            {items.length} items · Paid Apr 15
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        {/* STATE BANNER — shown only after dispatch */}
        {isDispatched && (
          <div
            className="mb-8 flex flex-wrap items-baseline justify-between gap-3 p-5"
            style={{
              background: "var(--bg-soft)",
              border: "1px solid var(--ink-line)",
            }}
          >
            <div>
              <div className="label-caps mb-1" style={{ color: "var(--accent)" }}>
                ✓ Dispatch confirmed
              </div>
              <div
                style={{
                  fontSize: "15px",
                  color: "var(--ink-strong)",
                  lineHeight: 1.5,
                }}
              >
                Customer notified with tracking.
                <br />
                <span style={{ color: "var(--ink)" }}>
                  {carrier} · {trackingNumber}
                </span>
              </div>
            </div>
            <div className="text-xs text-ink-faint" style={{ textAlign: "right", lineHeight: 1.5 }}>
              Dispatched {dispatchedAt}
              <br />
              This link is now closed.
            </div>
          </div>
        )}

        {/* 2-col on desktop, stacked on mobile */}
        <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-16">
          {/* LEFT: ITEMS */}
          <section>
            <div
              className="mb-4 flex items-baseline justify-between"
              style={{
                borderBottom: "1px solid var(--ink-line)",
                paddingBottom: "6px",
              }}
            >
              <span className="label-caps">
                {isDispatched ? "What was shipped" : "What to print"}
              </span>
              <span className="text-xs text-ink-faint">{items.length} items</span>
            </div>

            <ul className="flex flex-col gap-4">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="grid gap-4 md:grid-cols-[96px_1fr] md:gap-5"
                  style={{
                    background: "var(--bg-soft)",
                    padding: "14px",
                    opacity: isDispatched ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      width: "96px",
                      aspectRatio: "3/4",
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    <img
                      src={item.photo.imageUrl}
                      alt={item.photo.imageAlt}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div
                      className="text-ink-strong"
                      style={{ fontSize: "17px", letterSpacing: "-0.01em" }}
                    >
                      {item.photo.title} <em>{item.photo.titleItalic}</em>
                    </div>

                    <dl
                      className="grid gap-x-3 gap-y-0.5"
                      style={{
                        gridTemplateColumns: "auto 1fr",
                        fontSize: "13px",
                        lineHeight: 1.5,
                      }}
                    >
                      <dt className="text-ink-faint">Size</dt>
                      <dd className="text-ink-strong" style={{ fontWeight: 900 }}>
                        {item.size}
                      </dd>
                      <dt className="text-ink-faint">Paper</dt>
                      <dd className="text-ink-strong" style={{ fontWeight: 900 }}>
                        {item.paper}
                      </dd>
                      <dt className="text-ink-faint">Edition</dt>
                      <dd
                        style={{
                          color: "var(--accent)",
                          fontWeight: 900,
                        }}
                      >
                        {item.editionNumber}/{item.editionTotal}
                      </dd>
                    </dl>

                    {!isDispatched && (
                      <div className="mt-1 flex flex-col gap-1">
                        <a href={item.tiffUrl} style={linkStyle}>
                          ↓ Download TIFF ({item.tiffSize})
                        </a>
                        <a href={item.coaUrl} style={linkStyle}>
                          ↓ Download COA PDF
                        </a>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* RIGHT: SHIP TO + DISPATCH STATE */}
          <aside className="flex flex-col gap-8">
            <section>
              <div
                className="mb-3"
                style={{
                  borderBottom: "1px solid var(--ink-line)",
                  paddingBottom: "6px",
                }}
              >
                <span className="label-caps">Ship to</span>
              </div>
              <address
                className="not-italic"
                style={{
                  fontSize: "16px",
                  lineHeight: 1.4,
                  fontWeight: 900,
                  color: "var(--ink-strong)",
                }}
              >
                Jane Smith
                <br />
                123 Main St, Apt 4B
                <br />
                Brooklyn, NY 11201
                <br />
                United States
              </address>
            </section>

            {isDispatched ? (
              <section>
                <div
                  className="mb-4"
                  style={{
                    borderBottom: "1px solid var(--ink-line)",
                    paddingBottom: "6px",
                  }}
                >
                  <span className="label-caps" style={{ color: "var(--accent)" }}>
                    ✓ Dispatched
                  </span>
                </div>
                <dl
                  className="grid gap-x-3 gap-y-2"
                  style={{
                    gridTemplateColumns: "auto 1fr",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  <dt className="text-ink-faint">Carrier</dt>
                  <dd className="text-ink-strong" style={{ fontWeight: 900 }}>
                    {carrier}
                  </dd>
                  <dt className="text-ink-faint">Tracking</dt>
                  <dd
                    className="text-ink-strong"
                    style={{
                      fontWeight: 900,
                      fontFamily: "var(--font-geist-mono, monospace)",
                      fontSize: "13px",
                      wordBreak: "break-all",
                    }}
                  >
                    {trackingNumber}
                  </dd>
                  <dt className="text-ink-faint">When</dt>
                  <dd className="text-ink-strong">{dispatchedAt}</dd>
                </dl>
                <div
                  className="mt-6 pt-4 text-xs"
                  style={{
                    borderTop: "1px solid var(--ink-line)",
                    color: "var(--ink-faint)",
                    lineHeight: 1.5,
                  }}
                >
                  Customer has been emailed the tracking info.
                  <br />
                  TIFF and COA download links have been revoked for security.
                </div>
              </section>
            ) : (
              <section>
                <div
                  className="mb-4"
                  style={{
                    borderBottom: "1px solid var(--ink-line)",
                    paddingBottom: "6px",
                  }}
                >
                  <span className="label-caps">Mark as dispatched</span>
                </div>

                <form className="flex flex-col gap-4">
                  <fieldset className="flex flex-col gap-2">
                    <legend
                      className="label-caps"
                      style={{ color: "var(--ink)", marginBottom: "4px" }}
                    >
                      Carrier
                    </legend>
                    <div className="flex flex-wrap gap-1.5">
                      {["USPS", "UPS", "FedEx", "DHL", "Other"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="btn-ghost is-secondary"
                          style={{ padding: "6px 12px", fontSize: "13px" }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="tracking"
                      className="label-caps"
                      style={{ color: "var(--ink)" }}
                    >
                      Tracking #
                    </label>
                    <input
                      id="tracking"
                      type="text"
                      placeholder="9400 1000 0000 ..."
                      style={{
                        padding: "10px 12px",
                        border: "1px solid var(--ink-line)",
                        fontSize: "15px",
                        fontFamily: "var(--font-geist-sans)",
                        background: "#fff",
                      }}
                    />
                  </div>

                  <a
                    href="/dispatch-mock?dispatched"
                    className="btn-ghost text-center"
                    style={{ marginTop: "4px" }}
                  >
                    Submit dispatch →
                  </a>
                  <span className="text-xs text-ink-faint" style={{ lineHeight: 1.4 }}>
                    Customer is notified automatically.
                  </span>
                </form>
              </section>
            )}
          </aside>
        </div>

        {/* FOOTER */}
        <div
          className="mt-12 pt-4 text-xs text-ink-faint"
          style={{
            borderTop: "1px solid var(--ink-line)",
            lineHeight: 1.5,
          }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span>
              {isDispatched
                ? "This link is closed. Safe to delete the email."
                : "Magic link · valid 30 days · no login required"}
            </span>
            <div className="flex gap-4">
              {isDispatched && (
                <a href="/dispatch-mock" style={{ color: "var(--accent)", opacity: 0.7 }}>
                  ← Back to pre-dispatch view (mock)
                </a>
              )}
              <a href="mailto:info@thaliabassim.com" style={{ color: "var(--accent)" }}>
                Not your order?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const linkStyle = {
  color: "var(--accent)",
  fontSize: "14px",
  textDecoration: "underline",
  textDecorationThickness: "1px",
  textUnderlineOffset: "4px",
  fontWeight: 900,
  alignSelf: "flex-start",
} as const;
