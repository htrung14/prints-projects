import Link from "next/link";
import { TrackingForm } from "@/components/dispatch/TrackingForm";
import { DEMO_SINGLE_ORDER } from "@/app/demo/_data";

export const metadata = { robots: "noindex" };

const order = DEMO_SINGLE_ORDER;

export default function DemoOrderDispatchPage() {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      style={{ background: "#ffffff", color: "rgba(0,0,0,0.78)", fontWeight: 900 }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-16">
        <DemoBanner />

        <header className="mt-8 flex flex-col gap-2">
          <span className="label-caps" style={{ fontSize: 17, letterSpacing: "0.08em" }}>
            Dispatch · Single order
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.1,
              color: "rgba(0,0,0,0.95)",
            }}
          >
            Order {order.shortId}
          </h1>
          <p style={{ maxWidth: "60ch", fontSize: 17, lineHeight: 1.55, color: "rgba(0,0,0,0.7)" }}>
            Print and ship this order, then enter the tracking number below. Submitting marks it
            shipped and emails the customer their tracking.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span style={{ color: "rgba(0,0,0,0.6)" }}>Placed {date}</span>
            <StatusPill status={order.status} />
          </div>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-[200px_1fr]">
          <h2 className="label-caps">Ship to</h2>
          <div className="text-sm" style={{ color: "rgba(0,0,0,0.78)" }}>
            <div style={{ color: "rgba(0,0,0,0.95)" }}>{order.shippingAddress.name}</div>
            <div>{order.shippingAddress.line1}</div>
            {order.shippingAddress.line2 ? <div>{order.shippingAddress.line2}</div> : null}
            <div>
              {order.shippingAddress.city}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
              {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
            </div>
            <div>{order.shippingAddress.country}</div>
          </div>
        </section>

        <section className="mt-12 border-t border-ink-line pt-8">
          <h2 className="label-caps" style={{ marginBottom: 12 }}>
            Line items
          </h2>
          <ul className="flex flex-col gap-10">
            {order.items.map((item) => (
              <li key={item.id} className="grid gap-6 md:grid-cols-[120px_1fr]">
                <div
                  className="aspect-[3/4] border border-ink-line"
                  style={{
                    background: "#f4f4f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(0,0,0,0.3)",
                      textAlign: "center",
                      padding: 8,
                    }}
                  >
                    Print file
                    <br />
                    preview
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <div
                      className="label-caps"
                      style={{ color: "rgba(0,0,0,0.5)", marginBottom: 4 }}
                    >
                      Ref TB-2021-003
                    </div>
                    <div style={{ fontSize: 20, lineHeight: 1.2, color: "rgba(0,0,0,0.95)" }}>
                      {item.title}
                    </div>
                  </div>
                  <dl
                    className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm"
                    style={{ color: "rgba(0,0,0,0.78)" }}
                  >
                    <div>
                      <dt className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
                        Size
                      </dt>
                      <dd>{item.sizeLabel}</dd>
                    </div>
                    <div>
                      <dt className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
                        Paper
                      </dt>
                      <dd>Hahnemühle Fine Art</dd>
                    </div>
                    <div>
                      <dt className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
                        Quantity
                      </dt>
                      <dd>1</dd>
                    </div>
                    <div>
                      <dt className="label-caps" style={{ color: "rgba(0,0,0,0.5)" }}>
                        Edition
                      </dt>
                      <dd>
                        {item.editionNumber} of {item.editionTotal}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <span
                      style={{
                        border: "1px solid rgba(0,0,0,0.18)",
                        padding: "8px 18px",
                        fontSize: 14,
                        color: "rgba(0,0,0,0.35)",
                      }}
                    >
                      Download print file (R2 — disabled in demo)
                    </span>
                    <span
                      style={{
                        border: "1px solid rgba(0,0,0,0.18)",
                        padding: "8px 18px",
                        fontSize: 14,
                        color: "rgba(0,0,0,0.35)",
                      }}
                    >
                      Download COA (disabled in demo)
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 border-t border-ink-line pt-8">
          <h2 className="label-caps" style={{ marginBottom: 12 }}>
            Submit tracking
          </h2>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)", marginBottom: 18 }}>
            One tracking number per order. Notes stay internal — they land in Thalia&apos;s inbox,
            not the customer&apos;s.
          </p>
          <TrackingForm
            orderId={order.orderId}
            token="demo"
            initialCarrier={null}
            initialTrackingNumber={null}
            initialNotes={null}
            submittedAt={null}
            endpoint="/api/demo/dispatch-status"
          />
        </section>

        <footer
          className="mt-16 border-t border-ink-line pt-6 text-xs"
          style={{ color: "rgba(0,0,0,0.4)" }}
        >
          <p>
            In production this page is reached via a signed token in the print-job email. The token
            is stored on the order row and revocable from admin. The &quot;Download print file&quot;
            button generates a Cloudflare R2 presigned URL on demand — the master TIFF never leaves
            the private bucket.
          </p>
          <div className="mt-4 flex gap-6">
            <Link
              href="/demo/batch-dispatch"
              style={{ color: "rgba(0,0,0,0.5)", textDecoration: "underline" }}
            >
              ← Batch dispatch
            </Link>
            <Link
              href="/demo/admin"
              style={{ color: "rgba(0,0,0,0.5)", textDecoration: "underline" }}
            >
              Admin dashboard →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className="label-caps"
      style={{
        border: "1px solid rgba(0,0,0,0.18)",
        padding: "2px 8px",
        color: "rgba(0,0,0,0.78)",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function DemoBanner() {
  return (
    <div
      style={{
        background: "rgba(21,41,219,0.06)",
        border: "1px solid rgba(21,41,219,0.2)",
        padding: "10px 16px",
        fontSize: 13,
        color: "rgba(21,41,219,0.85)",
        lineHeight: 1.5,
      }}
    >
      <strong>Demo mode</strong> — fake order, mock API. Tracking submission returns success without
      touching the database or sending emails.
    </div>
  );
}
