/**
 * /admin/orders - list of all orders with search, filter, date range.
 *
 * Server component. Filters come from query params:
 *   ?status=paid|queued_for_print|sent_to_print|printed|shipped|delivered|refunded|cancelled
 *   ?q=<term>        (email ilike, name ilike, or order ID prefix)
 *   ?from=YYYY-MM-DD (created_at >=)
 *   ?to=YYYY-MM-DD   (created_at <=)
 *
 * Row links to the detail page via the stretched-link pattern (pseudo-element
 * over the <tr>). See the <Link> on the ID cell.
 *
 * TODO: pagination — the page currently renders every matching order. With
 * weekly batches this will eventually blow past a screen; add `.range()` +
 * page-number links once the list gets long enough to matter.
 */

import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { requireAdmin } from "@/lib/auth/session";
import { listOrders } from "@/lib/supabase/queries/orders";
import { serverClient } from "@/lib/supabase/server";
import { getPrinterEmail } from "@/lib/supabase/queries/settings";
import { alertSystemError } from "@/lib/alerting";
import type { Address, Order, OrderStatus } from "@/lib/types";
import { formatCountry } from "@/lib/countries";
import { BatchButton } from "./BatchButton";

async function countItemsByOrder(orderIds: string[]): Promise<Record<string, number>> {
  if (orderIds.length === 0) return {};
  const db = serverClient();
  const { data, error } = await db
    .from("order_items")
    .select("order_id, quantity")
    .in("order_id", orderIds);
  if (error) {
    const msg = `countItemsByOrder failed: ${error.message}`;
    console.error(`[admin/orders] ${msg}`);
    Sentry.captureException(new Error(msg), {
      tags: { pipeline: "admin-orders-page:count-items" },
      extra: { orderIdsCount: orderIds.length },
    });
    await alertSystemError("admin/orders:count-items", msg);
    return {};
  }
  if (!data) return {};
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

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------
//
// The bar shows the subset of statuses that matter day-to-day. "In print" is
// a virtual bucket that collapses queued_for_print + sent_to_print + printed
// into one tab — the printer-side workflow blurs the boundaries and admins
// usually want to see "anything currently with Loupe" in one view.
type FilterKey = "all" | "paid" | "in_print" | "shipped" | "delivered" | "refunded" | "cancelled";

const FILTER_BAR: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "in_print", label: "In print" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "refunded", label: "Refunded" },
  { key: "cancelled", label: "Cancelled" },
];

const IN_PRINT_STATUSES: OrderStatus[] = ["queued_for_print", "sent_to_print", "printed"];

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

function activeFilterKey(status: OrderStatus | null): FilterKey {
  if (status === null) return "all";
  if (IN_PRINT_STATUSES.includes(status)) return "in_print";
  switch (status) {
    case "paid":
    case "shipped":
    case "delivered":
    case "refunded":
    case "cancelled":
      return status;
    default:
      return "all";
  }
}

function filterHref(
  key: FilterKey,
  q: string | null,
  from: string | null,
  to: string | null
): string {
  const params = new URLSearchParams();
  if (key !== "all") {
    // "in_print" expands to its canonical first status in the URL; the query
    // logic treats `status=queued_for_print` as a sentinel for the virtual
    // bucket and widens it server-side.
    params.set("status", key === "in_print" ? "queued_for_print" : key);
  }
  if (q) params.set("q", q);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

// ---------------------------------------------------------------------------
// Date-range parsing
// ---------------------------------------------------------------------------

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string") return null;
  if (!DATE_PATTERN.test(raw)) return null;
  // Validate that it's a real calendar date (rejects 2026-13-40).
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return raw;
}

function parseQ(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  // Cap to a sane length so a pasted essay doesn't blow out the query.
  return trimmed.slice(0, 120);
}

// Country formatting comes from @/lib/countries (single source of truth shared
// with /checkout's dropdown). Adds a country there; it appears here for free.

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

