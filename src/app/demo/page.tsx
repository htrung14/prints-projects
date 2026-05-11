import Link from "next/link";

export const metadata = { robots: "noindex" };

const VIEWS = [
  {
    href: "/demo/batch-dispatch",
    label: "Printer batch dispatch",
    description:
      "Weekly batch email sends this link to Loupe (the printer). Enter tracking numbers for 3 pending orders — one is a reprint. Submitting fires customer shipping emails.",
    tags: ["Supabase", "R2 presigned URL", "Resend email", "Stripe webhook"],
  },
  {
    href: "/demo/order-dispatch",
    label: "Single order dispatch",
    description:
      "Per-order fulfillment view. Shows print specs, edition number, COA download, and a token-gated R2 print-file download. Tracking form flips order status to shipped.",
    tags: ["Token-gated access", "R2 presigned URL", "@react-pdf COA"],
  },
  {
    href: "/demo/admin",
    label: "Admin dashboard",
    description:
      "Daily operator overview: order state counts, stuck-with-printer detection (7-day threshold), and a system audit log tail. Magic-link auth via Supabase in production.",
    tags: ["Supabase RLS", "Audit log", "Cron watchdog", "Magic link auth"],
  },
];

export default function DemoPage() {
  return (
    <div
      style={{ background: "#ffffff", color: "rgba(0,0,0,0.78)", fontWeight: 900 }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-20">
        <header className="flex flex-col gap-3 border-b border-ink-line pb-10">
          <Link
            href="/"
            className="label-caps"
            style={{ color: "rgba(0,0,0,0.45)", textDecoration: "none", fontSize: 13 }}
          >
            ← thaliabassim.com
          </Link>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 1.05,
              color: "rgba(0,0,0,0.95)",
            }}
          >
            Backend demo
          </h1>
          <p style={{ maxWidth: "56ch", fontSize: 17, lineHeight: 1.6, color: "rgba(0,0,0,0.6)" }}>
            Live production codebase — fake order data. Interactions POST to mock API endpoints that
            return success without touching the database or sending real emails.
          </p>
        </header>

        <ul className="mt-10 flex flex-col gap-6">
          {VIEWS.map((v) => (
            <li key={v.href}>
              <Link
                href={v.href}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <div
                  className="border border-ink-line p-6 transition-colors"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,0,0,0.5)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,0,0,0.12)")
                  }
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <span style={{ fontSize: 22, lineHeight: 1.2, color: "rgba(0,0,0,0.95)" }}>
                      {v.label} →
                    </span>
                  </div>
                  <p
                    className="mt-3"
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: "rgba(0,0,0,0.6)",
                      maxWidth: "60ch",
                    }}
                  >
                    {v.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {v.tags.map((t) => (
                      <span
                        key={t}
                        className="label-caps"
                        style={{
                          border: "1px solid rgba(0,0,0,0.15)",
                          padding: "2px 8px",
                          fontSize: 11,
                          color: "rgba(0,0,0,0.5)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <footer className="mt-16 border-t border-ink-line pt-6">
          <p style={{ fontSize: 13, color: "rgba(0,0,0,0.4)" }}>
            Source:{" "}
            <a
              href="https://github.com/htrung14/prints-projects"
              style={{ color: "rgba(0,0,0,0.5)", textDecoration: "underline" }}
              target="_blank"
              rel="noreferrer"
            >
              github.com/htrung14/prints-projects
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
