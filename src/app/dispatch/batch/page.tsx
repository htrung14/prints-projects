/**
 * Weekly batch dispatch page. The printer can submit tracking for every pending
 * order in one sitting.
 *
 * Token kind must be `batch`. The orderId encoded in the token is not
 * checked against any specific row - the page lists all orders currently
 * in `paid` or `sent_to_print` status.
 */

import { verifyDispatchToken } from "@/lib/dispatch/token";
import type { Order } from "@/lib/types";
import { getDispatchItemsForOrders, listPendingDispatchOrders } from "@/lib/dispatch/queries";
import type { DispatchItem } from "@/lib/dispatch/queries";
import { BatchTrackingTable } from "@/components/dispatch/BatchTrackingTable";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DispatchBatchPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const tokenRaw = raw.token;
  const token = typeof tokenRaw === "string" ? tokenRaw : undefined;

  if (!token) return <InvalidShell reason="Missing token." />;
  const payload = verifyDispatchToken(token);
  if (!payload) return <InvalidShell reason="This link is invalid or has expired." />;
  if (payload.kind !== "batch") {
    return <InvalidShell reason="Token is not a batch dispatch token." />;
  }

  const orders = await listPendingDispatchOrders();
  const itemsByOrder = await getDispatchItemsForOrders(orders.map((o) => o.id));

  const totalPrints = orders.reduce((acc, o) => {
    const items = itemsByOrder.get(o.id) ?? [];
    return acc + items.reduce((n, i) => n + i.quantity, 0);
  }, 0);
  const reprintCount = orders.filter(
    (o) =>
      Boolean(o.parentOrderId) ||
      (typeof o.notes === "string" && o.notes.trimStart().toLowerCase().startsWith("reprint:"))
  ).length;

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
            Dispatch · This week&apos;s batch
          </span>
          <h1
            className="h-display-xl"
            style={{
              color: "rgba(0,0,0,0.95)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
            }}
          >
            {orders.length} pending order{orders.length === 1 ? "" : "s"}
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
          {/* Summary strip — orders · prints · reprints. */}
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
          {/* Picklist CTA — prominent. Michael uses this at the start of a
              batch to get a paper hand-out to his workstation. */}
          <a
            href={`/dispatch/batch/picklist?token=${token}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block"
            style={{
              background: "var(--btn-accent)",
              color: "#ffffff",
              textDecoration: "none",
              padding: "14px 26px",
              fontSize: 17,
              letterSpacing: "0.03em",
              borderRadius: 2,
              fontWeight: 900,
            }}
          >
            Download pick-list (PDF) →
          </a>
        </header>

        <section className="mt-8">
          {orders.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
              Nothing in the queue this week. Check back after the next drop.
            </p>
          ) : (
            <BatchTrackingTable
              token={token}
              rows={orders.map((o) => buildRow(o, itemsByOrder.get(o.id) ?? []))}
            />
          )}
        </section>
      </div>
    </div>
  );
}

type BatchRow = {
  orderId: string;
  shortId: string;
  customerName: string;
  shippingAddress: Order["shippingAddress"];
  items: Array<{
    id: string;
    title: string;
    sizeLabel: string;
    editionNumber: number;
    editionTotal: number;
  }>;
  initialCarrier: string | null;
  initialTrackingNumber: string | null;
  reprintLabel: string | null;
};

const REPRINT_REASON_MAX = 60;

function detectReprintLabel(order: Order): string | null {
  const isReprint =
    Boolean(order.parentOrderId) ||
    (typeof order.notes === "string" &&
      order.notes.trimStart().toLowerCase().startsWith("reprint:"));
  if (!isReprint) return null;
  const notes = order.notes ?? "";
  const match = notes.match(/^\s*reprint:\s*(.*?)(?:\.\s*parent order:.*)?$/i);
  const rawReason = match?.[1]?.trim() ?? "";
  if (!rawReason) return "REPRINT";
  const truncated =
    rawReason.length > REPRINT_REASON_MAX
      ? rawReason.slice(0, REPRINT_REASON_MAX) + "…"
      : rawReason;
  return `REPRINT · ${truncated}`;
}

function buildRow(order: Order, items: DispatchItem[]): BatchRow {
  return {
    orderId: order.id,
    shortId: order.id.slice(0, 8),
    customerName: order.customerName,
    shippingAddress: order.shippingAddress,
    items: items.map((i) => ({
      id: i.id,
      title: i.photoTitle,
      sizeLabel: i.sizeLabel,
      editionNumber: i.editionNumber,
      editionTotal: i.editionTotal,
    })),
    initialCarrier: order.carrier,
    initialTrackingNumber: order.trackingNumber,
    reprintLabel: detectReprintLabel(order),
  };
}

function InvalidShell({ reason }: { reason: string }) {
  return (
    <div
      style={{
        background: "var(--bg)",
        color: "rgba(0,0,0,0.78)",
        fontWeight: 900,
      }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-2xl px-6 py-20 md:px-10">
        <span className="label-caps">Dispatch</span>
        <h1
          className="h-display-xl"
          style={{
            color: "rgba(0,0,0,0.95)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
          }}
        >
          Access denied
        </h1>
        <p className="mt-4 text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
          {reason}
        </p>
      </div>
    </div>
  );
}