// ---------------------------------------------------------------------------
// Filtered query
// ---------------------------------------------------------------------------
//
// Reimplements `listOrders` inline so we can chain `.gte`/`.lte`/`.ilike`/`.or`
// conditionally. Keeps the same column set + sort order. On error, returns
// a FilterError sentinel so the caller can render an inline banner rather
// than crashing the page.
type FilterError = { kind: "error"; message: string };
type FilteredOrders = { kind: "ok"; orders: Order[] };

const ORDER_COLUMNS =
  "id, created_at, stripe_checkout_session_id, stripe_payment_intent_id, customer_email, customer_name, shipping_address, subtotal_cents, tax_cents, shipping_cents, total_cents, currency, status, fulfillment_token, fulfillment_token_revoked_at, print_job_email_sent_at, tracking_number, carrier, notes";

const REF_PREFIX_PATTERN = /^[0-9a-f]{1,8}$/i;

async function fetchFilteredOrders(params: {
  status: OrderStatus | null;
  inPrintBucket: boolean;
  q: string | null;
  from: string | null;
  to: string | null;
}): Promise<FilteredOrders | FilterError> {
  const db = serverClient();
  let query = db.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false });

  if (params.inPrintBucket) {
    query = query.in("status", IN_PRINT_STATUSES);
  } else if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.from) {
    // from/to are UTC day boundaries. `to` is inclusive of the whole day.
    query = query.gte("created_at", `${params.from}T00:00:00Z`);
  }
  if (params.to) {
    query = query.lte("created_at", `${params.to}T23:59:59Z`);
  }

  if (params.q) {
    // Build an OR across email ilike / name ilike / id-prefix range.
    // PostgREST's `.or(...)` wants a comma-separated list of conditions.
    // The attacker surface is only `,()*\:` (filter-grammar terminators and
    // ilike wildcards); every other character — including apostrophes
    // ("O'Brien") and non-ASCII letters ("Müller", "Jiří") — is safe inside
    // the ilike value and MUST be preserved or admin can't search real names.
    // Block specifically and keep Unicode letters + digits + a few helpers.
    const sanitized = params.q.replace(/[,()*\\:]/g, "").trim();
    const pattern = `*${sanitized}*`;
    const clauses: string[] = [`customer_email.ilike.${pattern}`, `customer_name.ilike.${pattern}`];

    // If the term looks like a UUID first-segment prefix (1-8 hex chars),
    // also try to match on ID range. Can't use ilike on uuid columns, so
    // we use the same [lo, hi) UUID-range trick as getOrderByRefPrefix.
    if (REF_PREFIX_PATTERN.test(sanitized)) {
      const padded = sanitized.toLowerCase().padEnd(8, "0");
      const prefixInt = parseInt(padded, 16);
      const lowerBound = `${padded}-0000-0000-0000-000000000000`;
      if (sanitized.length === 8 && prefixInt < 0xffffffff) {
        const upper = (prefixInt + 1).toString(16).padStart(8, "0");
        const upperBound = `${upper}-0000-0000-0000-000000000000`;
        clauses.push(`and(id.gte.${lowerBound},id.lt.${upperBound})`);
      } else if (sanitized.length < 8) {
        // Partial prefix: upper bound increments the first hex digit range
        // filled by the prefix. Pad with "f"s to get the inclusive upper
        // end, then +1 and pad back.
        const upperPad = sanitized.toLowerCase().padEnd(8, "f");
        const upperInt = parseInt(upperPad, 16) + 1;
        if (upperInt <= 0xffffffff) {
          const upperBound = `${upperInt.toString(16).padStart(8, "0")}-0000-0000-0000-000000000000`;
          clauses.push(`and(id.gte.${lowerBound},id.lt.${upperBound})`);
        } else {
          clauses.push(`id.gte.${lowerBound}`);
        }
      } else {
        clauses.push(`id.gte.${lowerBound}`);
      }
    }

    query = query.or(clauses.join(","));
  }

  const { data, error } = await query;
  if (error) {
    const msg = `listOrders (filtered) failed: ${error.message}`;
    console.error(`[admin/orders] ${msg}`);
    Sentry.captureException(new Error(msg), {
      tags: { pipeline: "admin-orders-page:filter" },
      extra: { params },
    });
    await alertSystemError("admin/orders:filter", msg);
    return { kind: "error", message: error.message };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    created_at: string;
    stripe_checkout_session_id: string;
    stripe_payment_intent_id: string | null;
    customer_email: string;
    customer_name: string;
    shipping_address: unknown;
    subtotal_cents: number;
    tax_cents: number;
    shipping_cents: number;
    total_cents: number;
    currency: string;
    status: string;
    fulfillment_token: string;
    fulfillment_token_revoked_at: string | null;
    print_job_email_sent_at: string | null;
    tracking_number: string | null;
    carrier: string | null;
    notes: string | null;
  }>;

  // Defensive mapping — a malformed row shouldn't take the whole page down.
  const orders: Order[] = [];
  for (const row of rows) {
    try {
      orders.push({
        id: row.id,
        createdAt: row.created_at,
        stripeCheckoutSessionId: row.stripe_checkout_session_id,
        stripePaymentIntentId: row.stripe_payment_intent_id,
        customerEmail: row.customer_email,
        customerName: row.customer_name,
        shippingAddress: parseAddressLoose(row.shipping_address),
        subtotalCents: row.subtotal_cents,
        taxCents: row.tax_cents,
        shippingCents: row.shipping_cents,
        totalCents: row.total_cents,
        currency: row.currency,
        status: narrowStatusLoose(row.status),
        fulfillmentToken: row.fulfillment_token,
        fulfillmentTokenRevokedAt: row.fulfillment_token_revoked_at,
        printJobEmailSentAt: row.print_job_email_sent_at,
        trackingNumber: row.tracking_number,
        carrier: row.carrier,
        notes: row.notes,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[admin/orders] skipped malformed order ${row.id}: ${errMsg}`);
      Sentry.captureException(err, {
        tags: { pipeline: "admin-orders-page:parse-row" },
        extra: { orderId: row.id },
      });
      await alertSystemError("admin/orders:parse-row", `Order ${row.id}: ${errMsg}`);
    }
  }

  return { kind: "ok", orders };
}

function parseAddressLoose(raw: unknown): Address {
  // Permissive version of the strict parser in queries/orders.ts — we'd
  // rather render a row with partial data than drop it from the admin
  // list. The strict parser runs at write time, so bad rows are rare.
  if (typeof raw !== "object" || raw === null) {
    return {
      name: "",
      line1: "",
      line2: null,
      city: "",
      state: null,
      postalCode: "",
      country: "",
    };
  }
  const rec = raw as Record<string, unknown>;
  const str = (k: string): string => (typeof rec[k] === "string" ? (rec[k] as string) : "");
  const strOrNull = (k: string): string | null =>
    typeof rec[k] === "string" ? (rec[k] as string) : null;
  return {
    name: str("name"),
    line1: str("line1"),
    line2: strOrNull("line2"),
    city: str("city"),
    state: strOrNull("state"),
    postalCode: str("postalCode"),
    country: str("country"),
  };
}

function narrowStatusLoose(status: string): OrderStatus {
  switch (status) {
    case "paid":
    case "queued_for_print":
    case "sent_to_print":
    case "printed":
    case "shipped":
    case "delivered":
    case "refunded":
    case "cancelled":
      return status;
    default:
      // Unknown status → treat as "paid" for display. Caller already
      // alerted on parse failure above; this just keeps the row visible
      // instead of throwing.
      return "paid";
  }
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin("/admin/orders");
  const q = await searchParams;
  const status = parseStatus(q.status);
  const qTerm = parseQ(q.q);
  const from = parseDate(q.from);
  const to = parseDate(q.to);
  const inPrintBucket = status !== null && IN_PRINT_STATUSES.includes(status);

  // Guard against `from > to` — silently returning zero rows is a worse UX
  // than showing an unfiltered list with a heads-up banner. When invalid,
  // drop the date-range portion of the query entirely.
  const dateRangeInvalid = from !== null && to !== null && from > to;
  const effectiveFrom = dateRangeInvalid ? null : from;
  const effectiveTo = dateRangeInvalid ? null : to;

  // Paid-orders preview for the batch button is always unfiltered (it's the
  // fixed "what would get batched right now" view, independent of what the
  // admin is currently scrolling).
  const [filtered, paidOrders] = await Promise.all([
    fetchFilteredOrders({
      status,
      inPrintBucket,
      q: qTerm,
      from: effectiveFrom,
      to: effectiveTo,
    }),
    listOrders({ status: "paid" }),
  ]);

  const orders = filtered.kind === "ok" ? filtered.orders : [];
  const filterError = filtered.kind === "error" ? filtered.message : null;

  const paidItemCounts = await countItemsByOrder(paidOrders.map((o) => o.id));
  const paidPreview = toPreview(paidOrders, paidItemCounts);
  // DB setting (editable at /admin/settings) with env fallback.
  const printerEmail = await getPrinterEmail();

  const activeKey = activeFilterKey(status);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="h-display">Orders</h1>
        <span className="text-sm text-ink-faint">{orders.length} shown</span>
      </header>

      {filterError && (
        <div
          role="alert"
          className="border border-ink-line bg-bg-soft px-4 py-3 text-sm text-ink-strong"
        >
          <strong className="label-caps">Query failed.</strong>{" "}
          <span className="text-ink-faint">
            The database returned an error: {filterError}. Try clearing filters or retrying.
          </span>
        </div>
      )}

      {dateRangeInvalid && (
        <div
          role="alert"
          className="border border-ink-line bg-bg-soft px-4 py-3 text-sm text-ink-strong"
        >
          <strong className="label-caps">Invalid range.</strong>{" "}
          <span className="text-ink-faint">
            From date cannot be after to date — showing unfiltered results.
          </span>
        </div>
      )}

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

      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {FILTER_BAR.map((f, i) => {
          const isActive = f.key === activeKey;
          const href = filterHref(f.key, qTerm, from, to);
          return (
            <span key={f.key} className="flex items-center gap-5">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "text-ink-strong font-medium underline decoration-[var(--btn-accent)] decoration-2 underline-offset-4"
                    : "text-ink-faint hover:text-ink-strong"
                }
              >
                {f.label}
              </Link>
              {i < FILTER_BAR.length - 1 && (
                <span aria-hidden="true" className="text-ink-faint">
                  ·
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <form
        method="get"
        action="/admin/orders"
        className="flex flex-wrap items-end gap-3 border border-ink-line px-4 py-3 text-sm"
      >
        {/* Preserve the current status tab across search submissions. Emit
            the sentinel value that `filterHref` uses for the active tab so
            the virtual "in_print" bucket doesn't collapse to a single status
            on submit. */}
        {activeKey !== "all" && (
          <input
            type="hidden"
            name="status"
            value={activeKey === "in_print" ? "queued_for_print" : activeKey}
          />
        )}

        <label className="flex flex-col gap-1">
          <span className="label-caps text-xs">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={qTerm ?? ""}
            placeholder="Email, name, or ID prefix"
            className="min-w-[14rem] border border-ink-line bg-transparent px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="label-caps text-xs">From</span>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ""}
            className="border border-ink-line bg-transparent px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="label-caps text-xs">To</span>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="border border-ink-line bg-transparent px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          className="border border-ink-line px-4 py-2 text-sm text-ink-strong hover:bg-bg-soft"
        >
          Apply
        </button>

        {(qTerm || from || to) && (
          <Link
            href={filterHref(activeKey, null, null, null)}
            className="px-2 py-2 text-sm text-ink-faint underline underline-offset-4 hover:text-ink-strong"
          >
            Clear
          </Link>
        )}
      </form>

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
                    <Td>{formatCountry(o.shippingAddress.country)}</Td>
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
