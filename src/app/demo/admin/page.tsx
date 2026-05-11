import Link from "next/link";
import { DEMO_ADMIN_METRICS, DEMO_STUCK_ORDERS, DEMO_AUDIT_LOG } from "@/app/demo/_data";

export const metadata = { robots: "noindex" };

function formatDateTime(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

const NOW = "2026-05-11T10:09:00Z";

const TILES = [
  {
    label: "Paid, not batched",
    count: DEMO_ADMIN_METRICS.paidNotBatched,
    cta: "Send to printer →",
  },
  {
    label: "Reprints waiting for batch",
    count: DEMO_ADMIN_METRICS.reprintsWaiting,
    cta: "Run batch dispatch →",
  },
  {
    label: "In print",
    count: DEMO_ADMIN_METRICS.inPrint,
    cta: null,
  },
  {
    label: "Shipped, not delivered",
    count: DEMO_ADMIN_METRICS.shippedNotDelivered,
    cta: null,
  },
  {
    label: "Delivered — last 30 days",
    count: DEMO_ADMIN_METRICS.deliveredLast30,
    cta: null,
  },
  {
    label: "Refunded — last 30 days",
    count: DEMO_ADMIN_METRICS.refundedLast30,
    cta: null,
  },
];

export default function DemoAdminPage() {
  return (
    <div
      style={{ background: "#ffffff", color: "rgba(0,0,0,0.78)", fontWeight: 900 }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-16">
        <DemoBanner />

        <section className="mt-8 flex flex-col gap-10">
          <header className="flex items-baseline justify-between">
            <h1 className="h-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}>
              Dashboard
            </h1>
            <span className="text-sm" style={{ color: "rgba(0,0,0,0.4)" }}>
              {formatDateTime(NOW)}
            </span>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TILES.map((t) => (
              <div
                key={t.label}
                className="flex flex-col justify-between gap-4 border border-ink-line p-5"
              >
                <span className="label-caps" style={{ color: "rgba(0,0,0,0.5)", fontSize: 11 }}>
                  {t.label}
                </span>
                <span
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 900,
                    color: "rgba(0,0,0,0.95)",
                    lineHeight: 1,
                  }}
                >
                  {t.count}
                </span>
                {t.cta ? (
                  <span
                    className="text-sm"
                    style={{
                      color: "var(--btn-accent)",
                      textDecoration: "underline",
                      cursor: "default",
                    }}
                  >
                    {t.cta}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className="label-caps" style={{ color: "rgba(0,0,0,0.5)", fontSize: 11 }}>
                Stuck with printer
              </h2>
              <ul className="flex flex-col gap-2 text-sm">
                {DEMO_STUCK_ORDERS.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-baseline justify-between border-b border-ink-line pb-2"
                  >
                    <span style={{ color: "rgba(0,0,0,0.78)", fontFamily: "monospace" }}>
                      {o.shortId}
                    </span>
                    <span style={{ color: "rgba(0,0,0,0.45)" }}>{o.daysStuck} days</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 12, color: "rgba(0,0,0,0.35)", lineHeight: 1.5 }}>
                Flagged after 7 days in <code>sent_to_print</code>. Cron watchdog checks every 24h
                and fires a Telegram + email alert if any order crosses the threshold.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="label-caps" style={{ color: "rgba(0,0,0,0.5)", fontSize: 11 }}>
                Recent system activity
              </h2>
              <ul className="flex flex-col gap-2 text-sm">
                {DEMO_AUDIT_LOG.map((e) => (
                  <li key={e.id} className="flex flex-col border-b border-ink-line pb-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span style={{ color: "rgba(0,0,0,0.78)" }}>{e.action}</span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "rgba(0,0,0,0.4)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDateTime(e.createdAt)}
                      </span>
                    </div>
                    {e.meta ? (
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          color: "rgba(0,0,0,0.4)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {e.meta}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <nav
            className="flex flex-wrap gap-6 border-t border-ink-line pt-6 text-sm"
            style={{ color: "rgba(0,0,0,0.5)" }}
          >
            {["Orders", "Photos", "Audit", "Settings"].map((label) => (
              <span
                key={label}
                style={{ textDecoration: "underline", opacity: 0.5, cursor: "default" }}
              >
                {label}
              </span>
            ))}
            <span style={{ fontSize: 12, color: "rgba(0,0,0,0.3)", alignSelf: "center" }}>
              (require auth in production)
            </span>
          </nav>
        </section>

        <footer
          className="mt-16 border-t border-ink-line pt-6 text-xs"
          style={{ color: "rgba(0,0,0,0.4)" }}
        >
          <p>
            In production, admin routes are protected by Supabase magic-link auth with two roles:
            <strong> admin</strong> (full access, refunds) and <strong>editor</strong> (catalog +
            fulfillment status). All writes append to the audit log with actor + metadata.
          </p>
          <div className="mt-4 flex gap-6">
            <Link
              href="/demo/order-dispatch"
              style={{ color: "rgba(0,0,0,0.5)", textDecoration: "underline" }}
            >
              ← Single order dispatch
            </Link>
            <Link href="/demo" style={{ color: "rgba(0,0,0,0.5)", textDecoration: "underline" }}>
              Demo index →
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
        background: "rgba(21,41,219,0.06)",
        border: "1px solid rgba(21,41,219,0.2)",
        padding: "10px 16px",
        fontSize: 13,
        color: "rgba(21,41,219,0.85)",
        lineHeight: 1.5,
      }}
    >
      <strong>Demo mode</strong> — fake metrics and audit log. In production this page requires
      admin magic-link auth and reads live from Supabase.
    </div>
  );
}
