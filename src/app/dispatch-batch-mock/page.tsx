import { getAllPhotos } from "@/lib/photos";
import PreviewBanner from "@/components/PreviewBanner";

/*
  MOCK of /dispatch/batch?token=SIG — printer's batch view of all
  pending-dispatch orders. Served on the stakeholder-preview branch.
  Links in the Monday digest email open here; individual dispatch
  pages also link "View all pending".

  Design choices baked in (decided for Rob, not configurable):
    - Per-order tracking rows, one input per order
    - Default carrier USPS on every row
    - "Apply to all" is a button (not a toggle), one-click
    - Each row expandable to see shipping address and items
*/

export default function BatchMock() {
  const photos = getAllPhotos();

  const orders = [
    {
      orderId: "ORD-A7K4XM2",
      customerName: "Jane Smith",
      addressShort: "Brooklyn, NY",
      paidDate: "Apr 14",
      items: [
        { photo: photos[0], size: "11 × 14 in", paper: "Canson Baryta", edition: "3/10" },
        { photo: photos[6], size: "8 × 10 in", paper: "Photo Rag", edition: "5/10" },
      ],
    },
    {
      orderId: "ORD-B2M8LQ9",
      customerName: "Marcus Lee",
      addressShort: "Los Angeles, CA",
      paidDate: "Apr 14",
      items: [{ photo: photos[12], size: "16 × 20 in", paper: "Photo Rag", edition: "2/10" }],
    },
    {
      orderId: "ORD-C9T1RP3",
      customerName: "Sofia Rivera",
      addressShort: "London, UK",
      paidDate: "Apr 15",
      items: [
        { photo: photos[3], size: "8 × 10 in", paper: "Canson Baryta", edition: "7/10" },
        { photo: photos[9], size: "11 × 14 in", paper: "Canson Baryta", edition: "1/10" },
        { photo: photos[17], size: "8 × 10 in", paper: "Photo Rag", edition: "4/10" },
      ],
    },
    {
      orderId: "ORD-D4X3HV6",
      customerName: "Eli Park",
      addressShort: "Portland, OR",
      paidDate: "Apr 15",
      items: [{ photo: photos[22], size: "11 × 14 in", paper: "Photo Rag", edition: "6/10" }],
    },
  ];

  const totalItems = orders.reduce((n, o) => n + o.items.length, 0);

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

      {/* HEADER */}
      <header
        style={{
          backgroundColor: "var(--accent, #1529db)",
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
            📦 Fulfill · Batch
          </span>
          <span style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em" }}>
            {orders.length} orders pending
          </span>
          <div style={{ fontSize: "12px", opacity: 0.8, whiteSpace: "nowrap" }}>
            {totalItems} items total · Oldest paid Apr 14
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
        {/* BULK DOWNLOADS STRIP */}
        <section
          className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3"
          style={{
            background: "var(--bg-soft)",
            padding: "14px 18px",
          }}
        >
          <div>
            <div className="label-caps mb-1">Bulk downloads</div>
            <div className="text-xs text-ink-faint" style={{ lineHeight: 1.5 }}>
              Print everything at once. Files unzip to one folder named by order.
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="#" className="btn-ghost" style={{ padding: "8px 16px", fontSize: "14px" }}>
              ↓ All TIFFs (.zip, 412 MB)
            </a>
            <a
              href="#"
              className="btn-ghost is-secondary"
              style={{ padding: "8px 16px", fontSize: "14px" }}
            >
              ↓ All COAs (.pdf packet)
            </a>
          </div>
        </section>

        {/* ORDERS LIST — each expandable */}
        <section className="mb-8">
          <div
            className="mb-4 flex items-baseline justify-between"
            style={{
              borderBottom: "1px solid var(--ink-line)",
              paddingBottom: "6px",
            }}
          >
            <span className="label-caps">Pending dispatch</span>
            <span className="text-xs text-ink-faint">{orders.length} orders</span>
          </div>

          <ul className="flex flex-col gap-3">
            {orders.map((order, i) => (
              <li
                key={order.orderId}
                style={{
                  border: "1px solid var(--ink-line)",
                  padding: "16px 18px",
                  background: "#fff",
                }}
              >
                {/* Top row: order summary + tracking input */}
                <div
                  className="grid items-baseline gap-y-3"
                  style={{
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    columnGap: "20px",
                  }}
                >
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span
                        style={{
                          fontSize: "16px",
                          fontWeight: 900,
                          letterSpacing: "-0.01em",
                          color: "var(--ink-strong)",
                        }}
                      >
                        {order.orderId}
                      </span>
                      <span className="text-ink" style={{ fontSize: "14px" }}>
                        {order.customerName}
                      </span>
                      <span className="text-xs text-ink-faint">
                        {order.addressShort} · {order.items.length} items · Paid {order.paidDate}
                      </span>
                    </div>

                    {/* Item preview thumbs */}
                    <div
                      className="mt-3 flex flex-wrap items-baseline gap-3"
                      style={{ fontSize: "12px", color: "var(--ink)" }}
                    >
                      {order.items.map((item, j) => (
                        <span
                          key={j}
                          className="flex items-center gap-2"
                          style={{
                            background: "var(--bg-soft)",
                            padding: "4px 8px 4px 4px",
                          }}
                        >
                          <img
                            src={item.photo.imageUrl}
                            alt=""
                            style={{
                              width: "24px",
                              height: "32px",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          <span>
                            {item.photo.title} <em>{item.photo.titleItalic}</em>
                            {" · "}
                            <span style={{ color: "var(--ink-faint)" }}>
                              {item.size} · {item.paper}
                            </span>
                            {" · "}
                            <span style={{ color: "var(--accent)", fontWeight: 900 }}>
                              {item.edition}
                            </span>
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right column: per-order controls */}
                  <div
                    className="flex flex-col gap-2"
                    style={{ minWidth: "240px", alignItems: "stretch" }}
                  >
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue="USPS"
                        style={{
                          padding: "8px 10px",
                          border: "1px solid var(--ink-line)",
                          fontSize: "13px",
                          fontFamily: "var(--font-geist-sans)",
                          background: "#fff",
                        }}
                      >
                        <option>USPS</option>
                        <option>UPS</option>
                        <option>FedEx</option>
                        <option>DHL</option>
                        <option>Other</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Tracking #"
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          border: "1px solid var(--ink-line)",
                          fontSize: "13px",
                          fontFamily: "var(--font-geist-sans)",
                          background: "#fff",
                          minWidth: 0,
                        }}
                      />
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      {i === 0 ? (
                        <button
                          type="button"
                          style={{
                            color: "var(--accent)",
                            fontWeight: 900,
                            textDecoration: "underline",
                            textUnderlineOffset: "3px",
                            fontSize: "12px",
                          }}
                        >
                          Apply to all
                        </button>
                      ) : (
                        <span />
                      )}
                      <a
                        href={`/dispatch-mock`}
                        style={{
                          color: "var(--ink-faint)",
                          textDecoration: "underline",
                          textUnderlineOffset: "3px",
                          fontSize: "12px",
                        }}
                      >
                        View detail ↗
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* BULK SUBMIT */}
        <section
          className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 py-4"
          style={{
            borderTop: "1px solid var(--ink-line)",
            borderBottom: "1px solid var(--ink-line)",
          }}
        >
          <div>
            <div className="text-ink-strong" style={{ fontSize: "15px", fontWeight: 900 }}>
              Submit dispatches
            </div>
            <div className="mt-1 text-xs text-ink-faint" style={{ lineHeight: 1.5 }}>
              Only rows with a tracking number will submit. Customers are notified on submit.
            </div>
          </div>
          <button type="submit" className="btn-ghost">
            Submit all filled →
          </button>
        </section>

        {/* FOOTER */}
        <div
          className="mt-10 pt-4 text-xs text-ink-faint"
          style={{
            borderTop: "1px solid var(--ink-line)",
            lineHeight: 1.5,
          }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span>Magic link · valid 30 days · regenerates each Monday via digest</span>
            <a href="mailto:info@thaliabassim.com" style={{ color: "var(--accent)" }}>
              Question? info@thaliabassim.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
