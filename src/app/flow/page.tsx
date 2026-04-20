/**
 * /flow — visual walkthrough of the entire order lifecycle.
 *
 * Static page, no auth or DB required. Uses hardcoded mock data to render
 * each backend surface inline so stakeholders can review the flow end-to-end
 * without provisioning real API keys.
 *
 * Sections:
 *   1. Lifecycle diagram (status pipeline)
 *   2. Admin order list (mock)
 *   3. Admin order detail (mock)
 *   4. Dispatch page (what Rob sees)
 *   5. Email previews (all templates, inline)
 *   6. COA metadata preview
 */

import Link from "next/link";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ORDER = {
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  createdAt: "2026-04-19T14:32:00Z",
  customerName: "Sarah Chen",
  customerEmail: "sarah@example.com",
  status: "paid" as const,
  totalCents: 22000,
  subtotalCents: 22000,
  taxCents: 0,
  shippingCents: 0,
  currency: "usd",
  shippingAddress: {
    name: "Sarah Chen",
    line1: "142 Wooster Street",
    line2: "Apt 4B",
    city: "New York",
    state: "NY",
    postalCode: "10012",
    country: "US",
  },
  trackingNumber: null as string | null,
  carrier: null as string | null,
  fulfillmentToken: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6abcd",
};

const MOCK_ITEM = {
  id: "item-001",
  photoTitle: "Mount Lebanon, February 2025",
  photoSlug: "mount-lebanon-feb-2025",
  sizeLabel: "8 x 10 in",
  paperName: "Hahnemuhle Photo Rag",
  editionNumber: 3,
  editionTotal: 10,
  quantity: 1,
  unitPriceCents: 30000,
  printFileKey: "masters/mount-lebanon-feb-2025.tif",
};

const STATUSES = [
  {
    key: "paid",
    label: "Paid",
    desc: "Stripe webhook fires, order persisted in Supabase, edition number locked",
  },
  {
    key: "sent_to_print",
    label: "Sent to print",
    desc: "Rob opens the dispatch link (auto-set on first page visit)",
  },
  { key: "printed", label: "Printed", desc: "Optional - Rob marks printed before shipping" },
  {
    key: "shipped",
    label: "Shipped",
    desc: "Rob submits tracking on dispatch page, shipped email sent",
  },
  { key: "delivered", label: "Delivered", desc: "Carrier webhook or manual admin set" },
];

