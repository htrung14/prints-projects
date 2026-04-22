/**
 * Dev-only preview of /dispatch/batch with stubbed orders so the layout
 * can be reviewed without a live batch in the database. 404s in production.
 *
 * NOTE: the Mark-all-sent + Submit-tracking actions will fail in preview
 * (token is a dummy) — this route is purely for visual review.
 */

import { notFound } from "next/navigation";
import type { Address } from "@/lib/types";
import { BatchTrackingTable } from "@/components/dispatch/BatchTrackingTable";

const SHARED_ADDRESS_A: Address = {
  name: "Alex Collector",
  line1: "123 Example St",
  line2: null,
  city: "Brooklyn",
  state: "NY",
  postalCode: "11201",
  country: "US",
};
const SHARED_ADDRESS_B: Address = {
  name: "Marie Dubois",
  line1: "45 rue de Rivoli",
  line2: null,
  city: "Paris",
  state: null,
  postalCode: "75001",
  country: "FR",
};

const STUB_ROWS = [
  {
    orderId: "a1b2c3d4-0001-0000-0000-000000000001",
    shortId: "a1b2c3d4",
    customerName: "Alex Collector",
    shippingAddress: SHARED_ADDRESS_A,
    items: [
      {
        id: "item-1",
        title: "Bekaa, February 2025",
        sizeLabel: "8 × 10 in",
        editionNumber: 3,
        editionTotal: 10,
      },
    ],
    initialCarrier: null,
    initialTrackingNumber: null,
    reprintLabel: null,
  },
  {
    orderId: "b2c3d4e5-0002-0000-0000-000000000002",
    shortId: "b2c3d4e5",
    customerName: "Marie Dubois",
    shippingAddress: SHARED_ADDRESS_B,
    items: [
      {
        id: "item-2a",
        title: "North Lebanon (2), October 2020",
        sizeLabel: "8 × 10 in",
        editionNumber: 7,
        editionTotal: 10,
      },
      {
        id: "item-2b",
        title: "Keserwan, February 2026",
        sizeLabel: "8 × 10 in",
        editionNumber: 2,
        editionTotal: 10,
      },
    ],
    initialCarrier: null,
    initialTrackingNumber: null,
    reprintLabel: null,
  },
  {
    orderId: "c3d4e5f6-0003-0000-0000-000000000003",
    shortId: "c3d4e5f6",
    customerName: "Alex Collector",
    shippingAddress: SHARED_ADDRESS_A,
    items: [
      {
        id: "item-3",
        title: "Bekaa, February 2025",
        sizeLabel: "8 × 10 in",
        editionNumber: 3,
        editionTotal: 10,
      },
    ],
    initialCarrier: null,
    initialTrackingNumber: null,
    reprintLabel: "REPRINT · damaged in transit",
  },
];

const STUB_TOKEN = "preview-dev-token";

export default function DispatchBatchPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  const totalPrints = STUB_ROWS.reduce((acc, r) => acc + r.items.length, 0);
  const reprintCount = STUB_ROWS.filter((r) => r.reprintLabel !== null).length;

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "rgba(0,0,0,0.78)",
        fontWeight: 900,
      }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-16">
        <header className="flex flex-col gap-2">
          <span className="label-caps" style={{ fontSize: 17, letterSpacing: "0.08em" }}>
            Dispatch · This week&apos;s batch (PREVIEW)
          </span>
          <h1
            className="h-display-xl"
            style={{
              color: "rgba(0,0,0,0.95)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
            }}
          >
            {STUB_ROWS.length} pending order{STUB_ROWS.length === 1 ? "" : "s"}
          </h1>
          <p
            className="mt-3"
            style={{
              color: "rgba(0,0,0,0.7)",
              maxWidth: "60ch",
              fontSize: 17,
              lineHeight: 1.55,
            }}
          >
            Print and ship these, then enter the tracking number for each one below. Submitting
            marks the orders shipped and emails the customers their tracking.
          </p>
          <dl
            className="mt-5 flex flex-wrap items-baseline gap-x-10 gap-y-3 border-t border-b border-ink-line py-5"
            style={{ color: "rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-baseline gap-3">
              <dt className="label-caps" style={{ fontSize: 13, letterSpacing: "0.08em" }}>
                Prints
              </dt>
              <dd style={{ color: "rgba(0,0,0,0.95)", fontSize: 24, fontWeight: 900 }}>
                {totalPrints}
              </dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="label-caps" style={{ fontSize: 13, letterSpacing: "0.08em" }}>
                Reprints
              </dt>
              <dd style={{ color: "rgba(0,0,0,0.95)", fontSize: 24, fontWeight: 900 }}>
                {reprintCount}
              </dd>
            </div>
          </dl>
          <span
            className="mt-6 inline-block"
            style={{
              background: "var(--btn-accent)",
              color: "#ffffff",
              padding: "14px 26px",
              fontSize: 17,
              letterSpacing: "0.03em",
              borderRadius: 2,
              fontWeight: 900,
              opacity: 0.6,
            }}
          >
            Download pick-list (PDF) → (preview-only)
          </span>
        </header>

        <section className="mt-8">
          <BatchTrackingTable token={STUB_TOKEN} rows={STUB_ROWS} />
        </section>

        <p className="mt-10 text-xs" style={{ color: "rgba(0,0,0,0.5)", textAlign: "center" }}>
          PREVIEW — Mark-all-sent and Submit-tracking actions won&rsquo;t work here (dummy token).
        </p>
      </div>
    </div>
  );
}
