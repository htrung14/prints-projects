/**
 * Weekly batch dispatch page. Rob can submit tracking for every pending
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

  return (
    <div
      style={{
        background: "#ffffff",
        color: "rgba(0,0,0,0.78)",
        fontWeight: 900,
      }}
      className="min-h-screen"
    >
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-16">
        <header className="flex flex-col gap-2">
          <span className="label-caps">Dispatch · Weekly digest</span>
          <h1
            className="h-display-xl"
            style={{
              color: "rgba(0,0,0,0.95)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
            }}
          >
            {orders.length} pending order{orders.length === 1 ? "" : "s"}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(0,0,0,0.6)", maxWidth: "60ch" }}>
            All orders currently paid or sent to print. Submit tracking per row, or populate all
            rows at once with <em>Apply to all</em>. Customer shipping addresses are below each row.
          </p>
        </header>

        <section className="mt-10 border-t border-ink-line pt-6">
          <p className="text-sm" aria-disabled style={{ color: "rgba(0,0,0,0.5)" }}>
            Bulk downloads (all TIFFs as a zip, all COAs as a zip) - TODO, out of scope for v1. Use
            the per-order page for now.
          </p>
        </section>

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
  itemCount: number;
  itemSummary: string;
  status: Order["status"];
  initialCarrier: string | null;
  initialTrackingNumber: string | null;
};

function buildRow(order: Order, items: DispatchItem[]): BatchRow {
  const firstThree = items.slice(0, 3).map((i) => `${i.photoTitle} (${i.sizeLabel})`);
  const rest = items.length > 3 ? ` +${items.length - 3} more` : "";
  return {
    orderId: order.id,
    shortId: order.id.slice(0, 8),
    customerName: order.customerName,
    shippingAddress: order.shippingAddress,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    itemSummary: firstThree.join(", ") + rest,
    status: order.status,
    initialCarrier: order.carrier,
    initialTrackingNumber: order.trackingNumber,
  };
}

function InvalidShell({ reason }: { reason: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
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
