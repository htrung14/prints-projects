/**
 * /admin/orders - list of all orders, filterable by status.
 *
 * Server component. Uses Track A's `listOrders` helper; filter comes from
 * `?status=`. Row links to the detail page.
 */

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listOrders } from "@/lib/supabase/queries/orders";
import { serverClient } from "@/lib/supabase/server";
import type { Order, OrderStatus } from "@/lib/types";
import { BatchButton } from "./BatchButton";

async function countItemsByOrder(orderIds: string[]): Promise<Record<string, number>> {
  if (orderIds.length === 0) return {};
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select("order_id, quantity")
    .in("order_id", orderIds);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as Array<{ order_id: string; quantity: number }>) {
    counts[row.order_id] = (counts[row.order_id] ?? 0) + row.quantity;
  }
  return counts;
}

function toPreview(
  orders: Order[],
  itemCounts: Record<string, number>
): Array<{
  id: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  currency: string;
  itemCount: number;
}> {
  return orders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    totalCents: o.totalCents,
    currency: o.currency,
    itemCount: itemCounts[o.id] ?? 0,
  }));
}

export const dynamic = "force-dynamic";

const STATUS_FILTERS: Array<OrderStatus | "all"> = [
  "all",
  "paid",
  "queued_for_print",
  "sent_to_print",
  "printed",
  "shipped",
  "delivered",
  "refunded",
  "cancelled",
];

function parseStatus(raw: string | string[] | undefined): OrderStatus | null {
  if (typeof raw !== "string") return null;
  const allowed: OrderStatus[] = [
    "paid",
    "queued_for_print",
    "sent_to_print",
    "printed",
    "shipped",
    "delivered",
    "refunded",
    "cancelled",
  ];
  return allowed.includes(raw as OrderStatus) ? (raw as OrderStatus) : null;
}

function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  return `${currency.toUpperCase()} ${amount}`;
}

function formatDate(iso: string): string {
  // Deterministic, compact format that doesn't depend on the server locale.
  // Render order date only (day-level granularity is enough for the list).
  const d = new Date(iso);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin("/admin/orders");
  const q = await searchParams;
  const status = parseStatus(q.status);
  const [orders, paidOrders] = await Promise.all([
    listOrders(status ? { status } : {}),
    listOrders({ status: "paid" }),
  ]);

  const paidItemCounts = await countItemsByOrder(paidOrders.map((o) => o.id));
  const paidPreview = toPreview(paidOrders, paidItemCounts);
  const printerEmail = process.env.PRINT_SHOP_EMAIL ?? null;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="h-display">Orders</h1>
        <span className="text-sm text-ink-faint">{orders.length} total</span>
      </header>

      {paidOrders.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm">
            {paidOrders.length} paid {paidOrders.length === 1 ? "order" : "orders"} ready to batch
          </span>
          <BatchButton
            paidOrdersCount={paidOrders.length}
            previewOrders={paidPreview}
            printerEmail={printerEmail}
          />
        </div>
      )}

      <nav className="flex flex-wrap gap-4 text-sm">
        {STATUS_FILTERS.map((f) => {
          const isActive = f === "all" ? status === null : status === f;
          const href =
            f === "all" ? "/admin/orders" : `/admin/orders?status=${encodeURIComponent(f)}`;
          return (
            <Link
              key={f}
              href={href}
              className={
                isActive ? "text-ink-strong underline underline-offset-4" : "text-ink-faint"
              }
            >
              {f.replace(/_/g, " ")}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <p className="text-sm text-ink-faint">No orders match this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-line text-left">
                <Th>Date</Th>
                <Th>Ref / ID</Th>
                <Th>Customer</Th>
                <Th className="text-right">Total</Th>
                <Th>Status</Th>
                <Th>Ship to</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const href = `/admin/orders/${o.id}`;
                // Row-as-link pattern: a single <Link> on the ID cell with a
                // ::before pseudo-element that stretches over the whole <tr>
                // (which is position:relative). One tab stop per row, whole
                // row clickable, clean for screen readers.
                return (
                  <tr key={o.id} className="relative border-b border-ink-line hover:bg-bg-soft">
                    <Td>{formatDate(o.createdAt)}</Td>
                    <Td>
                      <Link
                        href={href}
                        className="underline underline-offset-4 text-ink-strong before:absolute before:inset-0 before:content-['']"
                      >
                        {o.id.slice(0, 8)}
                      </Link>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="text-ink-strong">{o.customerName || "(no name)"}</span>
                        <span className="text-xs text-ink-faint">
                          {o.customerEmail || "(no email)"}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-right">{formatMoney(o.totalCents, o.currency)}</Td>
                    <Td>
                      <span className="label-caps">{o.status.replace(/_/g, " ")}</span>
                    </Td>
                    <Td>{o.shippingAddress.country}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`py-2 pr-4 text-xs font-[900] uppercase tracking-wider text-ink-faint ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 pr-4 align-top ${className ?? ""}`}>{children}</td>;
}
