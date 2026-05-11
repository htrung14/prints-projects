import Link from "next/link";
import { BatchTrackingTable } from "@/components/dispatch/BatchTrackingTable";
import { DEMO_ORDERS } from "@/app/demo/_data";

export const metadata = { robots: "noindex" };

const totalPrints = DEMO_ORDERS.reduce((n, o) => n + o.items.length, 0);
const reprintCount = DEMO_ORDERS.filter((o) => o.reprintLabel).length;

export default function DemoBatchDispatchPage() {
  return (
    <div
      style={{ background: "#ffffff", color: "rgba(0,0,0,0.78)", fontWeight: 900 }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-16">
        <DemoBanner />

        <header className="mt-8 flex flex-col gap-3">
          <span className="label-caps" style={{ fontSize: 17, letterSpacing: "0.08em" }}>
            Dispatch · Batch
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.1,
              color: "rgba(0,0,0,0.95)",
            }}
          >
            {DEMO_ORDERS.length} orders ready to ship
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: "rgba(0,0,0,0.6)", maxWidth: "60ch" }}>
            {totalPrints} prints total
            {reprintCount > 0 ? `, ${reprintCount} reprint` : ""}. Enter tracking numbers below and
            submit — each customer receives a shipping notification automatically.
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            <a
              href="#"
              className="btn-ghost"
              style={{ padding: "8px 18px", fontSize: 14, opacity: 0.45, cursor: "not-allowed" }}
              onClick={(e) => e.preventDefault()}
            >
              Download pick-list PDF
            </a>
            <span style={{ fontSize: 13, color: "rgba(0,0,0,0.4)", alignSelf: "center" }}>
              (disabled in demo)
            </span>
          </div>
        </header>

        <div className="mt-12">
          <BatchTrackingTable token="demo" rows={DEMO_ORDERS} endpoint="/api/demo/dispatch-batch" />
        </div>

        <footer
          className="mt-16 border-t border-ink-line pt-6 text-xs"
          style={{ color: "rgba(0,0,0,0.4)" }}
        >
          <p>
            In production this page is sent to Loupe (the print lab) via a signed, expiring link in
            the weekly batch email. Submitting tracking flips each order to <code>shipped</code> in
            Supabase and fires Resend customer emails. No DB writes happen in demo mode.
          </p>
          <div className="mt-4 flex gap-6">
            <Link href="/demo" style={{ color: "rgba(0,0,0,0.5)", textDecoration: "underline" }}>
              ← Demo index
            </Link>
            <Link
              href="/demo/order-dispatch"
              style={{ color: "rgba(0,0,0,0.5)", textDecoration: "underline" }}
            >
              Single order dispatch →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function DemoBanner() {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(21,41,219,0.07)",
        borderBottom: "1px solid rgba(21,41,219,0.25)",
        padding: "10px 16px",
        fontSize: 13,
        color: "rgba(21,41,219,0.9)",
        lineHeight: 1.5,
      }}
    >
      <strong>Demo — no real data.</strong> Fake orders. Tracking submissions hit a mock endpoint
      and return success without touching the database or sending emails.{" "}
      <a href="/demo" style={{ color: "inherit", textDecoration: "underline" }}>
        Back to demo index →
      </a>
    </div>
  );
}