const EMAILS = [
  {
    name: "Order Confirmation",
    to: "Customer",
    trigger: "Stripe webhook (checkout.session.completed)",
    subject: "Order TB-2026-D479 received",
    preview:
      "Order received. Reference TB-2026-D479. Lists each print with edition number, shipping address, and totals. Production note: three to four weeks, tracking follows.",
  },
  {
    name: "Print Job",
    to: "Rob (Brooklyn Archival)",
    trigger: "Same webhook, after order confirmation",
    subject: "[Order TB-2026-D479] New print job, ready to fulfill",
    preview:
      "Links to the dispatch page with download buttons for each print file (signed R2 URL). Rob replies to this thread with questions.",
  },
  {
    name: "Shipped",
    to: "Customer",
    trigger: "Rob submits tracking on dispatch page",
    subject: "Order TB-2026-D479 shipped",
    preview:
      "Carrier + tracking number. Care note: open flat, inspect on arrival, reply within 14 days if damaged.",
  },
  {
    name: "Post-Purchase (7 touches)",
    to: "Customer",
    trigger: "Scheduled: day 0, dispatch, delivery, day 7, 14, 30, 60",
    subject: "Various (care notes, referral, check-in, new work)",
    preview:
      "Touch 1: care-before-dispatch. Touch 4: framing + UV glass advice. Touch 5: referral $20/$20. Touch 7: early access to next drop.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FlowPage() {
  return (
    <div
      style={{
        background: "#ffffff",
        color: "rgba(0,0,0,0.78)",
        fontWeight: 900,
        fontFamily: "Helvetica, Arial, sans-serif",
      }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-20">
        {/* Header */}
        <div className="mb-16 flex items-baseline justify-between">
          <div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", letterSpacing: "-0.02em" }}>
              Order Lifecycle
            </h1>
            <p className="mt-2 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
              Test flow for At-Tamassok print shop. Mock data, no DB required.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm underline underline-offset-4"
            style={{ color: "rgba(0,0,0,0.5)" }}
          >
            Back to shop
          </Link>
        </div>

        {/* ── 1. Status Pipeline ── */}
        <Section n={1} title="Status Pipeline">
          <p className="mb-6 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            Every order progresses through these states. Terminal states: refunded, cancelled.
          </p>
          <div className="flex flex-col gap-0">
            {STATUSES.map((s, i) => (
              <div
                key={s.key}
                className="flex items-start gap-4 border-l-2 pb-8 pl-6"
                style={{ borderColor: i === 0 ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.15)" }}
              >
                <div className="flex flex-col">
                  <span
                    className="text-xs font-[900] uppercase tracking-wider"
                    style={{
                      letterSpacing: "0.06em",
                      color: i === 0 ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.4)",
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    className="mt-1 text-sm"
                    style={{ color: "rgba(0,0,0,0.5)", fontWeight: 400 }}
                  >
                    {s.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 2. Admin Order List ── */}
        <Section n={2} title="Admin: Order List">
          <p className="mb-4 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            <code style={{ fontSize: 12 }}>/admin/orders</code> — filterable by status. Auth-gated
            via Supabase session + ADMIN_EMAILS allowlist.
          </p>
          <div
            className="overflow-x-auto rounded border"
            style={{ borderColor: "rgba(0,0,0,0.1)" }}
          >
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                  {["Date", "Ref", "Customer", "Total", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs uppercase tracking-wider"
                      style={{ color: "rgba(0,0,0,0.4)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <MockOrderRow
                  status="paid"
                  date="2026-04-19"
                  ref_="D479"
                  name="Sarah Chen"
                  total="$220.00"
                />
                <MockOrderRow
                  status="sent to print"
                  date="2026-04-17"
                  ref_="A1F2"
                  name="James Kim"
                  total="$320.00"
                />
                <MockOrderRow
                  status="shipped"
                  date="2026-04-12"
                  ref_="7B3C"
                  name="Lina Morel"
                  total="$180.00"
                />
                <MockOrderRow
                  status="delivered"
                  date="2026-04-01"
                  ref_="E9D4"
                  name="Mark Hassan"
                  total="$220.00"
                />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── 3. Admin Order Detail ── */}
        <Section n={3} title="Admin: Order Detail">
          <p className="mb-4 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            <code style={{ fontSize: 12 }}>/admin/orders/[id]</code> — full order detail with status
            controls, fulfillment token management, and audit log.
          </p>
          <MockCard>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <MockLabel label="Customer">
                  <div>{MOCK_ORDER.customerName}</div>
                  <div style={{ color: "rgba(0,0,0,0.4)", fontSize: 12 }}>
                    {MOCK_ORDER.customerEmail}
                  </div>
                </MockLabel>
                <MockLabel label="Ship to">
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                    {MOCK_ORDER.shippingAddress.name}
                    <br />
                    {MOCK_ORDER.shippingAddress.line1}
                    <br />
                    {MOCK_ORDER.shippingAddress.line2}
                    <br />
                    {MOCK_ORDER.shippingAddress.city}, {MOCK_ORDER.shippingAddress.state}{" "}
                    {MOCK_ORDER.shippingAddress.postalCode}
                    <br />
                    {MOCK_ORDER.shippingAddress.country}
                  </div>
                </MockLabel>
                <MockLabel label="Line items">
                  <div className="flex items-baseline justify-between text-sm">
                    <span>{MOCK_ITEM.photoTitle}</span>
                    <span>$220.00</span>
                  </div>
                  <div
                    className="flex flex-wrap gap-3 text-xs"
                    style={{ color: "rgba(0,0,0,0.4)" }}
                  >
                    <span>{MOCK_ITEM.sizeLabel}</span>
                    <span>{MOCK_ITEM.paperName}</span>
                    <span>
                      Edition {MOCK_ITEM.editionNumber} / {MOCK_ITEM.editionTotal}
                    </span>
                  </div>
                </MockLabel>
              </div>
              <div className="flex flex-col gap-4">
                <MockLabel label="Status controls">
                  <div className="text-sm">
                    Current: <strong>paid</strong>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["sent to print", "printed", "shipped", "delivered"].map((s) => (
                      <span
                        key={s}
                        className="inline-block border px-2 py-1 text-xs"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      >
                        &rarr; {s}
                      </span>
                    ))}
                  </div>
                </MockLabel>
                <MockLabel label="Fulfillment token">
                  <div className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                    a1b2c3d4...f6abcd
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span
                      className="inline-block border px-2 py-1 text-xs"
                      style={{ borderColor: "rgba(0,0,0,0.15)" }}
                    >
                      Regenerate + resend
                    </span>
                    <span
                      className="inline-block border px-2 py-1 text-xs"
                      style={{ borderColor: "rgba(0,0,0,0.15)" }}
                    >
                      Revoke
                    </span>
                  </div>
                </MockLabel>
                <MockLabel label="Totals">
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "rgba(0,0,0,0.4)" }}>Subtotal</span>
                      <span>$220.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "rgba(0,0,0,0.4)" }}>Tax</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "rgba(0,0,0,0.4)" }}>Shipping</span>
                      <span>$0.00</span>
                    </div>
                    <div
                      className="mt-1 flex justify-between border-t pt-1"
                      style={{ borderColor: "rgba(0,0,0,0.1)" }}
                    >
                      <strong>Total</strong>
                      <strong>$220.00</strong>
                    </div>
                  </div>
                </MockLabel>
              </div>
            </div>
          </MockCard>
        </Section>

        {/* ── 4. Dispatch (Rob's View) ── */}
        <Section n={4} title="Dispatch: Printer View">
          <p className="mb-4 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            <code style={{ fontSize: 12 }}>/dispatch/[orderId]?token=...</code> — magic-link page
            for Rob at Brooklyn Archival. Token-gated, auto-advances to &ldquo;sent_to_print&rdquo;
            on first view.
          </p>
          <MockCard>
            <div className="flex flex-col gap-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em" }}
                  >
                    Dispatch
                  </span>
                  <h3 style={{ fontSize: 20, marginTop: 4 }}>Order f47ac10b</h3>
                </div>
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em" }}
                >
                  sent to print
                </span>
              </div>

              <MockLabel label="Ship to">
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  Sarah Chen
                  <br />
                  142 Wooster Street, Apt 4B
                  <br />
                  New York, NY 10012
                  <br />
                  US
                </div>
              </MockLabel>

              <MockLabel label="Prints (1)">
                <div
                  className="flex items-center justify-between border-b pb-3"
                  style={{ borderColor: "rgba(0,0,0,0.1)" }}
                >
                  <div>
                    <div className="text-sm">{MOCK_ITEM.photoTitle}</div>
                    <div className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                      {MOCK_ITEM.sizeLabel} on {MOCK_ITEM.paperName} &middot; Ed.{" "}
                      {MOCK_ITEM.editionNumber}/{MOCK_ITEM.editionTotal}
                    </div>
                  </div>
                  <span
                    className="inline-block border px-3 py-1.5 text-xs"
                    style={{ borderColor: "rgba(0,0,0,0.15)" }}
                  >
                    Download print file
                  </span>
                </div>
              </MockLabel>

              <MockLabel label="Tracking">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                      Tracking number
                    </span>
                    <div
                      className="border-b pb-1.5 text-sm"
                      style={{ borderColor: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.3)" }}
                    >
                      9400...
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                      Carrier
                    </span>
                    <div
                      className="border-b pb-1.5 text-sm"
                      style={{ borderColor: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.3)" }}
                    >
                      USPS
                    </div>
                  </div>
                </div>
                <span
                  className="mt-3 inline-block border px-3 py-1.5 text-xs"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}
                >
                  Submit tracking &rarr; marks shipped + sends email
                </span>
              </MockLabel>
            </div>
          </MockCard>
        </Section>

        {/* ── 5. Email Templates ── */}
        <Section n={5} title="Email Templates">
          <p className="mb-6 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            All emails use a minimal template: Helvetica, weight 900, rgba(0,0,0,0.6), max-width
            560px. Sent via Resend.
          </p>
          <div className="flex flex-col gap-4">
            {EMAILS.map((e) => (
              <MockCard key={e.name}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm">{e.name}</span>
                    <span className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                      To: {e.to}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                    Trigger: {e.trigger}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                    Subject: <em>{e.subject}</em>
                  </div>
                  <div
                    className="mt-2 border-t pt-3 text-sm"
                    style={{
                      borderColor: "rgba(0,0,0,0.08)",
                      color: "rgba(0,0,0,0.55)",
                      fontWeight: 400,
                    }}
                  >
                    {e.preview}
                  </div>
                </div>
              </MockCard>
            ))}
          </div>
        </Section>

        {/* ── 6. COA ── */}
        <Section n={6} title="Certificate of Authenticity">
          <p className="mb-4 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            Generated as a PDF via @react-pdf/renderer. 8.5x11 portrait, Helvetica. Endpoint:{" "}
            <code style={{ fontSize: 12 }}>/api/coa/[orderId]</code>.
          </p>
          <MockCard>
            <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
              <div
                className="flex items-center justify-center border"
                style={{
                  borderColor: "rgba(0,0,0,0.15)",
                  minHeight: 240,
                  background: "rgba(0,0,0,0.02)",
                }}
              >
                <span className="text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>
                  Print preview placeholder
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <div style={{ fontSize: 13 }}>
                  <strong>Thalia Bassim</strong>
                </div>
                <MockLabel label="Title">
                  <span className="text-sm">{MOCK_ITEM.photoTitle}</span>
                </MockLabel>
                <MockLabel label="Edition">
                  <span className="text-sm" style={{ fontSize: 14 }}>
                    {MOCK_ITEM.editionNumber} of {MOCK_ITEM.editionTotal}
                  </span>
                </MockLabel>
                <MockLabel label="Size">
                  <span className="text-sm">{MOCK_ITEM.sizeLabel}</span>
                </MockLabel>
                <MockLabel label="Paper">
                  <span className="text-sm">{MOCK_ITEM.paperName}</span>
                </MockLabel>
                <MockLabel label="Reference">
                  <span className="text-sm">TB-2026-D479</span>
                </MockLabel>
                <div className="mt-3 border-t pt-3" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                  <MockLabel label="Provenance">
                    <span
                      className="text-xs"
                      style={{ color: "rgba(0,0,0,0.45)", fontWeight: 400 }}
                    >
                      Printed to order on archival pigment paper. Issued against the edition
                      register held by Thalia Bassim.
                    </span>
                  </MockLabel>
                </div>
              </div>
            </div>
          </MockCard>
        </Section>

        {/* ── 7. Env Keys Checklist ── */}
        <Section n={7} title="Environment Keys">
          <p className="mb-4 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            Required env vars before going live. All service clients are lazy-initialized and throw
            descriptive errors on first use if unset.
          </p>
          <div
            className="overflow-x-auto rounded border"
            style={{ borderColor: "rgba(0,0,0,0.1)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                  {["Service", "Variable", "Scope"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs uppercase tracking-wider"
                      style={{ color: "rgba(0,0,0,0.4)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <EnvRow svc="Stripe" name="STRIPE_SECRET_KEY" scope="server" />
                <EnvRow svc="Stripe" name="STRIPE_WEBHOOK_SECRET" scope="server" />
                <EnvRow svc="Supabase" name="NEXT_PUBLIC_SUPABASE_URL" scope="public" />
                <EnvRow svc="Supabase" name="NEXT_PUBLIC_SUPABASE_ANON_KEY" scope="public" />
                <EnvRow svc="Supabase" name="SUPABASE_SERVICE_ROLE_KEY" scope="server" />
                <EnvRow svc="R2" name="R2_ACCOUNT_ID" scope="server" />
                <EnvRow svc="R2" name="R2_ACCESS_KEY_ID" scope="server" />
                <EnvRow svc="R2" name="R2_SECRET_ACCESS_KEY" scope="server" />
                <EnvRow svc="R2" name="R2_BUCKET_NAME" scope="server" />
                <EnvRow svc="Resend" name="RESEND_API_KEY" scope="server" />
                <EnvRow svc="Resend" name="PRINT_SHOP_EMAIL" scope="server" />
                <EnvRow svc="Auth" name="ADMIN_EMAILS" scope="server" />
                <EnvRow svc="Auth" name="DISPATCH_SIGNING_SECRET" scope="server" />
                <EnvRow svc="App" name="NEXT_PUBLIC_APP_URL" scope="public" />
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── 8. Links ── */}
        <Section n={8} title="Quick Links">
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/" className="underline underline-offset-4">
              Home (landing + grid)
            </Link>
            <Link href="/photos/mount-lebanon-feb-2025" className="underline underline-offset-4">
              Product detail (Mount Lebanon)
            </Link>
            <Link href="/checkout" className="underline underline-offset-4">
              Checkout
            </Link>
            <Link href="/essay" className="underline underline-offset-4">
              Essay
            </Link>
            <Link href="/terms" className="underline underline-offset-4">
              Terms &amp; Conditions
            </Link>
            <span style={{ color: "rgba(0,0,0,0.4)" }}>
              /admin/orders — requires auth + allowlisted email
            </span>
            <span style={{ color: "rgba(0,0,0,0.4)" }}>
              /dispatch/[orderId]?token=... — requires valid HMAC token
            </span>
          </div>
        </Section>

        <footer
          className="mt-20 border-t pt-6 text-xs"
          style={{ borderColor: "rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.35)" }}
        >
          Test flow page. Not visible to customers. Built {new Date().toISOString().slice(0, 10)}.
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="mb-6 flex items-baseline gap-3">
        <span className="text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>
          {n}.
        </span>
        <h2 style={{ fontSize: 18, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MockCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded border p-5"
      style={{ borderColor: "rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.015)" }}
    >
      {children}
    </div>
  );
}

function MockLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-xs font-[900] uppercase tracking-wider"
        style={{ color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em" }}
      >
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function MockOrderRow({
  status,
  date,
  ref_,
  name,
  total,
}: {
  status: string;
  date: string;
  ref_: string;
  name: string;
  total: string;
}) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <td className="px-4 py-2.5 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
        {date}
      </td>
      <td className="px-4 py-2.5 text-sm underline underline-offset-2">TB-2026-{ref_}</td>
      <td className="px-4 py-2.5 text-sm">{name}</td>
      <td className="px-4 py-2.5 text-sm text-right">{total}</td>
      <td
        className="px-4 py-2.5 text-xs uppercase tracking-wider"
        style={{ color: "rgba(0,0,0,0.4)" }}
      >
        {status}
      </td>
    </tr>
  );
}

function EnvRow({ svc, name, scope }: { svc: string; name: string; scope: "server" | "public" }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <td className="px-4 py-2 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
        {svc}
      </td>
      <td className="px-4 py-2 font-mono text-xs">{name}</td>
      <td
        className="px-4 py-2 text-xs"
        style={{ color: scope === "server" ? "rgba(0,0,0,0.4)" : "rgba(140,80,0,0.7)" }}
      >
        {scope}
      </td>
    </tr>
  );
}
